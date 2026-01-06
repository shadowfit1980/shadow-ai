/**
 * Sustainability Optimizer
 * 
 * Analyze code for energy efficiency and suggest eco-friendly alternatives.
 * Profile resource usage and recommend green computing practices.
 */

import { EventEmitter } from 'events';

export interface SustainabilityAnalysis {
    id: string;
    code: string;
    language: string;
    energyScore: EnergyScore;
    issues: SustainabilityIssue[];
    recommendations: Recommendation[];
    estimatedImpact: EnvironmentalImpact;
    analyzedAt: Date;
}

export interface EnergyScore {
    overall: number; // 0-100, higher = more efficient
    cpu: number;
    memory: number;
    network: number;
    storage: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface SustainabilityIssue {
    id: string;
    type: IssueType;
    severity: 'minor' | 'moderate' | 'major';
    description: string;
    location: { line: number; column: number };
    estimatedWaste: ResourceWaste;
    pattern: string;
}

export type IssueType =
    | 'polling'
    | 'unoptimized_loop'
    | 'memory_leak'
    | 'redundant_fetch'
    | 'large_payload'
    | 'unused_import'
    | 'inefficient_algorithm'
    | 'blocking_operation'
    | 'excessive_logging';

export interface ResourceWaste {
    cpuMs: number;
    memoryMb: number;
    networkKb: number;
    co2Grams: number;
}

export interface Recommendation {
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    codeBefore: string;
    codeAfter: string;
    estimatedSavings: ResourceWaste;
    implementation: 'trivial' | 'moderate' | 'complex';
}

export interface EnvironmentalImpact {
    dailyCO2Grams: number;
    yearlyCO2Kg: number;
    treesNeeded: number; // To offset
    equivalentDriving: string; // e.g., "5 miles"
    serverCostPerYear: number; // USD estimate
}

// Detection patterns
const INEFFICIENCY_PATTERNS: {
    type: IssueType;
    pattern: RegExp;
    severity: SustainabilityIssue['severity'];
    wasteMultiplier: number;
}[] = [
        {
            type: 'polling',
            pattern: /setInterval\s*\([^)]+,\s*(\d+)\s*\)/g,
            severity: 'moderate',
            wasteMultiplier: 0.1,
        },
        {
            type: 'polling',
            pattern: /while\s*\(\s*true\s*\)/g,
            severity: 'major',
            wasteMultiplier: 1.0,
        },
        {
            type: 'unoptimized_loop',
            pattern: /\.forEach[^}]+\.forEach/g,
            severity: 'moderate',
            wasteMultiplier: 0.3,
        },
        {
            type: 'unoptimized_loop',
            pattern: /for\s*\([^)]+\)\s*{[^}]*for\s*\([^)]+\)\s*{[^}]*for/g,
            severity: 'major',
            wasteMultiplier: 0.8,
        },
        {
            type: 'redundant_fetch',
            pattern: /fetch\([^)]+\)(?:[^}]*fetch\([^)]+\)){2,}/g,
            severity: 'moderate',
            wasteMultiplier: 0.5,
        },
        {
            type: 'large_payload',
            pattern: /JSON\.stringify\([^)]{100,}\)/g,
            severity: 'minor',
            wasteMultiplier: 0.2,
        },
        {
            type: 'excessive_logging',
            pattern: /(console\.(log|debug|info)\s*\([^)]+\)\s*;?\s*){3,}/g,
            severity: 'minor',
            wasteMultiplier: 0.1,
        },
        {
            type: 'blocking_operation',
            pattern: /readFileSync|writeFileSync|execSync/g,
            severity: 'moderate',
            wasteMultiplier: 0.4,
        },
        {
            type: 'unused_import',
            pattern: /import\s+{\s*(\w+)\s*}[^;]+;\s*(?![\s\S]*\1)/g,
            severity: 'minor',
            wasteMultiplier: 0.05,
        },
    ];

// Optimization suggestions
const OPTIMIZATIONS: Record<IssueType, (match: string) => { before: string; after: string; savings: number }> = {
    polling: (match) => ({
        before: match,
        after: match.replace(/setInterval/, '// Consider event-driven: EventEmitter or WebSocket'),
        savings: 0.7,
    }),
    unoptimized_loop: (match) => ({
        before: 'nested forEach loops',
        after: 'Use .flatMap() or single-pass algorithm',
        savings: 0.5,
    }),
    memory_leak: (match) => ({
        before: 'event listener without cleanup',
        after: 'Add removeEventListener in cleanup',
        savings: 0.8,
    }),
    redundant_fetch: (match) => ({
        before: 'multiple fetch calls',
        after: 'Batch requests or use Promise.all()',
        savings: 0.6,
    }),
    large_payload: (match) => ({
        before: 'large JSON payload',
        after: 'Paginate, compress, or stream data',
        savings: 0.4,
    }),
    unused_import: (match) => ({
        before: match,
        after: '// Remove unused import',
        savings: 0.1,
    }),
    inefficient_algorithm: (match) => ({
        before: 'O(n²) algorithm',
        after: 'Consider O(n log n) or O(n) alternative',
        savings: 0.9,
    }),
    blocking_operation: (match) => ({
        before: match,
        after: match.replace('Sync', ''),
        savings: 0.5,
    }),
    excessive_logging: (match) => ({
        before: 'Multiple console logs',
        after: 'Use structured logging with levels',
        savings: 0.3,
    }),
};

