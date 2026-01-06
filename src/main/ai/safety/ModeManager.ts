/**
 * ModeManager - Human-in-the-Loop Control
 * 
 * Implements ChatGPT's suggestion for three operating modes:
 * - Autonomous: Agent acts fully within safe boundaries
 * - Assist: Agent suggests, human approves each step
 * - Audit: Agent performs, logs extensively for review
 */

import { EventEmitter } from 'events';
import { PolicyStore } from './PolicyStore';

export type OperatingMode = 'autonomous' | 'assist' | 'audit';

export interface ModeConfig {
    mode: OperatingMode;
    safeBoundaries: SafeBoundary[];
    approvalRequired: ApprovalRule[];
    auditLevel: 'minimal' | 'standard' | 'verbose';
    maxAutonomyRisk: 'low' | 'medium' | 'high';
}

export interface SafeBoundary {
    type: 'action' | 'resource' | 'scope' | 'time';
    limit: any;
    description: string;
}

export interface ApprovalRule {
    condition: string;
    requiredApprover: 'user' | 'admin' | 'auto';
    timeout?: number;
}

export interface PendingAction {
    id: string;
    agent: string;
    action: string;
    description: string;
    risk: 'low' | 'medium' | 'high' | 'critical';
    context: Record<string, any>;
    suggestedAt: Date;
    expiresAt?: Date;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface AuditEntry {
    id: string;
    timestamp: Date;
    mode: OperatingMode;
    agent: string;
    action: string;
    input: any;
    output?: any;
    approved: boolean;
    approvedBy?: string;
    duration: number;
    notes?: string;
}

/**
 * ModeManager controls agent autonomy and human oversight
 */
export class ModeManager extends EventEmitter {
    private static instance: ModeManager;
    private currentMode: OperatingMode = 'assist';
    private config: ModeConfig;
    private pendingActions: Map<string, PendingAction> = new Map();
    private auditLog: AuditEntry[] = [];
    private policyStore: PolicyStore;
    private approvalCallbacks: Map<string, (approved: boolean, notes?: string) => void> = new Map();

    private constructor() {
        super();
        this.policyStore = PolicyStore.getInstance();
        this.config = this.getDefaultConfig('assist');
    }

    static getInstance(): ModeManager {
        if (!ModeManager.instance) {
            ModeManager.instance = new ModeManager();
        }
        return ModeManager.instance;
    }

    /**
     * Get default configuration for a mode
     */
    private getDefaultConfig(mode: OperatingMode): ModeConfig {
        switch (mode) {
            case 'autonomous':
                return {
                    mode: 'autonomous',
                    safeBoundaries: [
                        { type: 'action', limit: ['read', 'analyze', 'suggest', 'generate', 'test'], description: 'Only non-destructive actions' },
                        { type: 'resource', limit: { maxFiles: 50, maxTokens: 100000 }, description: 'Resource limits' },
                        { type: 'scope', limit: 'current_project', description: 'Stay within project' },
                    ],
                    approvalRequired: [
                        { condition: 'deploy', requiredApprover: 'user' },
                        { condition: 'delete', requiredApprover: 'user' },
                        { condition: 'external_api', requiredApprover: 'auto', timeout: 5000 },
                    ],
                    auditLevel: 'standard',
                    maxAutonomyRisk: 'medium',
                };

            case 'assist':
                return {
                    mode: 'assist',
                    safeBoundaries: [
                        { type: 'action', limit: ['read', 'analyze', 'suggest'], description: 'Suggest only' },
                    ],
                    approvalRequired: [
                        { condition: 'write', requiredApprover: 'user' },
                        { condition: 'execute', requiredApprover: 'user' },
                        { condition: 'any_change', requiredApprover: 'user' },
                    ],
                    auditLevel: 'minimal',
                    maxAutonomyRisk: 'low',
                };

            case 'audit':
                return {
                    mode: 'audit',
                    safeBoundaries: [
                        { type: 'action', limit: ['read', 'analyze', 'suggest', 'generate', 'write', 'execute'], description: 'All actions allowed' },
                        { type: 'resource', limit: { maxFiles: 200, maxTokens: 500000 }, description: 'Extended limits' },
                    ],
                    approvalRequired: [
                        { condition: 'deploy', requiredApprover: 'user' },
                        { condition: 'delete_critical', requiredApprover: 'admin' },
                    ],
                    auditLevel: 'verbose',
                    maxAutonomyRisk: 'high',
                };
        }
    }

