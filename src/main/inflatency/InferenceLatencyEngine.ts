/**
 * Inference Latency - Latency tracking
 */
import { EventEmitter } from 'events';

export interface LatencyRecord { timestamp: number; endpointId: string; totalMs: number; preprocessMs: number; inferenceMs: number; postprocessMs: number; }
export interface LatencyStats { avg: number; p50: number; p95: number; p99: number; min: number; max: number; }

export class InferenceLatencyEngine extends EventEmitter {
    private static instance: InferenceLatencyEngine;
    private records: Map<string, LatencyRecord[]> = new Map();
    private maxRecords = 1000;
    private constructor() { super(); }
    static getInstance(): InferenceLatencyEngine { if (!InferenceLatencyEngine.instance) InferenceLatencyEngine.instance = new InferenceLatencyEngine(); return InferenceLatencyEngine.instance; }

    record(endpointId: string, totalMs: number, preprocessMs = 0, inferenceMs?: number, postprocessMs = 0): void {
        const rec: LatencyRecord = { timestamp: Date.now(), endpointId, totalMs, preprocessMs, inferenceMs: inferenceMs ?? totalMs - preprocessMs - postprocessMs, postprocessMs };
        const recs = this.records.get(endpointId) || []; recs.push(rec); if (recs.length > this.maxRecords) recs.shift(); this.records.set(endpointId, recs);
        if (totalMs > 1000) this.emit('slow', rec);
    }

    getStats(endpointId: string): LatencyStats | null {
        const recs = this.records.get(endpointId); if (!recs || recs.length === 0) return null;
        const sorted = recs.map(r => r.totalMs).sort((a, b) => a - b);
        const percentile = (p: number) => sorted[Math.floor(sorted.length * p / 100)] || 0;
        return { avg: sorted.reduce((s, v) => s + v, 0) / sorted.length, p50: percentile(50), p95: percentile(95), p99: percentile(99), min: sorted[0], max: sorted[sorted.length - 1] };
    }

    getRecent(endpointId: string, limit = 100): LatencyRecord[] { return (this.records.get(endpointId) || []).slice(-limit); }
}
export function getInferenceLatencyEngine(): InferenceLatencyEngine { return InferenceLatencyEngine.getInstance(); }
