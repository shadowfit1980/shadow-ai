/**
 * Benchmark Runner - Performance benchmarks
 */
import { EventEmitter } from 'events';

export interface BenchmarkResult { name: string; iterations: number; avgMs: number; minMs: number; maxMs: number; opsPerSec: number; }

export class BenchmarkRunner extends EventEmitter {
    private static instance: BenchmarkRunner;
    private results: BenchmarkResult[] = [];
    private constructor() { super(); }
    static getInstance(): BenchmarkRunner { if (!BenchmarkRunner.instance) BenchmarkRunner.instance = new BenchmarkRunner(); return BenchmarkRunner.instance; }

    async run(name: string, fn: () => void | Promise<void>, iterations = 1000): Promise<BenchmarkResult> {
        const times: number[] = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            times.push(performance.now() - start);
        }
        const result: BenchmarkResult = {
            name, iterations, avgMs: times.reduce((a, b) => a + b, 0) / times.length,
            minMs: Math.min(...times), maxMs: Math.max(...times),
            opsPerSec: 1000 / (times.reduce((a, b) => a + b, 0) / times.length)
        };
        this.results.push(result);
        this.emit('completed', result);
        return result;
    }

    compare(name1: string, name2: string): { faster: string; ratio: number } | null {
        const r1 = this.results.find(r => r.name === name1), r2 = this.results.find(r => r.name === name2);
        if (!r1 || !r2) return null;
        return r1.avgMs < r2.avgMs ? { faster: name1, ratio: r2.avgMs / r1.avgMs } : { faster: name2, ratio: r1.avgMs / r2.avgMs };
    }

    getResults(): BenchmarkResult[] { return [...this.results]; }
    clear(): void { this.results = []; }
}

export function getBenchmarkRunner(): BenchmarkRunner { return BenchmarkRunner.getInstance(); }
