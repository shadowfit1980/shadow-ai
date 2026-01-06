/**
 * Cosmic Linter Oracle
 * 
 * A linter that draws upon cosmic wisdom to identify
 * code issues with transcendent insight.
 */

import { EventEmitter } from 'events';

export interface CosmicLintReport {
    id: string;
    code: string;
    issues: CosmicIssue[];
    cosmicScore: number;
    enlightenment: string;
}

export interface CosmicIssue {
    level: 'whisper' | 'warning' | 'disruption';
    message: string;
    suggestion: string;
}

export class CosmicLinterOracle extends EventEmitter {
    private static instance: CosmicLinterOracle;
    private reports: Map<string, CosmicLintReport> = new Map();

    private constructor() { super(); }

    static getInstance(): CosmicLinterOracle {
        if (!CosmicLinterOracle.instance) {
            CosmicLinterOracle.instance = new CosmicLinterOracle();
        }
        return CosmicLinterOracle.instance;
    }

    lint(code: string): CosmicLintReport {
        const issues = this.findIssues(code);
        const cosmicScore = 1 - issues.length * 0.1;

        const report: CosmicLintReport = {
            id: `lint_${Date.now()}`,
            code,
            issues,
            cosmicScore: Math.max(0, cosmicScore),
            enlightenment: this.generateEnlightenment(issues),
        };

        this.reports.set(report.id, report);
        this.emit('lint:complete', report);
        return report;
    }

    private findIssues(code: string): CosmicIssue[] {
        const issues: CosmicIssue[] = [];
        if (code.includes('any')) {
            issues.push({ level: 'disruption', message: 'The "any" type clouds the cosmic vision', suggestion: 'Define proper types' });
        }
        if (code.includes('console.log')) {
            issues.push({ level: 'whisper', message: 'Console statements disturb the astral plane', suggestion: 'Use a proper logger' });
        }
        if (!code.includes('//') && !code.includes('/*')) {
            issues.push({ level: 'warning', message: 'Undocumented code fades from memory', suggestion: 'Add documentation' });
        }
        return issues;
    }

    private generateEnlightenment(issues: CosmicIssue[]): string {
        if (issues.length === 0) return 'Your code resonates with cosmic harmony';
        return `${issues.length} disturbances in the code force detected`;
    }

    getStats(): { total: number; avgScore: number } {
        const reports = Array.from(this.reports.values());
        return {
            total: reports.length,
            avgScore: reports.length > 0 ? reports.reduce((s, r) => s + r.cosmicScore, 0) / reports.length : 0,
        };
    }
}

export const cosmicLinterOracle = CosmicLinterOracle.getInstance();
