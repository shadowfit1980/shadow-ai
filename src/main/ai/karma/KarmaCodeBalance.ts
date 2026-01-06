/**
 * Karma Code Balance
 * 
 * Tracks the "karma" of code decisions - good practices increase
 * positive karma, bad practices accumulate technical debt karma.
 */

import { EventEmitter } from 'events';

export interface KarmaReport {
    id: string;
    code: string;
    totalKarma: number;
    positiveKarma: KarmaPoint[];
    negativeKarma: KarmaPoint[];
    balance: KarmaBalance;
    karmaPath: KarmaPath;
    createdAt: Date;
}

export interface KarmaPoint {
    id: string;
    type: 'positive' | 'negative';
    category: string;
    description: string;
    points: number;
    location?: string;
}

export interface KarmaBalance {
    level: 'enlightened' | 'balanced' | 'burdened' | 'critical';
    score: number;
    trend: 'improving' | 'stable' | 'declining';
}

export interface KarmaPath {
    current: string;
    nextMilestone: string;
    actionsToImprove: string[];
}

export class KarmaCodeBalance extends EventEmitter {
    private static instance: KarmaCodeBalance;
    private reports: Map<string, KarmaReport> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): KarmaCodeBalance {
        if (!KarmaCodeBalance.instance) {
            KarmaCodeBalance.instance = new KarmaCodeBalance();
        }
        return KarmaCodeBalance.instance;
    }

    analyze(code: string): KarmaReport {
        const positiveKarma = this.findPositiveKarma(code);
        const negativeKarma = this.findNegativeKarma(code);
        const totalKarma = this.calculateTotalKarma(positiveKarma, negativeKarma);
        const balance = this.determineBalance(totalKarma);
        const karmaPath = this.determineKarmaPath(balance, negativeKarma);

        const report: KarmaReport = {
            id: `karma_${Date.now()}`,
            code,
            totalKarma,
            positiveKarma,
            negativeKarma,
            balance,
            karmaPath,
            createdAt: new Date(),
        };

        this.reports.set(report.id, report);
        this.emit('report:generated', report);
        return report;
    }

    private findPositiveKarma(code: string): KarmaPoint[] {
        const points: KarmaPoint[] = [];

        // Type safety
        if (code.includes('interface') || code.includes('type ')) {
            points.push({
                id: `positive_types_${Date.now()}`,
                type: 'positive',
                category: 'Type Safety',
                description: 'Using TypeScript types/interfaces',
                points: 15,
            });
        }

        // Error handling
        if (code.includes('try') && code.includes('catch')) {
            points.push({
                id: `positive_errors_${Date.now()}`,
                type: 'positive',
                category: 'Error Handling',
                description: 'Proper error handling with try-catch',
                points: 10,
            });
        }

        // Documentation
        if (code.includes('/**') || code.includes('* @')) {
            points.push({
                id: `positive_docs_${Date.now()}`,
                type: 'positive',
                category: 'Documentation',
                description: 'JSDoc documentation present',
                points: 10,
            });
        }

        // Pure functions
        if (!code.includes('this.') && code.includes('=>')) {
            points.push({
                id: `positive_pure_${Date.now()}`,
                type: 'positive',
                category: 'Functional',
                description: 'Using pure functions',
                points: 8,
            });
        }

        // Tests
        if (code.includes('test(') || code.includes('describe(')) {
            points.push({
                id: `positive_tests_${Date.now()}`,
                type: 'positive',
                category: 'Testing',
                description: 'Including tests',
                points: 20,
            });
        }

        // Modern syntax
        if (code.includes('async') && code.includes('await')) {
            points.push({
                id: `positive_modern_${Date.now()}`,
                type: 'positive',
                category: 'Modern Patterns',
                description: 'Using async/await',
                points: 5,
            });
        }

        return points;
    }

    private findNegativeKarma(code: string): KarmaPoint[] {
        const points: KarmaPoint[] = [];

        // any type
        if (code.includes(': any')) {
            points.push({
                id: `negative_any_${Date.now()}`,
                type: 'negative',
                category: 'Type Safety',
                description: 'Using any type',
                points: -10,
            });
        }

        // console.log in production
        const consoleCount = (code.match(/console\.(log|warn|error)/g) || []).length;
        if (consoleCount > 2) {
            points.push({
                id: `negative_console_${Date.now()}`,
                type: 'negative',
                category: 'Debugging',
                description: `Multiple console statements (${consoleCount})`,
                points: -5 * consoleCount,
            });
        }

        // TODO/FIXME
        const todoCount = (code.match(/TODO|FIXME|HACK/g) || []).length;
        if (todoCount > 0) {
            points.push({
                id: `negative_todo_${Date.now()}`,
                type: 'negative',
                category: 'Technical Debt',
                description: `Unresolved TODOs (${todoCount})`,
                points: -5 * todoCount,
            });
        }

        // Magic numbers
        if (code.match(/[^a-zA-Z_]\d{3,}[^a-zA-Z_]/)) {
            points.push({
                id: `negative_magic_${Date.now()}`,
                type: 'negative',
                category: 'Readability',
                description: 'Magic numbers present',
                points: -5,
            });
        }

        // God functions (very long functions)
        const lines = code.split('\n').length;
        if (lines > 200) {
            points.push({
                id: `negative_god_${Date.now()}`,
                type: 'negative',
                category: 'Maintainability',
                description: 'Extremely long file',
                points: -15,
            });
        }

        // Deeply nested code
        let maxNesting = 0;
        let nesting = 0;
        for (const char of code) {
            if (char === '{') nesting++;
            if (char === '}') nesting--;
            maxNesting = Math.max(maxNesting, nesting);
        }
        if (maxNesting > 5) {
            points.push({
                id: `negative_nesting_${Date.now()}`,
                type: 'negative',
                category: 'Complexity',
                description: `Deep nesting (${maxNesting} levels)`,
                points: -10,
            });
        }

        return points;
    }

    private calculateTotalKarma(positive: KarmaPoint[], negative: KarmaPoint[]): number {
        const positiveTotal = positive.reduce((s, p) => s + p.points, 0);
        const negativeTotal = negative.reduce((s, p) => s + p.points, 0);
        return positiveTotal + negativeTotal;
    }

    private determineBalance(totalKarma: number): KarmaBalance {
        let level: KarmaBalance['level'];
        let trend: KarmaBalance['trend'] = 'stable';

        if (totalKarma >= 30) {
            level = 'enlightened';
            trend = 'improving';
        } else if (totalKarma >= 10) {
            level = 'balanced';
        } else if (totalKarma >= -10) {
            level = 'burdened';
            trend = 'declining';
        } else {
            level = 'critical';
            trend = 'declining';
        }

        return { level, score: totalKarma, trend };
    }

    private determineKarmaPath(balance: KarmaBalance, negative: KarmaPoint[]): KarmaPath {
        const nextLevel = balance.level === 'critical' ? 'burdened' :
            balance.level === 'burdened' ? 'balanced' :
                balance.level === 'balanced' ? 'enlightened' : 'nirvana';

        const actionsToImprove = negative.slice(0, 3).map(n =>
            `Fix: ${n.description} (+${Math.abs(n.points)} karma)`
        );

        if (actionsToImprove.length === 0) {
            actionsToImprove.push('Add tests (+20 karma)');
            actionsToImprove.push('Add documentation (+10 karma)');
        }

        return {
            current: balance.level,
            nextMilestone: nextLevel,
            actionsToImprove,
        };
    }

    getReport(id: string): KarmaReport | undefined {
        return this.reports.get(id);
    }

    getStats(): { total: number; avgKarma: number; enlightenedCount: number } {
        const reports = Array.from(this.reports.values());
        return {
            total: reports.length,
            avgKarma: reports.length > 0
                ? reports.reduce((s, r) => s + r.totalKarma, 0) / reports.length
                : 0,
            enlightenedCount: reports.filter(r => r.balance.level === 'enlightened').length,
        };
    }
}

export const karmaCodeBalance = KarmaCodeBalance.getInstance();
