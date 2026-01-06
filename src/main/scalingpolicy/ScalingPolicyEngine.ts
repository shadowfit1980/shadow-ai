/**
 * Scaling Policy - Auto-scaling rules
 */
import { EventEmitter } from 'events';

export interface ScalingRule { id: string; endpointId: string; metric: 'cpu' | 'memory' | 'requests' | 'latency'; threshold: number; operator: 'gt' | 'lt'; action: 'scale_up' | 'scale_down'; amount: number; cooldown: number; }
export interface ScalingEvent { timestamp: number; ruleId: string; previousReplicas: number; newReplicas: number; }

export class ScalingPolicyEngine extends EventEmitter {
    private static instance: ScalingPolicyEngine;
    private rules: Map<string, ScalingRule> = new Map();
    private events: ScalingEvent[] = [];
    private constructor() { super(); }
    static getInstance(): ScalingPolicyEngine { if (!ScalingPolicyEngine.instance) ScalingPolicyEngine.instance = new ScalingPolicyEngine(); return ScalingPolicyEngine.instance; }

    addRule(endpointId: string, metric: ScalingRule['metric'], threshold: number, operator: ScalingRule['operator'], action: ScalingRule['action'], amount = 1): ScalingRule { const rule: ScalingRule = { id: `rule_${Date.now()}`, endpointId, metric, threshold, operator, action, amount, cooldown: 300 }; this.rules.set(rule.id, rule); return rule; }

    evaluate(endpointId: string, metrics: Record<string, number>, currentReplicas: number): { shouldScale: boolean; newReplicas: number; rule?: ScalingRule } {
        const endpointRules = Array.from(this.rules.values()).filter(r => r.endpointId === endpointId);
        for (const rule of endpointRules) { const val = metrics[rule.metric]; if (val !== undefined) { const triggered = rule.operator === 'gt' ? val > rule.threshold : val < rule.threshold; if (triggered) { const newReplicas = rule.action === 'scale_up' ? currentReplicas + rule.amount : Math.max(1, currentReplicas - rule.amount); this.events.push({ timestamp: Date.now(), ruleId: rule.id, previousReplicas: currentReplicas, newReplicas }); return { shouldScale: true, newReplicas, rule }; } } }
        return { shouldScale: false, newReplicas: currentReplicas };
    }

    getByEndpoint(endpointId: string): ScalingRule[] { return Array.from(this.rules.values()).filter(r => r.endpointId === endpointId); }
    getEvents(): ScalingEvent[] { return [...this.events]; }
}
export function getScalingPolicyEngine(): ScalingPolicyEngine { return ScalingPolicyEngine.getInstance(); }