export class SustainabilityOptimizer extends EventEmitter {
    private static instance: SustainabilityOptimizer;
    private analyses: Map<string, SustainabilityAnalysis> = new Map();

    // Constants for impact calculation
    private readonly CO2_PER_CPU_MS = 0.0001; // grams
    private readonly CO2_PER_MB = 0.001;
    private readonly CO2_PER_KB_NETWORK = 0.0002;
    private readonly TREE_ABSORBS_KG_PER_YEAR = 22;

    private constructor() {
        super();
    }

    static getInstance(): SustainabilityOptimizer {
        if (!SustainabilityOptimizer.instance) {
            SustainabilityOptimizer.instance = new SustainabilityOptimizer();
        }
        return SustainabilityOptimizer.instance;
    }

    // ========================================================================
    // ANALYSIS
    // ========================================================================

    /**
     * Analyze code for sustainability issues
     */
    analyze(code: string, language: string = 'javascript'): SustainabilityAnalysis {
        const id = `analysis_${Date.now()}`;
        const issues: SustainabilityIssue[] = [];
        const lines = code.split('\n');

        // Detect patterns
        for (const { type, pattern, severity, wasteMultiplier } of INEFFICIENCY_PATTERNS) {
            let match;
            const regex = new RegExp(pattern);

            while ((match = regex.exec(code)) !== null) {
                // Find line number
                const beforeMatch = code.slice(0, match.index);
                const lineNumber = beforeMatch.split('\n').length;

                const waste = this.calculateWaste(match[0], wasteMultiplier);

                issues.push({
                    id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    severity,
                    description: this.getIssueDescription(type, match[0]),
                    location: { line: lineNumber, column: 0 },
                    estimatedWaste: waste,
                    pattern: match[0].slice(0, 50),
                });
            }
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(issues);

        // Calculate scores
        const energyScore = this.calculateEnergyScore(code, issues);

        // Calculate environmental impact
        const estimatedImpact = this.calculateEnvironmentalImpact(issues);

        const analysis: SustainabilityAnalysis = {
            id,
            code: code.slice(0, 500) + (code.length > 500 ? '...' : ''),
            language,
            energyScore,
            issues,
            recommendations,
            estimatedImpact,
            analyzedAt: new Date(),
        };

        this.analyses.set(id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private getIssueDescription(type: IssueType, match: string): string {
        const descriptions: Record<IssueType, string> = {
            polling: 'Polling consumes CPU cycles even when idle. Consider event-driven alternatives.',
            unoptimized_loop: 'Nested loops increase time complexity and CPU usage.',
            memory_leak: 'Potential memory leak may cause increasing resource consumption.',
            redundant_fetch: 'Multiple network requests could be batched to reduce overhead.',
            large_payload: 'Large payloads increase network transfer and memory usage.',
            unused_import: 'Unused imports add to bundle size and parsing time.',
            inefficient_algorithm: 'Algorithm complexity may be reduced for better performance.',
            blocking_operation: 'Synchronous operations block the event loop, wasting CPU cycles.',
            excessive_logging: 'Excessive logging adds overhead and increases I/O operations.',
        };
        return descriptions[type] || 'Optimization opportunity detected.';
    }

    private calculateWaste(match: string, multiplier: number): ResourceWaste {
        const baseWaste = {
            cpuMs: 100 * multiplier,
            memoryMb: 10 * multiplier,
            networkKb: 50 * multiplier,
            co2Grams: 0,
        };

        baseWaste.co2Grams =
            baseWaste.cpuMs * this.CO2_PER_CPU_MS +
            baseWaste.memoryMb * this.CO2_PER_MB +
            baseWaste.networkKb * this.CO2_PER_KB_NETWORK;

        return baseWaste;
    }

    private calculateEnergyScore(code: string, issues: SustainabilityIssue[]): EnergyScore {
        let score = 100;

        // Deduct points for issues
        for (const issue of issues) {
            switch (issue.severity) {
                case 'major': score -= 15; break;
                case 'moderate': score -= 8; break;
                case 'minor': score -= 3; break;
            }
        }

        score = Math.max(0, Math.min(100, score));

        // Calculate sub-scores
        const cpuIssues = issues.filter(i =>
            ['polling', 'unoptimized_loop', 'blocking_operation', 'inefficient_algorithm'].includes(i.type)
        );
        const memoryIssues = issues.filter(i =>
            ['memory_leak', 'large_payload'].includes(i.type)
        );
        const networkIssues = issues.filter(i =>
            ['redundant_fetch', 'large_payload'].includes(i.type)
        );

        return {
            overall: score,
            cpu: Math.max(0, 100 - cpuIssues.length * 20),
            memory: Math.max(0, 100 - memoryIssues.length * 20),
            network: Math.max(0, 100 - networkIssues.length * 20),
            storage: 90, // Default, would need file system analysis
            grade: this.scoreToGrade(score),
        };
    }

    private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    private generateRecommendations(issues: SustainabilityIssue[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        for (const issue of issues) {
            const optimizer = OPTIMIZATIONS[issue.type];
            if (optimizer) {
                const { before, after, savings } = optimizer(issue.pattern);

                recommendations.push({
                    priority: issue.severity === 'major' ? 'high' : issue.severity === 'moderate' ? 'medium' : 'low',
                    title: `Optimize ${issue.type.replace(/_/g, ' ')}`,
                    description: issue.description,
                    codeBefore: before,
                    codeAfter: after,
                    estimatedSavings: {
                        cpuMs: issue.estimatedWaste.cpuMs * savings,
                        memoryMb: issue.estimatedWaste.memoryMb * savings,
                        networkKb: issue.estimatedWaste.networkKb * savings,
                        co2Grams: issue.estimatedWaste.co2Grams * savings,
                    },
                    implementation: savings > 0.7 ? 'trivial' : savings > 0.4 ? 'moderate' : 'complex',
                });
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    private calculateEnvironmentalImpact(issues: SustainabilityIssue[]): EnvironmentalImpact {
        const totalWaste = issues.reduce((sum, issue) => ({
            cpuMs: sum.cpuMs + issue.estimatedWaste.cpuMs,
            memoryMb: sum.memoryMb + issue.estimatedWaste.memoryMb,
            networkKb: sum.networkKb + issue.estimatedWaste.networkKb,
            co2Grams: sum.co2Grams + issue.estimatedWaste.co2Grams,
        }), { cpuMs: 0, memoryMb: 0, networkKb: 0, co2Grams: 0 });

        // Assume code runs 1000 times per day
        const dailyRuns = 1000;
        const dailyCO2 = totalWaste.co2Grams * dailyRuns;
        const yearlyCO2 = (dailyCO2 * 365) / 1000; // kg

        return {
            dailyCO2Grams: dailyCO2,
            yearlyCO2Kg: yearlyCO2,
            treesNeeded: Math.ceil(yearlyCO2 / this.TREE_ABSORBS_KG_PER_YEAR),
            equivalentDriving: `${(yearlyCO2 / 0.21).toFixed(1)} miles`, // ~0.21 kg CO2 per mile
            serverCostPerYear: Math.round(totalWaste.cpuMs * dailyRuns * 365 * 0.00001), // Rough estimate
        };
    }

    // ========================================================================
    // OPTIMIZATION
    // ========================================================================

    /**
     * Apply optimizations to code
     */
    optimize(code: string): { optimizedCode: string; changes: string[] } {
        let optimizedCode = code;
        const changes: string[] = [];

        // Apply simple transformations
        const transformations = [
            {
                name: 'Convert polling to event-driven',
                from: /setInterval\s*\(\s*function\s*\(\)\s*{\s*([^}]+)\s*}\s*,\s*\d+\s*\)/g,
                to: '// TODO: Replace with event-driven: EventEmitter.on("event", () => { $1 })',
            },
            {
                name: 'Convert sync to async',
                from: /readFileSync\(([^)]+)\)/g,
                to: 'await readFile($1)',
            },
            {
                name: 'Remove excessive logging',
                from: /(console\.log\([^)]+\);\s*){3,}/g,
                to: '// Consolidated: logger.debug(...);\n',
            },
        ];

        for (const transform of transformations) {
            if (transform.from.test(optimizedCode)) {
                optimizedCode = optimizedCode.replace(transform.from, transform.to);
                changes.push(transform.name);
            }
        }

        return { optimizedCode, changes };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAnalysis(id: string): SustainabilityAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): SustainabilityAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getGreenTips(): string[] {
        return [
            '💡 Use event-driven architecture instead of polling',
            '🔄 Batch API requests to reduce network overhead',
            '📦 Lazy load modules and components',
            '🗑️ Clean up event listeners and intervals',
            '📊 Use pagination for large datasets',
            '🗜️ Compress assets and payloads',
            '⏰ Use debouncing for rapid-fire events',
            '🧊 Implement caching at multiple levels',
            '🔌 Use WebSockets for real-time updates',
            '📉 Profile and optimize hot paths',
        ];
    }
}

export const sustainabilityOptimizer = SustainabilityOptimizer.getInstance();
