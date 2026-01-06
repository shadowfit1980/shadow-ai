/**
 * Code Metrics Dashboard
 * 
 * Collects and visualizes code quality metrics including
 * complexity, coverage, maintainability, and technical debt.
 */

import { EventEmitter } from 'events';

export interface MetricsSnapshot {
    id: string;
    timestamp: Date;
    overall: OverallMetrics;
    files: FileMetrics[];
    trends: MetricsTrend[];
}

export interface OverallMetrics {
    linesOfCode: number;
    cyclomaticComplexity: number;
    maintainabilityIndex: number; // 0-100
    technicalDebt: TechnicalDebt;
    testCoverage: number; // 0-100
    duplicateCode: number; // percentage
    codeSmells: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface FileMetrics {
    path: string;
    linesOfCode: number;
    complexity: number;
    maintainability: number;
    churn: number; // how often file changes
    hotspot: boolean;
    issues: CodeIssue[];
}

export interface TechnicalDebt {
    estimatedHours: number;
    breakdown: { category: string; hours: number }[];
    priority: 'low' | 'medium' | 'high';
}

export interface CodeIssue {
    type: IssueType;
    severity: 'info' | 'warning' | 'error';
    message: string;
    line: number;
    effort: string; // e.g., "5 min", "1 hour"
}

export type IssueType =
    | 'complexity'
    | 'duplication'
    | 'naming'
    | 'dead_code'
    | 'long_method'
    | 'large_file'
    | 'deep_nesting'
    | 'magic_number'
    | 'missing_doc';

export interface MetricsTrend {
    metric: string;
    values: { date: Date; value: number }[];
    trend: 'improving' | 'stable' | 'degrading';
    prediction: number; // predicted next value
}

export interface QualityGate {
    name: string;
    metric: string;
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
    threshold: number;
    passed: boolean;
}

// Thresholds for different metrics
const THRESHOLDS = {
    complexity: { good: 10, acceptable: 20, bad: 30 },
    linesPerFile: { good: 300, acceptable: 500, bad: 1000 },
    nesting: { good: 3, acceptable: 4, bad: 5 },
    methodLength: { good: 20, acceptable: 50, bad: 100 },
    maintainability: { good: 70, acceptable: 50, bad: 30 },
    duplication: { good: 3, acceptable: 5, bad: 10 },
};

export class CodeMetricsDashboard extends EventEmitter {
    private static instance: CodeMetricsDashboard;
    private snapshots: MetricsSnapshot[] = [];
    private qualityGates: QualityGate[] = [];

    private constructor() {
        super();
        this.initializeDefaultGates();
    }

    static getInstance(): CodeMetricsDashboard {
        if (!CodeMetricsDashboard.instance) {
            CodeMetricsDashboard.instance = new CodeMetricsDashboard();
        }
        return CodeMetricsDashboard.instance;
    }