    /**
     * Set operating mode
     */
    setMode(mode: OperatingMode): void {
        const oldMode = this.currentMode;
        this.currentMode = mode;
        this.config = this.getDefaultConfig(mode);

        console.log(`🔄 [ModeManager] Mode changed: ${oldMode} → ${mode}`);
        this.emit('modeChanged', { oldMode, newMode: mode, config: this.config });
    }

    /**
     * Get current mode
     */
    getMode(): OperatingMode {
        return this.currentMode;
    }

    /**
     * Get current configuration
     */
    getConfig(): ModeConfig {
        return { ...this.config };
    }

    /**
     * Check if an action is allowed in current mode
     */
    async checkAction(params: {
        agent: string;
        action: string;
        context?: Record<string, any>;
    }): Promise<{
        allowed: boolean;
        requiresApproval: boolean;
        reason?: string;
    }> {
        const { agent, action, context } = params;

        // Check policy store first
        const safetyCheck = await this.policyStore.checkAction({ agent, action, context });
        if (!safetyCheck.passed) {
            return {
                allowed: false,
                requiresApproval: false,
                reason: `Policy violation: ${safetyCheck.violations.map(v => v.policyName).join(', ')}`,
            };
        }

        // Check safe boundaries
        const withinBoundaries = this.isWithinBoundaries(action);
        if (!withinBoundaries) {
            if (this.currentMode === 'autonomous') {
                return {
                    allowed: false,
                    requiresApproval: true,
                    reason: 'Action outside autonomous boundaries',
                };
            }
        }

        // Check if approval needed
        const needsApproval = this.needsApproval(action);
        if (needsApproval && this.currentMode !== 'audit') {
            return {
                allowed: true,
                requiresApproval: true,
                reason: 'Approval required for this action',
            };
        }

        return { allowed: true, requiresApproval: false };
    }

