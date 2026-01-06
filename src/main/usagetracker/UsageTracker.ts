/**
 * Usage Tracker - AI usage analytics
 */
import { EventEmitter } from 'events';

export interface UsageRecord { id: string; timestamp: number; model: string; inputTokens: number; outputTokens: number; cost: number; latency: number; }

export class UsageTracker extends EventEmitter {
    private static instance: UsageTracker;
    private records: UsageRecord[] = [];
    private constructor() { super(); }
    static getInstance(): UsageTracker { if (!UsageTracker.instance) UsageTracker.instance = new UsageTracker(); return UsageTracker.instance; }

    record(model: string, inputTokens: number, outputTokens: number, cost: number, latency: number): UsageRecord {
        const rec: UsageRecord = { id: `usage_${Date.now()}`, timestamp: Date.now(), model, inputTokens, outputTokens, cost, latency };
        this.records.push(rec);
        this.emit('recorded', rec);
        return rec;
    }

    getStats(period: 'day' | 'week' | 'month' = 'day'): { totalCost: number; totalTokens: number; avgLatency: number; requestCount: number } {
        const now = Date.now();
        const periodMs = { day: 86400000, week: 604800000, month: 2592000000 }[period];
        const filtered = this.records.filter(r => now - r.timestamp < periodMs);
        return { totalCost: filtered.reduce((s, r) => s + r.cost, 0), totalTokens: filtered.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0), avgLatency: filtered.reduce((s, r) => s + r.latency, 0) / (filtered.length || 1), requestCount: filtered.length };
    }

    getByModel(model: string): UsageRecord[] { return this.records.filter(r => r.model === model); }
    getAll(): UsageRecord[] { return [...this.records]; }
}
export function getUsageTracker(): UsageTracker { return UsageTracker.getInstance(); }
