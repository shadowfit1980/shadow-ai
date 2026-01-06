/**
 * Performance Test Manager - Performance/load testing
 */
import { EventEmitter } from 'events';

export interface PerformanceResult { id: string; testName: string; avgResponseTime: number; p95: number; p99: number; throughput: number; errors: number; }

export class PerformanceTestManager extends EventEmitter {
    private static instance: PerformanceTestManager;
    private results: Map<string, PerformanceResult> = new Map();
    private constructor() { super(); }
    static getInstance(): PerformanceTestManager { if (!PerformanceTestManager.instance) PerformanceTestManager.instance = new PerformanceTestManager(); return PerformanceTestManager.instance; }

    async runLoadTest(name: string, fn: () => Promise<void>, iterations = 100): Promise<PerformanceResult> {
        const times: number[] = [];
        let errors = 0;
        for (let i = 0; i < iterations; i++) { const start = Date.now(); try { await fn(); } catch { errors++; } times.push(Date.now() - start); }
        times.sort((a, b) => a - b);
        const result: PerformanceResult = { id: `perf_${Date.now()}`, testName: name, avgResponseTime: times.reduce((s, t) => s + t, 0) / times.length, p95: times[Math.floor(times.length * 0.95)], p99: times[Math.floor(times.length * 0.99)], throughput: iterations / (times.reduce((s, t) => s + t, 0) / 1000), errors };
        this.results.set(result.id, result);
        this.emit('completed', result);
        return result;
    }

    getAll(): PerformanceResult[] { return Array.from(this.results.values()); }
}
export function getPerformanceTestManager(): PerformanceTestManager { return PerformanceTestManager.getInstance(); }