    /**
     * Request user approval for an action
     */
    async requestApproval(params: {
        agent: string;
        action: string;
        description: string;
        risk: PendingAction['risk'];
        context?: Record<string, any>;
        timeout?: number;
    }): Promise<{ approved: boolean; notes?: string }> {
        const id = `pa-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const pendingAction: PendingAction = {
            id,
            agent: params.agent,
            action: params.action,
            description: params.description,
            risk: params.risk,
            context: params.context || {},
            suggestedAt: new Date(),
            expiresAt: params.timeout ? new Date(Date.now() + params.timeout) : undefined,
            status: 'pending',
        };

        this.pendingActions.set(id, pendingAction);
        this.emit('approvalRequested', pendingAction);

        console.log(`⏳ [ModeManager] Approval requested: ${params.action} (${params.risk} risk)`);

        return new Promise((resolve) => {
            this.approvalCallbacks.set(id, (approved, notes) => {
                pendingAction.status = approved ? 'approved' : 'rejected';
                resolve({ approved, notes });
            });

            // Handle timeout
            if (params.timeout) {
                setTimeout(() => {
                    if (pendingAction.status === 'pending') {
                        pendingAction.status = 'expired';
                        this.approvalCallbacks.delete(id);
                        resolve({ approved: false, notes: 'Approval timed out' });
                    }
                }, params.timeout);
            }
        });
    }

    /**
     * Approve a pending action
     */
    approveAction(actionId: string, approver: string, notes?: string): boolean {
        const pending = this.pendingActions.get(actionId);
        if (!pending || pending.status !== 'pending') return false;

        pending.status = 'approved';

        const callback = this.approvalCallbacks.get(actionId);
        if (callback) {
            callback(true, notes);
            this.approvalCallbacks.delete(actionId);
        }

        // Log to audit
        this.addAuditEntry({
            agent: pending.agent,
            action: pending.action,
            input: pending.context,
            approved: true,
            approvedBy: approver,
            notes,
        });

        this.emit('actionApproved', { ...pending, approvedBy: approver, notes });
        console.log(`✅ [ModeManager] Action approved: ${pending.action} by ${approver}`);

        return true;
    }

    /**
     * Reject a pending action
     */
    rejectAction(actionId: string, rejecter: string, reason?: string): boolean {
        const pending = this.pendingActions.get(actionId);
        if (!pending || pending.status !== 'pending') return false;

        pending.status = 'rejected';

        const callback = this.approvalCallbacks.get(actionId);
        if (callback) {
            callback(false, reason);
            this.approvalCallbacks.delete(actionId);
        }

        // Log to audit
        this.addAuditEntry({
            agent: pending.agent,
            action: pending.action,
            input: pending.context,
            approved: false,
            approvedBy: rejecter,
            notes: reason,
        });

        this.emit('actionRejected', { ...pending, rejectedBy: rejecter, reason });
        console.log(`❌ [ModeManager] Action rejected: ${pending.action} by ${rejecter}`);

        return true;
    }

    /**
     * Log an action for audit purposes
     */
    addAuditEntry(entry: {
        agent: string;
        action: string;
        input: any;
        output?: any;
        approved: boolean;
        approvedBy?: string;
        notes?: string;
    }): void {
        const auditEntry: AuditEntry = {
            id: `ae-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date(),
            mode: this.currentMode,
            duration: 0,
            ...entry,
        };

        this.auditLog.push(auditEntry);

        if (this.config.auditLevel === 'verbose') {
            console.log(`📋 [Audit] ${entry.agent}/${entry.action}: ${entry.approved ? '✓' : '✗'}`);
        }

        this.emit('auditEntry', auditEntry);
    }

    /**
     * Get pending actions
     */
    getPendingActions(): PendingAction[] {
        return [...this.pendingActions.values()].filter(a => a.status === 'pending');
    }

    /**
     * Get audit log
     */
    getAuditLog(limit: number = 100): AuditEntry[] {
        return this.auditLog
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get audit statistics
     */
    getAuditStats(): {
        totalActions: number;
        approved: number;
        rejected: number;
        byMode: Record<OperatingMode, number>;
        byAgent: Record<string, number>;
    } {
        const stats = {
            totalActions: this.auditLog.length,
            approved: 0,
            rejected: 0,
            byMode: { autonomous: 0, assist: 0, audit: 0 } as Record<OperatingMode, number>,
            byAgent: {} as Record<string, number>,
        };

        for (const entry of this.auditLog) {
            if (entry.approved) stats.approved++;
            else stats.rejected++;

            stats.byMode[entry.mode]++;
            stats.byAgent[entry.agent] = (stats.byAgent[entry.agent] || 0) + 1;
        }

        return stats;
    }

    /**
     * Check if action is within safe boundaries
     */
    private isWithinBoundaries(action: string): boolean {
        const actionBoundary = this.config.safeBoundaries.find(b => b.type === 'action');
        if (actionBoundary && Array.isArray(actionBoundary.limit)) {
            return actionBoundary.limit.includes(action);
        }
        return true;
    }

    /**
     * Check if action needs approval
     */
    private needsApproval(action: string): boolean {
        return this.config.approvalRequired.some(rule =>
            action.includes(rule.condition) || rule.condition === 'any_change'
        );
    }
}

export default ModeManager;
