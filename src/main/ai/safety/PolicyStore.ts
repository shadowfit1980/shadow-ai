/**
 * PolicyStore - Safety & Ethical Guardrails
 * 
 * Implements ChatGPT's suggestion for:
 * - Ethical guardrails (no malware creation, etc.)
 * - Action whitelisting/blacklisting
 * - Privilege escalation rules
 * - Default sandboxing requirements
 * - Human approval thresholds
 */

import { EventEmitter } from 'events';

export type PolicyAction = 'allow' | 'deny' | 'require_approval' | 'sandbox_only';

export interface Policy {
    id: string;
    name: string;
    description: string;
    category: 'security' | 'ethical' | 'privacy' | 'resource' | 'access';
    severity: 'critical' | 'high' | 'medium' | 'low';
    enabled: boolean;
    conditions: PolicyCondition[];
    action: PolicyAction;
    escalationPath?: string;
}

export interface PolicyCondition {
    type: 'action' | 'agent' | 'resource' | 'pattern' | 'time' | 'context';
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in';
    value: any;
}

export interface PolicyViolation {
    id: string;
    policyId: string;
    policyName: string;
    timestamp: Date;
    agent: string;
    action: string;
    context: Record<string, any>;
    severity: Policy['severity'];
    resolution: 'blocked' | 'approved' | 'pending' | 'escalated';
    approvedBy?: string;
    reason?: string;
}

export interface SafetyCheck {
    passed: boolean;
    violations: PolicyViolation[];
    requiredApprovals: string[];
    sandboxRequired: boolean;
}

/**
 * PolicyStore manages safety policies and ethical guardrails
 */
export class PolicyStore extends EventEmitter {
    private static instance: PolicyStore;
    private policies: Map<string, Policy> = new Map();
    private violations: PolicyViolation[] = [];
    private approvalCallbacks: Map<string, (approved: boolean, reason?: string) => void> = new Map();

    private constructor() {
        super();
        this.initializeDefaultPolicies();
    }

    static getInstance(): PolicyStore {
        if (!PolicyStore.instance) {
            PolicyStore.instance = new PolicyStore();
        }
        return PolicyStore.instance;
    }

