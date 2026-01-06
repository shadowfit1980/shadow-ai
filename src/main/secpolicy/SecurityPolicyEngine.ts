/**
 * Security Policy - Policy enforcement
 */
import { EventEmitter } from 'events';

export interface SecurityRule { id: string; name: string; severity: 'critical' | 'high' | 'medium' | 'low'; action: 'block' | 'warn' | 'ignore'; condition: string; enabled: boolean; }
export interface PolicyViolation { ruleId: string; target: string; message: string; timestamp: number; }

export class SecurityPolicyEngine extends EventEmitter {
    private static instance: SecurityPolicyEngine;
    private rules: Map<string, SecurityRule> = new Map();
    private violations: PolicyViolation[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): SecurityPolicyEngine { if (!SecurityPolicyEngine.instance) SecurityPolicyEngine.instance = new SecurityPolicyEngine(); return SecurityPolicyEngine.instance; }

    private initDefaults(): void {
        const defaults: SecurityRule[] = [
            { id: 'R001', name: 'Block Critical Vulns', severity: 'critical', action: 'block', condition: 'severity == critical', enabled: true },
            { id: 'R002', name: 'Warn on GPL', severity: 'high', action: 'warn', condition: 'license.startsWith("GPL")', enabled: true },
            { id: 'R003', name: 'Block Outdated Base Images', severity: 'medium', action: 'block', condition: 'baseImage.age > 90', enabled: true }
        ];
        defaults.forEach(r => this.rules.set(r.id, r));
    }

    addRule(rule: SecurityRule): void { this.rules.set(rule.id, rule); this.emit('ruleAdded', rule); }
    removeRule(ruleId: string): boolean { return this.rules.delete(ruleId); }
    evaluate(target: string, context: Record<string, unknown>): PolicyViolation[] { const newViolations: PolicyViolation[] = []; this.rules.forEach(r => { if (r.enabled && r.action === 'block') newViolations.push({ ruleId: r.id, target, message: r.name, timestamp: Date.now() }); }); this.violations.push(...newViolations); return newViolations; }
    getRules(): SecurityRule[] { return Array.from(this.rules.values()); }
    getViolations(): PolicyViolation[] { return [...this.violations]; }
}
export function getSecurityPolicyEngine(): SecurityPolicyEngine { return SecurityPolicyEngine.getInstance(); }
