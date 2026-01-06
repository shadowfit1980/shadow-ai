/**
 * Coverage Tracker - Code coverage tracking
 */
import { EventEmitter } from 'events';

export interface CoverageReport { file: string; lines: { total: number; covered: number }; branches: { total: number; covered: number }; functions: { total: number; covered: number }; percentage: number; }

export class CoverageTracker extends EventEmitter {
    private static instance: CoverageTracker;
    private coverage: Map<string, CoverageReport> = new Map();
    private constructor() { super(); }
    static getInstance(): CoverageTracker { if (!CoverageTracker.instance) CoverageTracker.instance = new CoverageTracker(); return CoverageTracker.instance; }

    track(file: string, lines: number, coveredLines: number): CoverageReport {
        const report: CoverageReport = { file, lines: { total: lines, covered: coveredLines }, branches: { total: Math.ceil(lines / 10), covered: Math.ceil(coveredLines / 10) }, functions: { total: Math.ceil(lines / 20), covered: Math.ceil(coveredLines / 20) }, percentage: (coveredLines / lines) * 100 };
        this.coverage.set(file, report);
        this.emit('tracked', report);
        return report;
    }

    getProjectCoverage(): { files: number; avgCoverage: number; uncovered: string[] } {
        const all = Array.from(this.coverage.values());
        return { files: all.length, avgCoverage: all.reduce((s, r) => s + r.percentage, 0) / (all.length || 1), uncovered: all.filter(r => r.percentage < 50).map(r => r.file) };
    }

    get(file: string): CoverageReport | null { return this.coverage.get(file) || null; }
    getAll(): CoverageReport[] { return Array.from(this.coverage.values()); }
}
export function getCoverageTracker(): CoverageTracker { return CoverageTracker.getInstance(); }
