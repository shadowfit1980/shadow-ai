/**
 * Ethics Override System
 * Pause AI for high-stakes decisions requiring human oversight
 * Grok Recommendation: Ethics Override / Human-in-the-Loop
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface EthicsCheckpoint {
    id: string;
    type: 'decision' | 'action' | 'output' | 'modification';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    context: Record<string, unknown>;
    timestamp: Date;
    status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'timeout';
    approvedBy?: string;
    rejectionReason?: string;
    timeout: number;
}

interface EthicsRule {
    id: string;
    name: string;
    description: string;
    pattern: RegExp | ((context: Record<string, unknown>) => boolean);
    severity: EthicsCheckpoint['severity'];
    action: 'warn' | 'pause' | 'block' | 'escalate';
    requiresApproval: boolean;
    category: 'security' | 'privacy' | 'safety' | 'legal' | 'financial' | 'reputational';
}

interface EthicsAuditLog {
    checkpointId: string;
    action: string;
    timestamp: Date;
    actor: 'system' | 'user' | 'auto';
    details: string;
}

interface EthicsReport {
    totalCheckpoints: number;
    byStatus: Record<EthicsCheckpoint['status'], number>;
    bySeverity: Record<EthicsCheckpoint['severity'], number>;
    byCategory: Record<EthicsRule['category'], number>;
    recentDecisions: EthicsCheckpoint[];
    complianceScore: number;
}

export class EthicsOverrideSystem extends EventEmitter {
    private static instance: EthicsOverrideSystem;
    private checkpoints: Map<string, EthicsCheckpoint> = new Map();
    private rules: Map<string, EthicsRule> = new Map();
    private auditLog: EthicsAuditLog[] = [];
    private pendingQueue: string[] = [];
    private paused: boolean = false;

    private constructor() {
        super();
        this.initializeDefaultRules();
    }

    static getInstance(): EthicsOverrideSystem {
        if (!EthicsOverrideSystem.instance) {
            EthicsOverrideSystem.instance = new EthicsOverrideSystem();
        }
        return EthicsOverrideSystem.instance;
    }

    private initializeDefaultRules(): void {
        const defaultRules: EthicsRule[] = [
            {
                id: 'rule_credentials',
                name: 'Credential Exposure',
                description: 'Prevent exposure of API keys, passwords, or secrets',
                pattern: /(?:api[_-]?key|password|secret|token|credential)s?\s*[:=]\s*['"]\S+['"]/i,
                severity: 'critical',
                action: 'block',
                requiresApproval: true,
                category: 'security'
            },
            {
                id: 'rule_pii',
                name: 'Personal Information',
                description: 'Detect and protect personally identifiable information',
                pattern: /\b(?:ssn|social\s*security|credit\s*card|passport)\b/i,
                severity: 'critical',
                action: 'pause',
                requiresApproval: true,
                category: 'privacy'
            },
            {
                id: 'rule_deletion',
                name: 'Mass Deletion',
                description: 'Pause before executing mass file deletions',
                pattern: (ctx) => ctx['action'] === 'delete' && (ctx['count'] as number || 0) > 10,
                severity: 'high',
                action: 'pause',
                requiresApproval: true,
                category: 'safety'
            },
            {
                id: 'rule_external',
                name: 'External Communication',
                description: 'Require approval for external API calls',
                pattern: /fetch\s*\(\s*['"]https?:\/\/(?!localhost)/i,
                severity: 'medium',
                action: 'warn',
                requiresApproval: false,
                category: 'security'
            },
            {
                id: 'rule_financial',
                name: 'Financial Operations',
                description: 'Pause before any financial transactions',
                pattern: /(?:payment|transaction|charge|billing|invoice)/i,
                severity: 'critical',
                action: 'pause',
                requiresApproval: true,
                category: 'financial'
            },
            {
                id: 'rule_database',
                name: 'Database Modifications',
                description: 'Warn on database schema changes',
                pattern: /(?:DROP|ALTER|TRUNCATE)\s+(?:TABLE|DATABASE|SCHEMA)/i,
                severity: 'high',
                action: 'pause',
                requiresApproval: true,
                category: 'safety'
            },
            {
                id: 'rule_production',
                name: 'Production Deployment',
                description: 'Require approval for production deployments',
                pattern: (ctx) => ctx['environment'] === 'production',
                severity: 'critical',
                action: 'pause',
                requiresApproval: true,
                category: 'safety'
            },
            {
                id: 'rule_legal',
                name: 'Legal Content',
                description: 'Flag content with legal implications',
                pattern: /(?:terms\s*of\s*service|privacy\s*policy|legal|liability|indemnify)/i,
                severity: 'medium',
                action: 'warn',
                requiresApproval: false,
                category: 'legal'
            }
        ];

        defaultRules.forEach(rule => this.rules.set(rule.id, rule));
    }

    evaluate(content: string, context: Record<string, unknown> = {}): EthicsCheckpoint[] {
        const triggered: EthicsCheckpoint[] = [];

        for (const rule of this.rules.values()) {
            let matches = false;

            if (typeof rule.pattern === 'function') {
                matches = rule.pattern(context);
            } else {
                matches = rule.pattern.test(content);
            }

            if (matches) {
                const checkpoint = this.createCheckpoint({
                    type: 'output',
                    severity: rule.severity,
                    description: `Rule triggered: ${rule.name} - ${rule.description}`,
                    context: { ...context, ruleId: rule.id, matchedContent: content.substring(0, 100) }
                });

                triggered.push(checkpoint);

                if (rule.action === 'block' || rule.action === 'pause') {
                    this.paused = true;
                    this.emit('paused', { checkpoint, rule });
                }

                if (rule.action === 'escalate') {
                    checkpoint.status = 'escalated';
                    this.emit('escalated', { checkpoint, rule });
                }
            }
        }

        return triggered;
    }

    createCheckpoint(options: {
        type: EthicsCheckpoint['type'];
        severity: EthicsCheckpoint['severity'];
        description: string;
        context: Record<string, unknown>;
        timeout?: number;
    }): EthicsCheckpoint {
        const checkpoint: EthicsCheckpoint = {
            id: crypto.randomUUID(),
            type: options.type,
            severity: options.severity,
            description: options.description,
            context: options.context,
            timestamp: new Date(),
            status: 'pending',
            timeout: options.timeout || 300000
        };

        this.checkpoints.set(checkpoint.id, checkpoint);
        this.pendingQueue.push(checkpoint.id);

        this.log(checkpoint.id, 'Checkpoint created', 'system');
        this.emit('checkpointCreated', checkpoint);

        this.startTimeout(checkpoint);

        return checkpoint;
    }

    private startTimeout(checkpoint: EthicsCheckpoint): void {
        setTimeout(() => {
            if (checkpoint.status === 'pending') {
                checkpoint.status = 'timeout';
                this.log(checkpoint.id, 'Checkpoint timed out', 'system');
                this.emit('checkpointTimeout', checkpoint);
            }
        }, checkpoint.timeout);
    }

    approve(checkpointId: string, approver: string = 'user', notes?: string): boolean {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint || checkpoint.status !== 'pending') return false;

        checkpoint.status = 'approved';
        checkpoint.approvedBy = approver;

        this.pendingQueue = this.pendingQueue.filter(id => id !== checkpointId);
        this.log(checkpointId, `Approved by ${approver}${notes ? `: ${notes}` : ''}`, 'user');

        this.emit('checkpointApproved', checkpoint);

        if (this.pendingQueue.length === 0) {
            this.resume();
        }

        return true;
    }

    reject(checkpointId: string, reason: string): boolean {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint || checkpoint.status !== 'pending') return false;

        checkpoint.status = 'rejected';
        checkpoint.rejectionReason = reason;

        this.pendingQueue = this.pendingQueue.filter(id => id !== checkpointId);
        this.log(checkpointId, `Rejected: ${reason}`, 'user');

        this.emit('checkpointRejected', checkpoint);

        return true;
    }

    private resume(): void {
        this.paused = false;
        this.emit('resumed');
    }

    addRule(rule: EthicsRule): void {
        this.rules.set(rule.id, rule);
        this.emit('ruleAdded', rule);
    }

    removeRule(ruleId: string): boolean {
        const removed = this.rules.delete(ruleId);
        if (removed) {
            this.emit('ruleRemoved', ruleId);
        }
        return removed;
    }

    enableRule(ruleId: string): boolean {
        return this.rules.has(ruleId);
    }

    private log(checkpointId: string, details: string, actor: EthicsAuditLog['actor']): void {
        const entry: EthicsAuditLog = {
            checkpointId,
            action: details,
            timestamp: new Date(),
            actor,
            details
        };

        this.auditLog.push(entry);

        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
    }

    getReport(): EthicsReport {
        const checkpoints = Array.from(this.checkpoints.values());

        const byStatus: Record<EthicsCheckpoint['status'], number> = {
            pending: 0, approved: 0, rejected: 0, escalated: 0, timeout: 0
        };
        const bySeverity: Record<EthicsCheckpoint['severity'], number> = {
            low: 0, medium: 0, high: 0, critical: 0
        };
        const byCategory: Record<EthicsRule['category'], number> = {
            security: 0, privacy: 0, safety: 0, legal: 0, financial: 0, reputational: 0
        };

        for (const cp of checkpoints) {
            byStatus[cp.status]++;
            bySeverity[cp.severity]++;

            const ruleId = cp.context['ruleId'] as string | undefined;
            if (ruleId) {
                const rule = this.rules.get(ruleId);
                if (rule) {
                    byCategory[rule.category]++;
                }
            }
        }

        const total = checkpoints.length || 1;
        const rejected = byStatus.rejected;
        const approved = byStatus.approved;
        const complianceScore = total > 0 ? Math.round((approved / (approved + rejected || 1)) * 100) : 100;

        return {
            totalCheckpoints: checkpoints.length,
            byStatus,
            bySeverity,
            byCategory,
            recentDecisions: checkpoints.slice(-10),
            complianceScore
        };
    }

    isPaused(): boolean {
        return this.paused;
    }

    getPendingCheckpoints(): EthicsCheckpoint[] {
        return this.pendingQueue
            .map(id => this.checkpoints.get(id))
            .filter(Boolean) as EthicsCheckpoint[];
    }

    getRules(): EthicsRule[] {
        return Array.from(this.rules.values());
    }

    getAuditLog(limit: number = 100): EthicsAuditLog[] {
        return this.auditLog.slice(-limit);
    }

    async waitForApproval(checkpointId: string): Promise<{ approved: boolean; checkpoint: EthicsCheckpoint }> {
        return new Promise((resolve) => {
            const check = () => {
                const checkpoint = this.checkpoints.get(checkpointId);
                if (!checkpoint) {
                    resolve({ approved: false, checkpoint: null as unknown as EthicsCheckpoint });
                    return;
                }

                if (checkpoint.status === 'approved') {
                    resolve({ approved: true, checkpoint });
                } else if (checkpoint.status === 'rejected' || checkpoint.status === 'timeout') {
                    resolve({ approved: false, checkpoint });
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    forceApproveAll(approver: string = 'admin'): number {
        let count = 0;
        for (const id of [...this.pendingQueue]) {
            if (this.approve(id, approver, 'Force approved')) {
                count++;
            }
        }
        return count;
    }

    emergencyStop(): void {
        this.paused = true;
        this.emit('emergencyStop');
        this.log('SYSTEM', 'Emergency stop activated', 'system');
    }
}

export const ethicsOverrideSystem = EthicsOverrideSystem.getInstance();
