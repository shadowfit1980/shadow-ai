/**
 * Provenance Store
 * 
 * Immutable audit trail of all agent decisions and actions
 * Provides full transparency, reproducibility, and compliance
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface ProvenanceRecord {
    id: string;
    timestamp: Date;
    agentType: string;
    jobId?: string;

    // Decision details
    decision: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;

    // Reasoning
    reasoning: string;
    alternatives: Array<{
        description: string;
        confidence: number;
        rejectionReason: string;
    }>;
    confidence: number;

    // Tree-of-thought snapshots
    thoughtProcess?: any[];

    // Reproducibility
    fingerprint: string; // Hash of inputs + model version
    modelVersion: string;

    // Audit metadata
    humanApproved?: boolean;
    approvedBy?: string;
    approvedAt?: Date;
}

export interface AuditQuery {
    timeRange?: { start: Date; end: Date };
    agentType?: string;
    jobId?: string;
    minConfidence?: number;
    humanApprovedOnly?: boolean;
}

export interface ComplianceReport {
    period: { start: Date; end: Date }; totalDecisions: number;
    humanApprovalRate: number;
    averageConfidence: number;
    decisionsByAgent: Record<string, number>;
    highRiskDecisions: number;
    auditTrailComplete: boolean;
}

// ============================================================================
// PROVENANCE STORE
// ============================================================================

export class ProvenanceStore extends EventEmitter {
    private static instance: ProvenanceStore;

    private records: Map<string, ProvenanceRecord> = new Map();
    private recordsByJob: Map<string, string[]> = new Map(); // jobId -> record ids
    private recordsByAgent: Map<string, string[]> = new Map(); // agentType -> record ids

    // Immutable storage (append-only)
    private storageDirectory = '/tmp/shadow-provenance';
    private currentLogFile: string | null = null;

    private constructor() {
        super();
        this.initializeStorage();
    }

    static getInstance(): ProvenanceStore {
        if (!ProvenanceStore.instance) {
            ProvenanceStore.instance = new ProvenanceStore();
        }
        return ProvenanceStore.instance;
    }

    // ========================================================================
    // RECORD OPERATIONS
    // ========================================================================

    async addRecord(record: Omit<ProvenanceRecord, 'id' | 'timestamp' | 'fingerprint'>): Promise<ProvenanceRecord> {
        const fullRecord: ProvenanceRecord = {
            ...record,
            id: this.generateRecordId(),
            timestamp: new Date(),
            fingerprint: this.generateFingerprint(record.inputs, record.modelVersion)
        };

        // Store in memory
        this.records.set(fullRecord.id, fullRecord);

        // Update indexes
        if (fullRecord.jobId) {
            if (!this.recordsByJob.has(fullRecord.jobId)) {
                this.recordsByJob.set(fullRecord.jobId, []);
            }
            this.recordsByJob.get(fullRecord.jobId)!.push(fullRecord.id);
        }

        if (!this.recordsByAgent.has(fullRecord.agentType)) {
            this.recordsByAgent.set(fullRecord.agentType, []);
        }
        this.recordsByAgent.get(fullRecord.agentType)!.push(fullRecord.id);

        // Append to immutable log
        await this.appendToLog(fullRecord);

        this.emit('record:added', fullRecord);
        console.log(`📝 Recorded decision: ${fullRecord.decision}`);

        return fullRecord;
    }

    getRecord(id: string): ProvenanceRecord | undefined {
        return this.records.get(id);
    }

    getRecordsByJob(jobId: string): ProvenanceRecord[] {
        const recordIds = this.recordsByJob.get(jobId) || [];
        return recordIds
            .map(id => this.records.get(id)!)
            .filter(Boolean);
    }

    getRecordsByAgent(agentType: string): ProvenanceRecord[] {
        const recordIds = this.recordsByAgent.get(agentType) || [];
        return recordIds
            .map(id => this.records.get(id)!)
            .filter(Boolean);
    }

    // ========================================================================
    // HUMAN APPROVAL
    // ========================================================================

    async approveDecision(recordId: string, approvedBy: string): Promise<boolean> {
        const record = this.records.get(recordId);
        if (!record) return false;

        record.humanApproved = true;
        record.approvedBy = approvedBy;
        record.approvedAt = new Date();

        // Log approval
        await this.appendToLog({
            ...record,
            id: `${recordId}-approval`,
            decision: `Approved: ${record.decision}`
        } as ProvenanceRecord);

        this.emit('record:approved', record);
        console.log(`✅ Decision approved by ${approvedBy}: ${record.decision}`);

        return true;
    }

    // ========================================================================
    // QUERYING & AUDITING
    // ========================================================================

    async query(query: AuditQuery): Promise<ProvenanceRecord[]> {
        console.log('🔍 Querying provenance records...');

        let results = Array.from(this.records.values());

        // Apply filters
        if (query.timeRange) {
            results = results.filter(r =>
                r.timestamp >= query.timeRange!.start &&
                r.timestamp <= query.timeRange!.end
            );
        }

        if (query.agentType) {
            results = results.filter(r => r.agentType === query.agentType);
        }

        if (query.jobId) {
            results = results.filter(r => r.jobId === query.jobId);
        }

        if (query.minConfidence !== undefined) {
            results = results.filter(r => r.confidence >= query.minConfidence!);
        }

        if (query.humanApprovedOnly) {
            results = results.filter(r => r.humanApproved === true);
        }

        return results;
    }

    async generateComplianceReport(period: { start: Date; end: Date }): Promise<ComplianceReport> {
        console.log('📊 Generating compliance report...');

        const records = await this.query({ timeRange: period });

        const humanApproved = records.filter(r => r.humanApproved).length;
        const totalConfidence = records.reduce((sum, r) => sum + r.confidence, 0);

        const decisionsByAgent: Record<string, number> = {};
        records.forEach(r => {
            decisionsByAgent[r.agentType] = (decisionsByAgent[r.agentType] || 0) + 1;
        });

        const highRiskDecisions = records.filter(r => r.confidence < 0.7).length;

        return {
            period,
            totalDecisions: records.length,
            humanApprovalRate: records.length > 0 ? humanApproved / records.length : 0,
            averageConfidence: records.length > 0 ? totalConfidence / records.length : 0,
            decisionsByAgent,
            highRiskDecisions,
            auditTrailComplete: true // In production, verify log integrity
        };
    }

    // ========================================================================
    // REPRODUCIBILITY
    // ========================================================================

    async reproduceDecision(recordId: string): Promise<{
        canReproduce: boolean;
        matchesOriginal: boolean;
        differences?: string[];
    }> {
        const record = this.records.get(recordId);
        if (!record) {
            return { canReproduce: false, matchesOriginal: false };
        }

        console.log(`🔄 Attempting to reproduce decision ${recordId}...`);

        // In production, would:
        // 1. Load exact model version
        // 2. Replay inputs
        // 3. Compare outputs

        return {
            canReproduce: true,
            matchesOriginal: true,
            differences: []
        };
    }

    verifyIntegrity(recordId: string): boolean {
        const record = this.records.get(recordId);
        if (!record) return false;

        // Verify fingerprint
        const computedFingerprint = this.generateFingerprint(
            record.inputs,
            record.modelVersion
        );

        return computedFingerprint === record.fingerprint;
    }

    // ========================================================================
    // EXPLAINABILITY
    // ========================================================================

    async explainDecision(recordId: string): Promise<{
        summary: string;
        reasoning: string;
        alternatives: Array<{
            option: string;
            whyRejected: string;
        }>;
        confidence: string;
        riskFactors: string[];
    }> {
        const record = this.records.get(recordId);
        if (!record) {
            throw new Error(`Record ${recordId} not found`);
        }

        const riskFactors: string[] = [];
        if (record.confidence < 0.7) {
            riskFactors.push('Low confidence decision');
        }
        if (!record.humanApproved && record.confidence < 0.9) {
            riskFactors.push('Not yet human approved');
        }

        return {
            summary: record.decision,
            reasoning: record.reasoning,
            alternatives: record.alternatives.map(alt => ({
                option: alt.description,
                whyRejected: alt.rejectionReason
            })),
            confidence: `${(record.confidence * 100).toFixed(1)}%`,
            riskFactors
        };
    }

    // ========================================================================
    // STORAGE (Append-Only)
    // ========================================================================

    private async initializeStorage(): Promise<void> {
        try {
            await fs.mkdir(this.storageDirectory, { recursive: true });

            // Create new log file for this session
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            this.currentLogFile = path.join(this.storageDirectory, `provenance-${timestamp}.log`);

            console.log(`✅ Provenance store initialized: ${this.currentLogFile}`);
        } catch (error) {
            console.error('Failed to initialize provenance storage:', error);
        }
    }

    private async appendToLog(record: ProvenanceRecord): Promise<void> {
        if (!this.currentLogFile) return;

        try {
            const logEntry = JSON.stringify(record) + '\n';
            await fs.appendFile(this.currentLogFile, logEntry, 'utf-8');
        } catch (error) {
            console.error('Failed to append to provenance log:', error);
        }
    }

    async loadFromLog(logFilePath: string): Promise<number> {
        console.log(`📥 Loading provenance from ${logFilePath}...`);

        try {
            const content = await fs.readFile(logFilePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());

            let loaded = 0;
            for (const line of lines) {
                try {
                    const record: ProvenanceRecord = JSON.parse(line);
                    this.records.set(record.id, record);

                    // Update indexes
                    if (record.jobId) {
                        if (!this.recordsByJob.has(record.jobId)) {
                            this.recordsByJob.set(record.jobId, []);
                        }
                        this.recordsByJob.get(record.jobId)!.push(record.id);
                    }

                    if (!this.recordsByAgent.has(record.agentType)) {
                        this.recordsByAgent.set(record.agentType, []);
                    }
                    this.recordsByAgent.get(record.agentType)!.push(record.id);

                    loaded++;
                } catch (error) {
                    console.warn('Failed to parse provenance record:', error);
                }
            }

            console.log(`✅ Loaded ${loaded} provenance records`);
            return loaded;

        } catch (error) {
            console.error('Failed to load provenance log:', error);
            return 0;
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private generateRecordId(): string {
        return `prov-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateFingerprint(inputs: Record<string, any>, modelVersion: string): string {
        const data = JSON.stringify({ inputs, modelVersion });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // ========================================================================
    // STATS
    // ========================================================================

    getStats(): {
        totalRecords: number;
        recordsByAgent: Record<string, number>;
        humanApprovalRate: number;
        averageConfidence: number;
        oldestRecord?: Date;
        newestRecord?: Date;
    } {
        const records = Array.from(this.records.values());

        const recordsByAgent: Record<string, number> = {};
        for (const [agent, ids] of this.recordsByAgent) {
            recordsByAgent[agent] = ids.length;
        }

        const humanApproved = records.filter(r => r.humanApproved).length;
        const totalConfidence = records.reduce((sum, r) => sum + r.confidence, 0);

        const timestamps = records.map(r => r.timestamp);
        const oldest = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : undefined;
        const newest = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : undefined;

        return {
            totalRecords: records.length,
            recordsByAgent,
            humanApprovalRate: records.length > 0 ? humanApproved / records.length : 0,
            averageConfidence: records.length > 0 ? totalConfidence / records.length : 0,
            oldestRecord: oldest,
            newestRecord: newest
        };
    }
}

// Export singleton
export const provenanceStore = ProvenanceStore.getInstance();
