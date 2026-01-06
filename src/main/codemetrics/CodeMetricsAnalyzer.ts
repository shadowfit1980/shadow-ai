/**
 * Code Metrics - Code quality metrics
 */
import { EventEmitter } from 'events';

export interface CodeMetrics { file: string; lines: number; functions: number; classes: number; complexity: number; maintainability: number; coverage?: number; }

export class CodeMetricsAnalyzer extends EventEmitter {
    private static instance: CodeMetricsAnalyzer;
    private metrics: Map<string, CodeMetrics> = new Map();
    private constructor() { super(); }
    static getInstance(): CodeMetricsAnalyzer { if (!CodeMetricsAnalyzer.instance) CodeMetricsAnalyzer.instance = new CodeMetricsAnalyzer(); return CodeMetricsAnalyzer.instance; }

    async analyze(file: string, code: string): Promise<CodeMetrics> {
        const lines = code.split('\n').length;
        const functions = (code.match(/function\s+\w+|=>\s*{/g) || []).length;
        const classes = (code.match(/class\s+\w+/g) || []).length;
        const complexity = Math.min(20, Math.ceil(lines / 20) + functions);
        const maintainability = Math.max(0, 100 - complexity * 2 - (lines > 500 ? 20 : 0));
        const m: CodeMetrics = { file, lines, functions, classes, complexity, maintainability };
        this.metrics.set(file, m);
        this.emit('analyzed', m);
        return m;
    }

    getProjectMetrics(): { totalLines: number; avgComplexity: number; avgMaintainability: number } {
        const all = Array.from(this.metrics.values());
        return { totalLines: all.reduce((s, m) => s + m.lines, 0), avgComplexity: all.reduce((s, m) => s + m.complexity, 0) / (all.length || 1), avgMaintainability: all.reduce((s, m) => s + m.maintainability, 0) / (all.length || 1) };
    }

    get(file: string): CodeMetrics | null { return this.metrics.get(file) || null; }
    getAll(): CodeMetrics[] { return Array.from(this.metrics.values()); }
}
export function getCodeMetricsAnalyzer(): CodeMetricsAnalyzer { return CodeMetricsAnalyzer.getInstance(); }
