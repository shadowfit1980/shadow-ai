/**
 * Code Quality Guardian
 * 
 * Monitors and enforces code quality standards with real-time
 * analysis, trend tracking, and quality gates.
 */

import { EventEmitter } from 'events';

export interface QualityReport {
    id: string;
    timestamp: Date;
    files: FileQuality[];
    summary: QualitySummary;
    trends: QualityTrend[];
    gateStatus: GateStatus;
}

export interface FileQuality {
    path: string;
    metrics: QualityMetrics;
    issues: QualityIssue[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface QualityMetrics {
    complexity: number;
    maintainability: number;
    duplication: number;
    documentation: number;
    testCoverage: number;
    lineCount: number;
    functionCount: number;
}

export interface QualityIssue {
    type: IssueType;
    severity: 'info' | 'warning' | 'error';
    message: string;
    line?: number;
    column?: number;
    suggestion?: string;
}

export type IssueType =
    | 'complexity'
    | 'duplication'
    | 'naming'
    | 'documentation'
    | 'style'
    | 'security'
    | 'performance'
    | 'maintainability';

export interface QualitySummary {
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    overallScore: number;
    totalIssues: number;
    issuesBySeverity: { info: number; warning: number; error: number };
    issuesByType: Record<IssueType, number>;
    averageComplexity: number;
    averageMaintainability: number;
}

export interface QualityTrend {
    metric: string;
    direction: 'improving' | 'stable' | 'declining';
    change: number;
    period: string;
}

export interface GateStatus {
    passed: boolean;
    gates: GateResult[];
}

export interface GateResult {
    name: string;
    threshold: number;
    actual: number;
    passed: boolean;
}

export interface QualityGate {
    id: string;
    name: string;
    metric: keyof QualityMetrics | 'overallScore' | 'issueCount';
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    threshold: number;
    enabled: boolean;
}

// Default quality gates
const DEFAULT_GATES: QualityGate[] = [
    { id: 'complexity', name: 'Max Complexity', metric: 'complexity', operator: 'lte', threshold: 15, enabled: true },
    { id: 'maintainability', name: 'Min Maintainability', metric: 'maintainability', operator: 'gte', threshold: 60, enabled: true },
    { id: 'duplication', name: 'Max Duplication', metric: 'duplication', operator: 'lte', threshold: 10, enabled: true },
    { id: 'coverage', name: 'Min Test Coverage', metric: 'testCoverage', operator: 'gte', threshold: 70, enabled: true },
];

export class CodeQualityGuardian extends EventEmitter {
    private static instance: CodeQualityGuardian;
    private reports: QualityReport[] = [];
    private gates: QualityGate[] = [...DEFAULT_GATES];
    private watchedPaths: Set<string> = new Set();

    private constructor() {
        super();
    }

    static getInstance(): CodeQualityGuardian {
        if (!CodeQualityGuardian.instance) {
            CodeQualityGuardian.instance = new CodeQualityGuardian();
        }
        return CodeQualityGuardian.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    analyzeCode(code: string, filePath: string = 'unknown'): FileQuality {
        const lines = code.split('\n');
        const metrics = this.calculateMetrics(code, lines);
        const issues = this.detectIssues(code, lines);
        const grade = this.calculateGrade(metrics, issues);

        return {
            path: filePath,
            metrics,
            issues,
            grade,
        };
    }

    analyzeFiles(files: { path: string; content: string }[]): QualityReport {
        const fileQualities = files.map(f => this.analyzeCode(f.content, f.path));
        const summary = this.createSummary(fileQualities);
        const trends = this.calculateTrends(summary);
        const gateStatus = this.evaluateGates(summary, fileQualities);

        const report: QualityReport = {
            id: `report_${Date.now()}`,
            timestamp: new Date(),
            files: fileQualities,
            summary,
            trends,
            gateStatus,
        };

        this.reports.push(report);
        if (this.reports.length > 100) {
            this.reports.shift();
        }

        this.emit('report:created', report);
        return report;
    }

    private calculateMetrics(code: string, lines: string[]): QualityMetrics {
        // Complexity: count control flow statements
        const controlFlow = (code.match(/\b(if|else|while|for|switch|case|catch|&&|\|\||\?)/g) || []).length;
        const complexity = Math.min(100, controlFlow * 2);

        // Function count
        const functionCount = (code.match(/\b(function|=>)\b/g) || []).length;

        // Maintainability (inverse of complexity + function length consideration)
        const avgFunctionLength = functionCount > 0 ? lines.length / functionCount : lines.length;
        const maintainability = Math.max(0, 100 - complexity - (avgFunctionLength > 30 ? 20 : 0));

        // Duplication (simplified)
        const lineSet = new Set(lines.map(l => l.trim()).filter(l => l.length > 20));
        const duplication = 100 - (lineSet.size / Math.max(lines.length, 1)) * 100;

        // Documentation
        const commentLines = (code.match(/\/\/|\/\*|\*\//g) || []).length;
        const documentation = Math.min(100, (commentLines / Math.max(lines.length, 1)) * 100 * 10);

        return {
            complexity,
            maintainability,
            duplication: Math.max(0, duplication),
            documentation: Math.min(100, documentation),
            testCoverage: 0, // Would need actual coverage data
            lineCount: lines.length,
            functionCount,
        };
    }

    private detectIssues(code: string, lines: string[]): QualityIssue[] {
        const issues: QualityIssue[] = [];

        // Check for long lines
        lines.forEach((line, i) => {
            if (line.length > 120) {
                issues.push({
                    type: 'style',
                    severity: 'warning',
                    message: `Line exceeds 120 characters (${line.length})`,
                    line: i + 1,
                    suggestion: 'Break line into multiple lines',
                });
            }
        });

        // Check for TODO/FIXME comments
        lines.forEach((line, i) => {
            if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
                issues.push({
                    type: 'maintainability',
                    severity: 'info',
                    message: 'Found TODO/FIXME comment',
                    line: i + 1,
                    suggestion: 'Address or track this issue',
                });
            }
        });

        // Check for console.log
        lines.forEach((line, i) => {
            if (/console\.(log|warn|error)/.test(line)) {
                issues.push({
                    type: 'maintainability',
                    severity: 'warning',
                    message: 'Console statement found',
                    line: i + 1,
                    suggestion: 'Remove or replace with proper logging',
                });
            }
        });

        // Check for deeply nested code
        let maxIndent = 0;
        lines.forEach((line, i) => {
            const indent = line.match(/^(\s*)/)?.[1].length || 0;
            if (indent > maxIndent) maxIndent = indent;
            if (indent > 20) {
                issues.push({
                    type: 'complexity',
                    severity: 'warning',
                    message: 'Deeply nested code',
                    line: i + 1,
                    suggestion: 'Consider extracting to a function',
                });
            }
        });

        // Check for any type
        if (/:\s*any\b/.test(code)) {
            issues.push({
                type: 'maintainability',
                severity: 'warning',
                message: 'Usage of "any" type detected',
                suggestion: 'Use a more specific type',
            });
        }

        return issues;
    }

    private calculateGrade(metrics: QualityMetrics, issues: QualityIssue[]): 'A' | 'B' | 'C' | 'D' | 'F' {
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;

        const score = metrics.maintainability - (errorCount * 10) - (warningCount * 2);

        if (score >= 80 && errorCount === 0) return 'A';
        if (score >= 60 && errorCount <= 1) return 'B';
        if (score >= 40) return 'C';
        if (score >= 20) return 'D';
        return 'F';
    }

    private createSummary(files: FileQuality[]): QualitySummary {
        const totalIssues = files.reduce((sum, f) => sum + f.issues.length, 0);

        const issuesBySeverity = { info: 0, warning: 0, error: 0 };
        const issuesByType: Record<string, number> = {};

        for (const file of files) {
            for (const issue of file.issues) {
                issuesBySeverity[issue.severity]++;
                issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
            }
        }

        const avgComplexity = files.length > 0
            ? files.reduce((sum, f) => sum + f.metrics.complexity, 0) / files.length
            : 0;

        const avgMaintainability = files.length > 0
            ? files.reduce((sum, f) => sum + f.metrics.maintainability, 0) / files.length
            : 0;

        const overallScore = avgMaintainability - (issuesBySeverity.error * 5) - (issuesBySeverity.warning * 1);

        let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
        if (overallScore >= 80) overallGrade = 'A';
        else if (overallScore >= 60) overallGrade = 'B';
        else if (overallScore >= 40) overallGrade = 'C';
        else if (overallScore >= 20) overallGrade = 'D';
        else overallGrade = 'F';

        return {
            overallGrade,
            overallScore,
            totalIssues,
            issuesBySeverity,
            issuesByType: issuesByType as Record<IssueType, number>,
            averageComplexity: avgComplexity,
            averageMaintainability: avgMaintainability,
        };
    }

    private calculateTrends(current: QualitySummary): QualityTrend[] {
        if (this.reports.length < 2) {
            return [
                { metric: 'overall', direction: 'stable', change: 0, period: 'since start' },
            ];
        }

        const previous = this.reports[this.reports.length - 1].summary;
        const trends: QualityTrend[] = [];

        // Overall score trend
        const scoreDiff = current.overallScore - previous.overallScore;
        trends.push({
            metric: 'overallScore',
            direction: scoreDiff > 2 ? 'improving' : scoreDiff < -2 ? 'declining' : 'stable',
            change: scoreDiff,
            period: 'since last report',
        });

        // Issue count trend
        const issueDiff = current.totalIssues - previous.totalIssues;
        trends.push({
            metric: 'issues',
            direction: issueDiff < -2 ? 'improving' : issueDiff > 2 ? 'declining' : 'stable',
            change: issueDiff,
            period: 'since last report',
        });

        return trends;
    }

    private evaluateGates(summary: QualitySummary, files: FileQuality[]): GateStatus {
        const results: GateResult[] = [];

        for (const gate of this.gates.filter(g => g.enabled)) {
            let actual: number;

            if (gate.metric === 'overallScore') {
                actual = summary.overallScore;
            } else if (gate.metric === 'issueCount') {
                actual = summary.totalIssues;
            } else {
                // Average metric across files
                actual = files.length > 0
                    ? files.reduce((sum, f) => sum + (f.metrics[gate.metric] || 0), 0) / files.length
                    : 0;
            }

            let passed: boolean;
            switch (gate.operator) {
                case 'gt': passed = actual > gate.threshold; break;
                case 'lt': passed = actual < gate.threshold; break;
                case 'gte': passed = actual >= gate.threshold; break;
                case 'lte': passed = actual <= gate.threshold; break;
                default: passed = false;
            }

            results.push({
                name: gate.name,
                threshold: gate.threshold,
                actual,
                passed,
            });
        }

        return {
            passed: results.every(r => r.passed),
            gates: results,
        };
    }

    // ========================================================================
    // GATES MANAGEMENT
    // ========================================================================

    addGate(gate: Omit<QualityGate, 'id'>): QualityGate {
        const newGate: QualityGate = {
            ...gate,
            id: `gate_${Date.now()}`,
        };
        this.gates.push(newGate);
        return newGate;
    }

    updateGate(id: string, updates: Partial<QualityGate>): QualityGate | undefined {
        const gate = this.gates.find(g => g.id === id);
        if (!gate) return undefined;
        Object.assign(gate, updates);
        return gate;
    }

    removeGate(id: string): boolean {
        const index = this.gates.findIndex(g => g.id === id);
        if (index === -1) return false;
        this.gates.splice(index, 1);
        return true;
    }

    getGates(): QualityGate[] {
        return [...this.gates];
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getLatestReport(): QualityReport | undefined {
        return this.reports[this.reports.length - 1];
    }

    getReports(limit = 10): QualityReport[] {
        return this.reports.slice(-limit);
    }

    getReport(id: string): QualityReport | undefined {
        return this.reports.find(r => r.id === id);
    }

    getTrendHistory(): { date: Date; score: number }[] {
        return this.reports.map(r => ({
            date: r.timestamp,
            score: r.summary.overallScore,
        }));
    }
}

export const codeQualityGuardian = CodeQualityGuardian.getInstance();
