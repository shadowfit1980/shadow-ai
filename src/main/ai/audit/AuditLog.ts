/**
 * Action Audit Log
 * 
 * Tracks all agent actions for security, debugging, and compliance
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AuditEntry {
    id: string;
    timestamp: Date;
    action: string;
    agent: string;
    user?: string;
    details: Record<string, any>;
    result: 'success' | 'failure' | 'blocked' | 'pending';
    duration?: number;
    metadata: {
        ip?: string;
        sessionId?: string;
        projectId?: string;
    };
}

export interface AuditFilter {
    action?: string;
    agent?: string;
    result?: AuditEntry['result'];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

export interface AuditStats {
    total: number;
    byAction: Record<string, number>;
    byAgent: Record<string, number>;
    byResult: Record<string, number>;
    avgDuration: number;
}

/**
 * AuditLog tracks all agent actions
 */
export class AuditLog extends EventEmitter {
    private static instance: AuditLog;
    private entries: AuditEntry[] = [];
    private storagePath: string;
    private maxEntries: number = 10000;

    private constructor() {
        super();
        this.storagePath = path.join(process.cwd(), '.shadow-audit');
        this.loadFromDisk();
    }

    static getInstance(): AuditLog {
        if (!AuditLog.instance) {
            AuditLog.instance = new AuditLog();
        }
        return AuditLog.instance;
    }

    /**
     * Log an action
     */
    log(params: {
        action: string;
        agent: string;
        user?: string;
        details?: Record<string, any>;
        result: AuditEntry['result'];
        duration?: number;
        metadata?: AuditEntry['metadata'];
    }): AuditEntry {
        const entry: AuditEntry = {
            id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date(),
            action: params.action,
            agent: params.agent,
            user: params.user,
            details: params.details || {},
            result: params.result,
            duration: params.duration,
            metadata: params.metadata || {},
        };

        this.entries.push(entry);
        this.emit('entry:logged', entry);

        // Trim if too many entries
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }

        this.scheduleSave();
        return entry;
    }

    /**
     * Query audit entries
     */
    query(filter?: AuditFilter): AuditEntry[] {
        let results = [...this.entries];

        if (filter?.action) {
            results = results.filter(e => e.action.includes(filter.action!));
        }
        if (filter?.agent) {
            results = results.filter(e => e.agent === filter.agent);
        }
        if (filter?.result) {
            results = results.filter(e => e.result === filter.result);
        }
        if (filter?.startDate) {
            results = results.filter(e => e.timestamp >= filter.startDate!);
        }
        if (filter?.endDate) {
            results = results.filter(e => e.timestamp <= filter.endDate!);
        }

        // Sort newest first
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (filter?.limit) {
            results = results.slice(0, filter.limit);
        }

        return results;
    }

    /**
     * Get statistics
     */
    getStats(): AuditStats {
        const byAction: Record<string, number> = {};
        const byAgent: Record<string, number> = {};
        const byResult: Record<string, number> = {};
        let totalDuration = 0;
        let durationCount = 0;

        for (const entry of this.entries) {
            byAction[entry.action] = (byAction[entry.action] || 0) + 1;
            byAgent[entry.agent] = (byAgent[entry.agent] || 0) + 1;
            byResult[entry.result] = (byResult[entry.result] || 0) + 1;

            if (entry.duration) {
                totalDuration += entry.duration;
                durationCount++;
            }
        }

        return {
            total: this.entries.length,
            byAction,
            byAgent,
            byResult,
            avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
        };
    }

    /**
     * Get recent entries
     */
    getRecent(limit: number = 50): AuditEntry[] {
        return this.entries.slice(-limit).reverse();
    }

    /**
     * Clear old entries
     */
    clearOlderThan(date: Date): number {
        const before = this.entries.length;
        this.entries = this.entries.filter(e => e.timestamp > date);
        this.scheduleSave();
        return before - this.entries.length;
    }

    /**
     * Export entries
     */
    export(filter?: AuditFilter): AuditEntry[] {
        return this.query(filter);
    }

    // Persistence
    private saveDebounce: NodeJS.Timeout | null = null;

    private scheduleSave(): void {
        if (this.saveDebounce) clearTimeout(this.saveDebounce);
        this.saveDebounce = setTimeout(() => this.saveToDisk(), 5000);
    }

    private async saveToDisk(): Promise<void> {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            await fs.writeFile(
                path.join(this.storagePath, 'audit.json'),
                JSON.stringify(this.entries, null, 2)
            );
        } catch (error: any) {
            console.error('Failed to save audit log:', error.message);
        }
    }

    private async loadFromDisk(): Promise<void> {
        try {
            const content = await fs.readFile(
                path.join(this.storagePath, 'audit.json'),
                'utf-8'
            );
            const data = JSON.parse(content);
            this.entries = data.map((e: any) => ({
                ...e,
                timestamp: new Date(e.timestamp),
            }));
            console.log(`📋 [AuditLog] Loaded ${this.entries.length} entries`);
        } catch {
            // File doesn't exist yet
        }
    }
}

export default AuditLog;