    /**
     * Initialize default safety policies
     */
    private initializeDefaultPolicies(): void {
        // Critical Security Policies
        this.addPolicy({
            id: 'no-malware',
            name: 'No Malware Creation',
            description: 'Prohibit creation of malware, viruses, or malicious code',
            category: 'ethical',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /malware|virus|trojan|ransomware|exploit/i },
                { type: 'action', operator: 'in', value: ['write', 'execute', 'deploy'] },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'no-secrets-exposure',
            name: 'No Secret Exposure',
            description: 'Prevent exposure of API keys, passwords, or credentials',
            category: 'security',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /api[_-]?key|password|secret|credential|token/i },
                { type: 'action', operator: 'in', value: ['log', 'display', 'send', 'external'] },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'no-destructive-without-approval',
            name: 'Destructive Actions Require Approval',
            description: 'File deletion, database drops, and destructive ops need human approval',
            category: 'security',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'action', operator: 'in', value: ['delete', 'drop', 'truncate', 'remove', 'destroy'] },
            ],
            action: 'require_approval',
            escalationPath: 'user',
        });

        this.addPolicy({
            id: 'sandbox-external-code',
            name: 'Sandbox External Code',
            description: 'All external or untrusted code must run in sandbox',
            category: 'security',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'context', operator: 'equals', value: { source: 'external' } },
                { type: 'action', operator: 'equals', value: 'execute' },
            ],
            action: 'sandbox_only',
        });

        this.addPolicy({
            id: 'no-pii-logging',
            name: 'No PII Logging',
            description: 'Prevent logging of personally identifiable information',
            category: 'privacy',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /email|phone|ssn|social.*security|address|birth.*date/i },
                { type: 'action', operator: 'equals', value: 'log' },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'rate-limit-api-calls',
            name: 'Rate Limit External API Calls',
            description: 'Limit external API calls to prevent abuse',
            category: 'resource',
            severity: 'medium',
            enabled: true,
            conditions: [
                { type: 'action', operator: 'equals', value: 'external_api' },
                { type: 'resource', operator: 'greater_than', value: { calls_per_minute: 100 } },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'no-vulnerable-code',
            name: 'No Known Vulnerable Patterns',
            description: 'Prevent generation of code with known vulnerabilities',
            category: 'security',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /eval\s*\(|innerHTML\s*=|document\.write|shell_exec|system\s*\(/i },
            ],
            action: 'require_approval',
        });

        this.addPolicy({
            id: 'production-deploy-approval',
            name: 'Production Deployment Requires Approval',
            description: 'Any production deployment needs human approval',
            category: 'access',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'context', operator: 'equals', value: { environment: 'production' } },
                { type: 'action', operator: 'in', value: ['deploy', 'push', 'release'] },
            ],
            action: 'require_approval',
            escalationPath: 'admin',
        });

        // ========== NEW POLICIES ==========

        this.addPolicy({
            id: 'no-network-external',
            name: 'Restrict External Network Access',
            description: 'Block unauthorized external network connections',
            category: 'security',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'action', operator: 'in', value: ['http', 'fetch', 'socket', 'network'] },
                { type: 'context', operator: 'equals', value: { allowExternalNetwork: false } },
            ],
            action: 'sandbox_only',
        });

        this.addPolicy({
            id: 'no-data-exfiltration',
            name: 'Prevent Data Exfiltration',
            description: 'Block sending sensitive data to external endpoints',
            category: 'security',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /send|upload|post|transmit/i },
                { type: 'pattern', operator: 'matches', value: /database|db_dump|backup|export/i },
            ],
            action: 'require_approval',
            escalationPath: 'admin',
        });

        this.addPolicy({
            id: 'dependency-vulnerability-check',
            name: 'Vulnerability Dependency Check',
            description: 'Require approval for installing packages with known vulnerabilities',
            category: 'security',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'action', operator: 'in', value: ['npm install', 'yarn add', 'pip install'] },
                { type: 'context', operator: 'equals', value: { hasVulnerabilities: true } },
            ],
            action: 'require_approval',
        });

        this.addPolicy({
            id: 'no-privilege-escalation',
            name: 'Prevent Privilege Escalation',
            description: 'Block attempts to gain higher system privileges',
            category: 'security',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /sudo|su\s|chmod.*777|chown|setuid|root/i },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'file-access-limits',
            name: 'Limit File System Access',
            description: 'Restrict access to system directories and sensitive paths',
            category: 'access',
            severity: 'high',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /\/etc\/|\/root\/|\/var\/log|\.ssh\/|\.gnupg\/|\.aws\//i },
                { type: 'action', operator: 'in', value: ['read', 'write', 'delete'] },
            ],
            action: 'require_approval',
            escalationPath: 'admin',
        });

        // ========== MORE POLICIES ==========

        this.addPolicy({
            id: 'no-code-injection',
            name: 'Prevent Code Injection',
            description: 'Block common code injection attack patterns',
            category: 'security',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /\$\{.*\}|`.*`|\$\(|\bexec\b|\bspawn\b/i },
                { type: 'context', operator: 'equals', value: { userInput: true } },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'no-crypto-mining',
            name: 'Prevent Crypto Mining',
            description: 'Block cryptomining scripts and processes',
            category: 'ethical',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /crypto.*miner|coinhive|monero|xmrig|bitcoin.*mine|stratum\+tcp/i },
            ],
            action: 'deny',
        });

        this.addPolicy({
            id: 'ai-model-abuse-prevention',
            name: 'Prevent AI Model Abuse',
            description: 'Block harmful content generation and model abuse',
            category: 'ethical',
            severity: 'critical',
            enabled: true,
            conditions: [
                { type: 'pattern', operator: 'matches', value: /generate.*weapon|create.*bomb|synthesize.*drug|hack.*account|bypass.*security/i },
            ],
            action: 'deny',
        });

        console.log(`🛡️ [PolicyStore] Initialized with ${this.policies.size} default policies`);
    }

    /**
     * Add a new policy
     */
    addPolicy(policy: Policy): void {
        this.policies.set(policy.id, policy);
        this.emit('policyAdded', policy);
    }

    /**
     * Remove a policy
     */
    removePolicy(policyId: string): boolean {
        const removed = this.policies.delete(policyId);
        if (removed) {
            this.emit('policyRemoved', { id: policyId });
        }
        return removed;
    }

    /**
     * Enable/disable a policy
     */
    setPolicyEnabled(policyId: string, enabled: boolean): boolean {
        const policy = this.policies.get(policyId);
        if (policy) {
            policy.enabled = enabled;
            this.emit('policyUpdated', policy);
            return true;
        }
        return false;
    }

    /**
     * Check an action against all policies
     */
    async checkAction(params: {
        agent: string;
        action: string;
        target?: string;
        content?: string;
        context?: Record<string, any>;
    }): Promise<SafetyCheck> {
        const violations: PolicyViolation[] = [];
        const requiredApprovals: string[] = [];
        let sandboxRequired = false;

        for (const policy of this.policies.values()) {
            if (!policy.enabled) continue;

            if (this.matchesPolicy(policy, params)) {
                const violation: PolicyViolation = {
                    id: `v-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                    policyId: policy.id,
                    policyName: policy.name,
                    timestamp: new Date(),
                    agent: params.agent,
                    action: params.action,
                    context: params.context || {},
                    severity: policy.severity,
                    resolution: policy.action === 'deny' ? 'blocked' : 'pending',
                };

                switch (policy.action) {
                    case 'deny':
                        violations.push(violation);
                        break;
                    case 'require_approval':
                        violation.resolution = 'pending';
                        violations.push(violation);
                        requiredApprovals.push(policy.escalationPath || 'user');
                        break;
                    case 'sandbox_only':
                        sandboxRequired = true;
                        break;
                }
            }
        }

        // Store violations
        this.violations.push(...violations);

        const passed = violations.filter(v => v.resolution === 'blocked').length === 0;

        return {
            passed,
            violations,
            requiredApprovals: [...new Set(requiredApprovals)],
            sandboxRequired,
        };
    }

    /**
     * Check if params match policy conditions
     */
    private matchesPolicy(policy: Policy, params: {
        agent: string;
        action: string;
        target?: string;
        content?: string;
        context?: Record<string, any>;
    }): boolean {
        return policy.conditions.every(condition => {
            switch (condition.type) {
                case 'action':
                    return this.matchCondition(params.action, condition);
                case 'agent':
                    return this.matchCondition(params.agent, condition);
                case 'pattern':
                    const textToCheck = [params.action, params.target, params.content]
                        .filter(Boolean)
                        .join(' ');
                    return condition.value instanceof RegExp && condition.value.test(textToCheck);
                case 'context':
                    return this.matchCondition(params.context, condition);
                default:
                    return false;
            }
        });
    }

    private matchCondition(value: any, condition: PolicyCondition): boolean {
        switch (condition.operator) {
            case 'equals':
                return value === condition.value;
            case 'contains':
                return String(value).includes(condition.value);
            case 'matches':
                return condition.value instanceof RegExp && condition.value.test(String(value));
            case 'in':
                return Array.isArray(condition.value) && condition.value.includes(value);
            default:
                return false;
        }
    }

    /**
     * Request approval for a violation
     */
    async requestApproval(violationId: string): Promise<boolean> {
        const violation = this.violations.find(v => v.id === violationId);
        if (!violation) return false;

        return new Promise(resolve => {
            this.approvalCallbacks.set(violationId, (approved) => {
                violation.resolution = approved ? 'approved' : 'blocked';
                resolve(approved);
            });

            this.emit('approvalRequired', violation);
        });
    }

    /**
     * Approve a pending violation
     */
    approveViolation(violationId: string, approvedBy: string, reason?: string): boolean {
        const violation = this.violations.find(v => v.id === violationId);
        if (!violation || violation.resolution !== 'pending') return false;

        violation.resolution = 'approved';
        violation.approvedBy = approvedBy;
        violation.reason = reason;

        const callback = this.approvalCallbacks.get(violationId);
        if (callback) {
            callback(true, reason);
            this.approvalCallbacks.delete(violationId);
        }

        this.emit('violationApproved', violation);
        return true;
    }

    /**
     * Reject a pending violation
     */
    rejectViolation(violationId: string, reason?: string): boolean {
        const violation = this.violations.find(v => v.id === violationId);
        if (!violation || violation.resolution !== 'pending') return false;

        violation.resolution = 'blocked';
        violation.reason = reason;

        const callback = this.approvalCallbacks.get(violationId);
        if (callback) {
            callback(false, reason);
            this.approvalCallbacks.delete(violationId);
        }

        this.emit('violationRejected', violation);
        return true;
    }

    /**
     * Get all policies
     */
    getAllPolicies(): Policy[] {
        return [...this.policies.values()];
    }

    /**
     * Get policy by ID
     */
    getPolicy(id: string): Policy | undefined {
        return this.policies.get(id);
    }

    /**
     * Get recent violations
     */
    getRecentViolations(limit: number = 50): PolicyViolation[] {
        return this.violations
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Get violation statistics
     */
    getViolationStats(): {
        total: number;
        blocked: number;
        approved: number;
        pending: number;
        bySeverity: Record<string, number>;
        byPolicy: Record<string, number>;
    } {
        const stats = {
            total: this.violations.length,
            blocked: 0,
            approved: 0,
            pending: 0,
            bySeverity: {} as Record<string, number>,
            byPolicy: {} as Record<string, number>,
        };

        for (const v of this.violations) {
            if (v.resolution === 'blocked') stats.blocked++;
            if (v.resolution === 'approved') stats.approved++;
            if (v.resolution === 'pending') stats.pending++;

            stats.bySeverity[v.severity] = (stats.bySeverity[v.severity] || 0) + 1;
            stats.byPolicy[v.policyName] = (stats.byPolicy[v.policyName] || 0) + 1;
        }

        return stats;
    }
}

export default PolicyStore;
