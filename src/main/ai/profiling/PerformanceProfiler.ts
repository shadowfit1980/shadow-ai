/**
 * Performance Profiler
 * 
 * Analyze code for performance issues and optimization opportunities.
 */

import { EventEmitter } from 'events';

interface PerformanceIssue {
    id: string;
    type: 'memory' | 'cpu' | 'io' | 'network' | 'algorithm';
    severity: 'info' | 'warning' | 'critical';
    description: string;
    file: string;
    line: number;
    suggestion: string;
}

interface PerformanceReport {
    file: string;
    issues: PerformanceIssue[];
    score: number;
    estimatedImpact: 'low' | 'medium' | 'high';
}

export class PerformanceProfiler extends EventEmitter {
    private static instance: PerformanceProfiler;

    private constructor() { super(); }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    analyze(file: string, code: string): PerformanceReport {
        const issues: PerformanceIssue[] = [];
        const lines = code.split('\n');

        // Detect sync operations  
        lines.forEach((line, i) => {
            if (/Sync\(/.test(line)) {
                issues.push({
                    id: `sync-${i}`, type: 'io', severity: 'warning',
                    description: 'Synchronous I/O blocks event loop',
                    file, line: i + 1, suggestion: 'Use async version with await'
                });
            }
        });

        // Detect nested loops (O(n²) or worse)
        let loopDepth = 0;
        lines.forEach((line, i) => {
            if (/\b(for|while)\s*\(/.test(line)) loopDepth++;
            if (line.includes('}')) loopDepth = Math.max(0, loopDepth - 1);
            if (loopDepth >= 3) {
                issues.push({
                    id: `loop-${i}`, type: 'algorithm', severity: 'critical',
                    description: `O(n^${loopDepth}) complexity detected`,
                    file, line: i + 1, suggestion: 'Use Map/Set for lookups'
                });
            }
        });

        // Detect memory leaks patterns
        if (/setInterval|setTimeout/.test(code) && !/clearInterval|clearTimeout/.test(code)) {
            issues.push({
                id: 'timer-leak', type: 'memory', severity: 'warning',
                description: 'Timer without cleanup may cause memory leak',
                file, line: 1, suggestion: 'Clear timers in cleanup/unmount'
            });
        }

        // Detect large array operations without pagination
        lines.forEach((line, i) => {
            if (/\.map\(|\.filter\(|\.reduce\(/.test(line) && /fetch|axios|db|query/i.test(code)) {
                issues.push({
                    id: `bulk-${i}`, type: 'memory', severity: 'info',
                    description: 'Large data operation - consider pagination',
                    file, line: i + 1, suggestion: 'Add limit/offset for large datasets'
                });
            }
        });

        // Detect N+1 query patterns
        if (/for\s*\([\s\S]*?(await|\.then)[\s\S]*?query|fetch/i.test(code)) {
            issues.push({
                id: 'n-plus-1', type: 'network', severity: 'critical',
                description: 'Possible N+1 query pattern detected',
                file, line: 1, suggestion: 'Batch queries or use JOINs'
            });
        }

        const score = Math.max(0, 100 - issues.filter(i => i.severity === 'critical').length * 20
            - issues.filter(i => i.severity === 'warning').length * 10);
        const estimatedImpact = score < 50 ? 'high' : score < 80 ? 'medium' : 'low';

        this.emit('analysis:complete', { file, issues: issues.length, score });
        return { file, issues, score, estimatedImpact };
    }

    suggestOptimizations(report: PerformanceReport): string[] {
        return report.issues.map(i => `Line ${i.line}: ${i.suggestion}`);
    }
}

export const performanceProfiler = PerformanceProfiler.getInstance();
