/**
 * Agent Analytics - Metrics and insights
 */
import { EventEmitter } from 'events';

export interface AgentMetrics { agentId: string; invocations: number; avgLatency: number; successRate: number; tokensUsed: number; cost: number; }
export interface AnalyticsEvent { id: string; agentId: string; type: 'invocation' | 'action' | 'kb_query' | 'guardrail' | 'error'; data: Record<string, unknown>; timestamp: number; }

export class AgentAnalyticsEngine extends EventEmitter {
    private static instance: AgentAnalyticsEngine;
    private events: AnalyticsEvent[] = [];
    private maxEvents = 10000;
    private constructor() { super(); }
    static getInstance(): AgentAnalyticsEngine { if (!AgentAnalyticsEngine.instance) AgentAnalyticsEngine.instance = new AgentAnalyticsEngine(); return AgentAnalyticsEngine.instance; }

    track(agentId: string, type: AnalyticsEvent['type'], data: Record<string, unknown> = {}): AnalyticsEvent { const event: AnalyticsEvent = { id: `ev_${Date.now()}`, agentId, type, data, timestamp: Date.now() }; this.events.push(event); if (this.events.length > this.maxEvents) this.events.shift(); return event; }

    getMetrics(agentId: string): AgentMetrics {
        const agentEvents = this.events.filter(e => e.agentId === agentId);
        const invocations = agentEvents.filter(e => e.type === 'invocation');
        const errors = agentEvents.filter(e => e.type === 'error');
        return { agentId, invocations: invocations.length, avgLatency: invocations.reduce((s, e) => s + ((e.data.latency as number) || 0), 0) / (invocations.length || 1), successRate: invocations.length ? (invocations.length - errors.length) / invocations.length : 1, tokensUsed: invocations.reduce((s, e) => s + ((e.data.tokens as number) || 0), 0), cost: invocations.reduce((s, e) => s + ((e.data.cost as number) || 0), 0) };
    }

    getTopAgents(limit = 10): AgentMetrics[] { const agentIds = [...new Set(this.events.map(e => e.agentId))]; return agentIds.map(id => this.getMetrics(id)).sort((a, b) => b.invocations - a.invocations).slice(0, limit); }
    getByType(type: AnalyticsEvent['type']): AnalyticsEvent[] { return this.events.filter(e => e.type === type); }
}
export function getAgentAnalyticsEngine(): AgentAnalyticsEngine { return AgentAnalyticsEngine.getInstance(); }
