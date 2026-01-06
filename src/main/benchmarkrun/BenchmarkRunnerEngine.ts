/**
 * Benchmark Runner - Automated benchmarks
 */
import { EventEmitter } from 'events';

export interface BenchmarkSuite { id: string; name: string; prompts: { id: string; text: string; category: string; expectedType: string }[]; }
export interface BenchmarkRun { id: string; suiteId: string; modelId: string; results: { promptId: string; response: string; latency: number; tokens: number }[]; score: number; startTime: number; endTime?: number; }

export class BenchmarkRunnerEngine extends EventEmitter {
    private static instance: BenchmarkRunnerEngine;
    private suites: Map<string, BenchmarkSuite> = new Map();
    private runs: Map<string, BenchmarkRun> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): BenchmarkRunnerEngine { if (!BenchmarkRunnerEngine.instance) BenchmarkRunnerEngine.instance = new BenchmarkRunnerEngine(); return BenchmarkRunnerEngine.instance; }

    private initDefaults(): void { this.suites.set('general', { id: 'general', name: 'General Knowledge', prompts: [{ id: 'g1', text: 'Explain quantum computing', category: 'science', expectedType: 'explanation' }, { id: 'g2', text: 'Write a haiku about AI', category: 'creative', expectedType: 'poem' }] }); }

    createSuite(name: string, prompts: BenchmarkSuite['prompts']): BenchmarkSuite { const suite: BenchmarkSuite = { id: `suite_${Date.now()}`, name, prompts }; this.suites.set(suite.id, suite); return suite; }

    async run(suiteId: string, modelId: string): Promise<BenchmarkRun> {
        const suite = this.suites.get(suiteId); if (!suite) throw new Error('Suite not found');
        const run: BenchmarkRun = { id: `run_${Date.now()}`, suiteId, modelId, results: [], score: 0, startTime: Date.now() };
        for (const p of suite.prompts) { run.results.push({ promptId: p.id, response: `[${modelId}] Response to: ${p.text}`, latency: Math.random() * 1000 + 500, tokens: Math.floor(Math.random() * 200 + 50) }); }
        run.score = Math.random() * 40 + 60; run.endTime = Date.now();
        this.runs.set(run.id, run); this.emit('completed', run); return run;
    }

    getSuites(): BenchmarkSuite[] { return Array.from(this.suites.values()); }
    getRunsByModel(modelId: string): BenchmarkRun[] { return Array.from(this.runs.values()).filter(r => r.modelId === modelId); }
}
export function getBenchmarkRunnerEngine(): BenchmarkRunnerEngine { return BenchmarkRunnerEngine.getInstance(); }
