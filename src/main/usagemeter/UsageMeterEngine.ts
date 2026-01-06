/**
 * Usage Meter - Track API usage
 */
import { EventEmitter } from 'events';

export interface UsageRecord { timestamp: number; endpoint: string; tokens?: number; cost: number; }
export interface UsageSummary { totalRequests: number; totalTokens: number; totalCost: number; byEndpoint: Record<string, number>; }

export class UsageMeterEngine extends EventEmitter {
    private static instance: UsageMeterEngine;
    private records: UsageRecord[] = [];
    private maxRecords = 10000;
    private constructor() { super(); }
    static getInstance(): UsageMeterEngine { if (!UsageMeterEngine.instance) UsageMeterEngine.instance = new UsageMeterEngine(); return UsageMeterEngine.instance; }

    record(endpoint: string, tokens = 0, cost = 0): UsageRecord { const rec: UsageRecord = { timestamp: Date.now(), endpoint, tokens, cost }; this.records.push(rec); if (this.records.length > this.maxRecords) this.records.shift(); this.emit('recorded', rec); return rec; }

    getSummary(startTime?: number): UsageSummary {
        const filtered = startTime ? this.records.filter(r => r.timestamp >= startTime) : this.records;
        const byEndpoint: Record<string, number> = {};
        filtered.forEach(r => { byEndpoint[r.endpoint] = (byEndpoint[r.endpoint] || 0) + 1; });
        return { totalRequests: filtered.length, totalTokens: filtered.reduce((s, r) => s + (r.tokens || 0), 0), totalCost: filtered.reduce((s, r) => s + r.cost, 0), byEndpoint };
    }

    getByEndpoint(endpoint: string): UsageRecord[] { return this.records.filter(r => r.endpoint === endpoint); }
    getRecent(limit = 100): UsageRecord[] { return this.records.slice(-limit).reverse(); }
}
export function getUsageMeterEngine(): UsageMeterEngine { return UsageMeterEngine.getInstance(); }