    private initializeDefaultGates(): void {
        this.qualityGates = [
            { name: 'Maintainability', metric: 'maintainabilityIndex', operator: 'gte', threshold: 60, passed: true },
            { name: 'Test Coverage', metric: 'testCoverage', operator: 'gte', threshold: 80, passed: true },
            { name: 'Complexity', metric: 'cyclomaticComplexity', operator: 'lte', threshold: 15, passed: true },
            { name: 'Duplication', metric: 'duplicateCode', operator: 'lte', threshold: 5, passed: true },
            { name: 'Code Smells', metric: 'codeSmells', operator: 'lte', threshold: 10, passed: true },
        ];
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    analyze(files: { path: string; content: string }[]): MetricsSnapshot {
        const fileMetrics: FileMetrics[] = files.map(f => this.analyzeFile(f.path, f.content));
        const overall = this.calculateOverallMetrics(fileMetrics);
        const trends = this.calculateTrends();

        const snapshot: MetricsSnapshot = {
            id: `metrics_${Date.now()}`,
            timestamp: new Date(),
            overall,
            files: fileMetrics,
            trends,
        };

        this.snapshots.push(snapshot);
        this.checkQualityGates(overall);

        this.emit('metrics:analyzed', snapshot);
        return snapshot;
    }

    private analyzeFile(path: string, content: string): FileMetrics {
        const lines = content.split('\n');
        const issues: CodeIssue[] = [];

        // Lines of code (excluding blanks and comments)
        const loc = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

        // Complexity
        const complexity = this.calculateComplexity(content);

        // Maintainability index (simplified)
        const maintainability = Math.max(0, Math.min(100,
            171 - 5.2 * Math.log(Math.max(1, loc)) - 0.23 * complexity
        ));

        // Detect issues
        if (loc > THRESHOLDS.linesPerFile.acceptable) {
            issues.push({
                type: 'large_file',
                severity: loc > THRESHOLDS.linesPerFile.bad ? 'error' : 'warning',
                message: `File has ${loc} lines, consider splitting`,
                line: 1,
                effort: '2 hours',
            });
        }

        if (complexity > THRESHOLDS.complexity.acceptable) {
            issues.push({
                type: 'complexity',
                severity: complexity > THRESHOLDS.complexity.bad ? 'error' : 'warning',
                message: `Cyclomatic complexity is ${complexity}`,
                line: 1,
                effort: '1 hour',
            });
        }

        // Check for long methods
        const methodLengths = this.getMethodLengths(content);
        for (const { name, length, line } of methodLengths) {
            if (length > THRESHOLDS.methodLength.acceptable) {
                issues.push({
                    type: 'long_method',
                    severity: 'warning',
                    message: `Method "${name}" has ${length} lines`,
                    line,
                    effort: '30 min',
                });
            }
        }

        // Check for deep nesting
        const maxNesting = this.getMaxNesting(content);
        if (maxNesting > THRESHOLDS.nesting.acceptable) {
            issues.push({
                type: 'deep_nesting',
                severity: 'warning',
                message: `Maximum nesting depth is ${maxNesting}`,
                line: 1,
                effort: '45 min',
            });
        }

        // Check for magic numbers
        const magicNumbers = content.match(/[^a-zA-Z0-9_]\d{2,}(?![0-9])/g) || [];
        if (magicNumbers.length > 3) {
            issues.push({
                type: 'magic_number',
                severity: 'info',
                message: `Found ${magicNumbers.length} magic numbers`,
                line: 1,
                effort: '15 min',
            });
        }

        return {
            path,
            linesOfCode: loc,
            complexity,
            maintainability,
            churn: 0, // Would need git history
            hotspot: complexity > THRESHOLDS.complexity.acceptable && loc > 200,
            issues,
        };
    }

    private calculateComplexity(code: string): number {
        let complexity = 1;
        complexity += (code.match(/\bif\b/g) || []).length;
        complexity += (code.match(/\belse\b/g) || []).length;
        complexity += (code.match(/\bfor\b/g) || []).length;
        complexity += (code.match(/\bwhile\b/g) || []).length;
        complexity += (code.match(/\bswitch\b/g) || []).length;
        complexity += (code.match(/\bcase\b/g) || []).length;
        complexity += (code.match(/\bcatch\b/g) || []).length;
        complexity += (code.match(/\?.*:/g) || []).length;
        complexity += (code.match(/&&|\|\|/g) || []).length;
        return complexity;
    }

    private getMethodLengths(code: string): { name: string; length: number; line: number }[] {
        const methods: { name: string; length: number; line: number }[] = [];
        const lines = code.split('\n');

        let currentMethod: { name: string; startLine: number; braceCount: number } | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (!currentMethod) {
                const methodMatch = line.match(/function\s+(\w+)|(\w+)\s*=\s*(?:async\s*)?\(/);
                if (methodMatch && line.includes('{')) {
                    currentMethod = {
                        name: methodMatch[1] || methodMatch[2] || 'anonymous',
                        startLine: i + 1,
                        braceCount: (line.match(/{/g) || []).length - (line.match(/}/g) || []).length,
                    };
                }
            } else {
                currentMethod.braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                if (currentMethod.braceCount <= 0) {
                    methods.push({
                        name: currentMethod.name,
                        length: i - currentMethod.startLine + 2,
                        line: currentMethod.startLine,
                    });
                    currentMethod = null;
                }
            }
        }

        return methods;
    }

    private getMaxNesting(code: string): number {
        let maxNesting = 0;
        let currentNesting = 0;

        for (const char of code) {
            if (char === '{') {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            } else if (char === '}') {
                currentNesting--;
            }
        }

        return maxNesting;
    }

    private calculateOverallMetrics(files: FileMetrics[]): OverallMetrics {
        if (files.length === 0) {
            return {
                linesOfCode: 0,
                cyclomaticComplexity: 0,
                maintainabilityIndex: 100,
                technicalDebt: { estimatedHours: 0, breakdown: [], priority: 'low' },
                testCoverage: 0,
                duplicateCode: 0,
                codeSmells: 0,
                grade: 'A',
            };
        }

        const totalLoc = files.reduce((sum, f) => sum + f.linesOfCode, 0);
        const avgComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;
        const avgMaintainability = files.reduce((sum, f) => sum + f.maintainability, 0) / files.length;
        const totalIssues = files.reduce((sum, f) => sum + f.issues.length, 0);

        // Calculate tech debt
        const debtHours = files.reduce((sum, f) => {
            return sum + f.issues.reduce((issueSum, issue) => {
                const match = issue.effort.match(/(\d+)\s*(min|hour)/);
                if (match) {
                    const value = parseInt(match[1]);
                    return issueSum + (match[2] === 'hour' ? value : value / 60);
                }
                return issueSum;
            }, 0);
        }, 0);

        const debtBreakdown: { category: string; hours: number }[] = [];
        const issuesByType = new Map<string, number>();

        for (const file of files) {
            for (const issue of file.issues) {
                const match = issue.effort.match(/(\d+)\s*(min|hour)/);
                if (match) {
                    const hours = match[2] === 'hour' ? parseInt(match[1]) : parseInt(match[1]) / 60;
                    issuesByType.set(issue.type, (issuesByType.get(issue.type) || 0) + hours);
                }
            }
        }

        for (const [category, hours] of issuesByType) {
            debtBreakdown.push({ category, hours });
        }

        // Calculate grade
        let grade: OverallMetrics['grade'] = 'A';
        if (avgMaintainability < 40 || avgComplexity > 30) grade = 'F';
        else if (avgMaintainability < 50 || avgComplexity > 25) grade = 'D';
        else if (avgMaintainability < 60 || avgComplexity > 20) grade = 'C';
        else if (avgMaintainability < 70 || avgComplexity > 15) grade = 'B';

        return {
            linesOfCode: totalLoc,
            cyclomaticComplexity: Math.round(avgComplexity * 10) / 10,
            maintainabilityIndex: Math.round(avgMaintainability * 10) / 10,
            technicalDebt: {
                estimatedHours: Math.round(debtHours * 10) / 10,
                breakdown: debtBreakdown.sort((a, b) => b.hours - a.hours),
                priority: debtHours > 40 ? 'high' : debtHours > 10 ? 'medium' : 'low',
            },
            testCoverage: 0, // Would need actual coverage data
            duplicateCode: 0, // Would need duplicate detection
            codeSmells: totalIssues,
            grade,
        };
    }

    private calculateTrends(): MetricsTrend[] {
        if (this.snapshots.length < 2) return [];

        const trends: MetricsTrend[] = [];
        const metrics = ['maintainabilityIndex', 'cyclomaticComplexity', 'codeSmells'];

        for (const metric of metrics) {
            const values = this.snapshots.slice(-10).map(s => ({
                date: s.timestamp,
                value: (s.overall as any)[metric],
            }));

            const firstHalf = values.slice(0, Math.floor(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));

            const avgFirst = firstHalf.reduce((s, v) => s + v.value, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((s, v) => s + v.value, 0) / secondHalf.length;

            let trend: 'improving' | 'stable' | 'degrading';
            if (metric === 'maintainabilityIndex') {
                trend = avgSecond > avgFirst * 1.05 ? 'improving' : avgSecond < avgFirst * 0.95 ? 'degrading' : 'stable';
            } else {
                trend = avgSecond < avgFirst * 0.95 ? 'improving' : avgSecond > avgFirst * 1.05 ? 'degrading' : 'stable';
            }

            trends.push({
                metric,
                values,
                trend,
                prediction: avgSecond + (avgSecond - avgFirst) * 0.5,
            });
        }

        return trends;
    }

    private checkQualityGates(overall: OverallMetrics): void {
        for (const gate of this.qualityGates) {
            const value = (overall as any)[gate.metric] ?? 0;

            switch (gate.operator) {
                case 'lt': gate.passed = value < gate.threshold; break;
                case 'lte': gate.passed = value <= gate.threshold; break;
                case 'gt': gate.passed = value > gate.threshold; break;
                case 'gte': gate.passed = value >= gate.threshold; break;
                case 'eq': gate.passed = value === gate.threshold; break;
            }

            if (!gate.passed) {
                this.emit('gate:failed', gate);
            }
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getLatestSnapshot(): MetricsSnapshot | undefined {
        return this.snapshots[this.snapshots.length - 1];
    }

    getSnapshots(limit: number = 20): MetricsSnapshot[] {
        return this.snapshots.slice(-limit);
    }

    getQualityGates(): QualityGate[] {
        return [...this.qualityGates];
    }

    getHotspots(): FileMetrics[] {
        const latest = this.getLatestSnapshot();
        if (!latest) return [];
        return latest.files.filter(f => f.hotspot);
    }
}

export const codeMetricsDashboard = CodeMetricsDashboard.getInstance();
