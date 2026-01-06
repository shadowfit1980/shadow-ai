/**
 * Performance Monitor - Real-time metrics
 */
import { EventEmitter } from 'events';

export interface PerformanceMetrics { timestamp: number; tokensPerSecond: number; timeToFirstToken: number; totalTokens: number; memoryUsed: number; gpuUtilization: number; cpuUtilization: number; }

export class PerformanceMonitorEngine extends EventEmitter {
    private static instance: PerformanceMonitorEngine;
    private history: Map<string, PerformanceMetrics[]> = new Map();
    private maxHistory = 100;
    private constructor() { super(); }
    static getInstance(): PerformanceMonitorEngine { if (!PerformanceMonitorEngine.instance) PerformanceMonitorEngine.instance = new PerformanceMonitorEngine(); return PerformanceMonitorEngine.instance; }

    record(modelId: string, metrics: Omit<PerformanceMetrics, 'timestamp'>): PerformanceMetrics { const m: PerformanceMetrics = { ...metrics, timestamp: Date.now() }; const hist = this.history.get(modelId) || []; hist.push(m); if (hist.length > this.maxHistory) hist.shift(); this.history.set(modelId, hist); this.emit('recorded', { modelId, metrics: m }); return m; }

    getStats(modelId: string): { avg: PerformanceMetrics; min: PerformanceMetrics; max: PerformanceMetrics } | null {
        const hist = this.history.get(modelId); if (!hist || hist.length === 0) return null;
        const avg: PerformanceMetrics = { timestamp: Date.now(), tokensPerSecond: 0, timeToFirstToken: 0, totalTokens: 0, memoryUsed: 0, gpuUtilization: 0, cpuUtilization: 0 };
        hist.forEach(h => { avg.tokensPerSecond += h.tokensPerSecond; avg.timeToFirstToken += h.timeToFirstToken; avg.totalTokens += h.totalTokens; avg.memoryUsed += h.memoryUsed; avg.gpuUtilization += h.gpuUtilization; avg.cpuUtilization += h.cpuUtilization; });
        Object.keys(avg).forEach(k => { if (k !== 'timestamp') (avg as any)[k] /= hist.length; });
        return { avg, min: hist.reduce((m, h) => h.tokensPerSecond < m.tokensPerSecond ? h : m), max: hist.reduce((m, h) => h.tokensPerSecond > m.tokensPerSecond ? h : m) };
    }

    getRecent(modelId: string, limit = 10): PerformanceMetrics[] { return (this.history.get(modelId) || []).slice(-limit); }
}
export function getPerformanceMonitorEngine(): PerformanceMonitorEngine { return PerformanceMonitorEngine.getInstance(); }
