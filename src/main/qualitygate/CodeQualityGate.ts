/**
 * Code Quality Gate - Quality enforcement
 */
import { EventEmitter } from 'events';

export interface QualityCheck { name: string; passed: boolean; score: number; threshold: number; message: string; }
export interface QualityReport { id: string; passed: boolean; checks: QualityCheck[]; overallScore: number; }

export class CodeQualityGate extends EventEmitter {
    private static instance: CodeQualityGate;
    private thresholds = { coverage: 80, complexity: 15, duplication: 5, security: 0 };
    private constructor() { super(); }
    static getInstance(): CodeQualityGate { if (!CodeQualityGate.instance) CodeQualityGate.instance = new CodeQualityGate(); return CodeQualityGate.instance; }

    async evaluate(metrics: { coverage: number; complexity: number; duplication: number; securityIssues: number }): Promise<QualityReport> {
        const checks: QualityCheck[] = [
            { name: 'Coverage', passed: metrics.coverage >= this.thresholds.coverage, score: metrics.coverage, threshold: this.thresholds.coverage, message: `Coverage: ${metrics.coverage}%` },
            { name: 'Complexity', passed: metrics.complexity <= this.thresholds.complexity, score: metrics.complexity, threshold: this.thresholds.complexity, message: `Complexity: ${metrics.complexity}` },
            { name: 'Duplication', passed: metrics.duplication <= this.thresholds.duplication, score: metrics.duplication, threshold: this.thresholds.duplication, message: `Duplication: ${metrics.duplication}%` },
            { name: 'Security', passed: metrics.securityIssues <= this.thresholds.security, score: metrics.securityIssues, threshold: this.thresholds.security, message: `Security issues: ${metrics.securityIssues}` }
        ];
        const overallScore = checks.filter(c => c.passed).length / checks.length * 100;
        const report: QualityReport = { id: `qg_${Date.now()}`, passed: checks.every(c => c.passed), checks, overallScore };
        this.emit('evaluated', report);
        return report;
    }

    setThreshold(name: keyof typeof this.thresholds, value: number): void { this.thresholds[name] = value; }
    getThresholds(): typeof this.thresholds { return { ...this.thresholds }; }
}
export function getCodeQualityGate(): CodeQualityGate { return CodeQualityGate.getInstance(); }
