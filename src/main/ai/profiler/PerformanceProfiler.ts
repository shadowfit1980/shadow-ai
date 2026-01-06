/**
 * Performance Profiler
 * 
 * Profiles and optimizes code performance with bottleneck detection,
 * recommendations, and before/after comparisons.
 */

import { EventEmitter } from 'events';

export interface PerformanceProfile {
    id: string;
    name: string;
    code: string;
    language: string;
    metrics: PerformanceMetrics;
    bottlenecks: Bottleneck[];
    recommendations: Recommendation[];
    timestamp: Date;
}

export interface PerformanceMetrics {
    executionTime?: number;
    memoryUsage?: number;
    cpuUsage?: number;
    complexity: ComplexityMetrics;
    codeQuality: QualityMetrics;
}

export interface ComplexityMetrics {
    timeComplexity: string;
    spaceComplexity: string;
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    nestingDepth: number;
}

export interface QualityMetrics {
    linesOfCode: number;
    functionsCount: number;
    avgFunctionLength: number;
    duplicateBlocks: number;
}

export interface Bottleneck {
    type: BottleneckType;
    location: { line: number; column?: number };
    description: string;
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
}

export type BottleneckType =
    | 'loop_inefficiency'
    | 'memory_leak'
    | 'blocking_operation'
    | 'redundant_computation'
    | 'n_plus_one'
    | 'excessive_allocation'
    | 'synchronous_blocking';

export interface Recommendation {
    title: string;
    description: string;
    category: 'performance' | 'memory' | 'complexity' | 'best_practice';
    priority: 'high' | 'medium' | 'low';
    codeChange?: {
        before: string;
        after: string;
    };
}

export interface Comparison {
    id: string;
    beforeProfile: string;
    afterProfile: string;
    improvements: {
        metric: string;
        before: number;
        after: number;
        change: number;
        changePercent: number;
    }[];
}

export class PerformanceProfiler extends EventEmitter {
    private static instance: PerformanceProfiler;
    private profiles: Map<string, PerformanceProfile> = new Map();
    private comparisons: Map<string, Comparison> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PerformanceProfiler {
        if (!PerformanceProfiler.instance) {
            PerformanceProfiler.instance = new PerformanceProfiler();
        }
        return PerformanceProfiler.instance;
    }

    // ========================================================================
    // PROFILING
    // ========================================================================

    async profile(code: string, language: string, name?: string): Promise<PerformanceProfile> {
        const metrics = this.analyzeMetrics(code);
        const bottlenecks = this.detectBottlenecks(code);
        const recommendations = this.generateRecommendations(code, metrics, bottlenecks);

        const profile: PerformanceProfile = {
            id: `profile_${Date.now()}`,
            name: name || `Profile ${this.profiles.size + 1}`,
            code,
            language,
            metrics,
            bottlenecks,
            recommendations,
            timestamp: new Date(),
        };

        this.profiles.set(profile.id, profile);
        this.emit('profile:created', profile);
        return profile;
    }

    private analyzeMetrics(code: string): PerformanceMetrics {
        const lines = code.split('\n');
        const functions = (code.match(/function\s+\w+|=>\s*{|=>\s*[^{]/g) || []).length;

        // Calculate complexities
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
        const cognitiveComplexity = this.calculateCognitiveComplexity(code);
        const nestingDepth = this.calculateNestingDepth(code);
        const timeComplexity = this.inferTimeComplexity(code);
        const spaceComplexity = this.inferSpaceComplexity(code);

        // Find duplicates (simplified)
        const duplicates = this.findDuplicateBlocks(lines);

        return {
            complexity: {
                timeComplexity,
                spaceComplexity,
                cyclomaticComplexity,
                cognitiveComplexity,
                nestingDepth,
            },
            codeQuality: {
                linesOfCode: lines.filter(l => l.trim().length > 0).length,
                functionsCount: functions,
                avgFunctionLength: functions > 0 ? lines.length / functions : lines.length,
                duplicateBlocks: duplicates,
            },
        };
    }

    private calculateCyclomaticComplexity(code: string): number {
        // Count decision points
        const patterns = /\b(if|else if|while|for|case|catch|&&|\|\||\?)/g;
        const matches = code.match(patterns) || [];
        return matches.length + 1;
    }

    private calculateCognitiveComplexity(code: string): number {
        let complexity = 0;
        let nestingLevel = 0;
        const lines = code.split('\n');

        for (const line of lines) {
            // Increment for control structures
            if (/\b(if|else|switch|for|while|catch)\b/.test(line)) {
                complexity += 1 + nestingLevel;
            }

            // Track nesting
            const opens = (line.match(/{/g) || []).length;
            const closes = (line.match(/}/g) || []).length;
            nestingLevel += opens - closes;
            nestingLevel = Math.max(0, nestingLevel);
        }

        return complexity;
    }

    private calculateNestingDepth(code: string): number {
        let maxDepth = 0;
        let currentDepth = 0;

        for (const char of code) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === '}') {
                currentDepth--;
            }
        }

        return maxDepth;
    }

    private inferTimeComplexity(code: string): string {
        const lower = code.toLowerCase();

        // Check for nested loops
        const forLoops = (code.match(/\bfor\s*\(/g) || []).length;
        const whileLoops = (code.match(/\bwhile\s*\(/g) || []).length;
        const totalLoops = forLoops + whileLoops;

        if (lower.includes('.sort(') && totalLoops > 0) {
            return 'O(n² log n)';
        }
        if (totalLoops >= 3) {
            return 'O(n³)';
        }
        if (totalLoops === 2) {
            return 'O(n²)';
        }
        if (totalLoops === 1) {
            return 'O(n)';
        }
        if (lower.includes('.sort(')) {
            return 'O(n log n)';
        }
        if (lower.includes('.includes(') || lower.includes('.indexof(') || lower.includes('.find(')) {
            return 'O(n)';
        }

        return 'O(1)';
    }

    private inferSpaceComplexity(code: string): string {
        // Check for array/object creation in loops
        const hasArrayInLoop = /for.*\[[\s\S]*?\]|while.*\[[\s\S]*?\]/i.test(code);
        if (hasArrayInLoop) {
            return 'O(n)';
        }

        // Check for recursion
        const funcName = code.match(/function\s+(\w+)/)?.[1];
        if (funcName && code.includes(`${funcName}(`)) {
            return 'O(n)'; // Assuming linear stack depth
        }

        return 'O(1)';
    }

    private findDuplicateBlocks(lines: string[]): number {
        const blocks = new Map<string, number>();
        let duplicates = 0;

        for (let i = 0; i < lines.length - 2; i++) {
            const block = lines.slice(i, i + 3).join('\n').trim();
            if (block.length > 30) {
                const count = (blocks.get(block) || 0) + 1;
                blocks.set(block, count);
                if (count === 2) duplicates++;
            }
        }

        return duplicates;
    }

    // ========================================================================
    // BOTTLENECK DETECTION
    // ========================================================================

    private detectBottlenecks(code: string): Bottleneck[] {
        const bottlenecks: Bottleneck[] = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Nested loops
            if (/for\s*\(.*for\s*\(/s.test(code.slice(code.indexOf(line)))) {
                bottlenecks.push({
                    type: 'loop_inefficiency',
                    location: { line: lineNum },
                    description: 'Nested loops detected which may cause O(n²) complexity',
                    impact: 'high',
                    suggestion: 'Consider using a Map/Set for O(1) lookups or restructuring the algorithm',
                });
            }

            // forEach with await
            if (line.includes('.forEach') && code.includes('await')) {
                bottlenecks.push({
                    type: 'blocking_operation',
                    location: { line: lineNum },
                    description: 'forEach with async operations runs sequentially',
                    impact: 'medium',
                    suggestion: 'Use Promise.all with map for parallel execution',
                });
            }

            // Array.includes in loop
            if (/for|while/.test(lines[i - 1] || '') && line.includes('.includes(')) {
                bottlenecks.push({
                    type: 'n_plus_one',
                    location: { line: lineNum },
                    description: 'Array.includes() in loop creates O(n²) complexity',
                    impact: 'high',
                    suggestion: 'Convert array to Set before loop for O(1) lookups',
                });
            }

            // Synchronous file operations
            if (/readFileSync|writeFileSync|existsSync/.test(line)) {
                bottlenecks.push({
                    type: 'synchronous_blocking',
                    location: { line: lineNum },
                    description: 'Synchronous file operation blocks the event loop',
                    impact: 'high',
                    suggestion: 'Use async versions (readFile, writeFile) with await',
                });
            }

            // Excessive object creation in loop
            if (/for|while/.test(line) && /new\s+(Array|Object|Map|Set)/.test(lines[i + 1] || '')) {
                bottlenecks.push({
                    type: 'excessive_allocation',
                    location: { line: lineNum + 1 },
                    description: 'Object allocation inside loop may cause GC pressure',
                    impact: 'medium',
                    suggestion: 'Move object creation outside the loop if possible',
                });
            }
        }

        return bottlenecks;
    }

    // ========================================================================
    // RECOMMENDATIONS
    // ========================================================================

    private generateRecommendations(
        code: string,
        metrics: PerformanceMetrics,
        bottlenecks: Bottleneck[]
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // High cyclomatic complexity
        if (metrics.complexity.cyclomaticComplexity > 10) {
            recommendations.push({
                title: 'Reduce Cyclomatic Complexity',
                description: `Complexity of ${metrics.complexity.cyclomaticComplexity} is high. Consider extracting functions.`,
                category: 'complexity',
                priority: 'high',
            });
        }

        // Deep nesting
        if (metrics.complexity.nestingDepth > 4) {
            recommendations.push({
                title: 'Reduce Nesting Depth',
                description: `Nesting depth of ${metrics.complexity.nestingDepth} makes code hard to read.`,
                category: 'complexity',
                priority: 'medium',
                codeChange: {
                    before: 'if (a) { if (b) { if (c) { ... } } }',
                    after: 'if (!a) return;\nif (!b) return;\nif (!c) return;\n...',
                },
            });
        }

        // Long functions
        if (metrics.codeQuality.avgFunctionLength > 50) {
            recommendations.push({
                title: 'Break Down Long Functions',
                description: 'Average function length is high. Consider splitting into smaller functions.',
                category: 'best_practice',
                priority: 'medium',
            });
        }

        // Address bottlenecks
        for (const bottleneck of bottlenecks.filter(b => b.impact === 'high')) {
            recommendations.push({
                title: `Fix: ${bottleneck.description.slice(0, 40)}...`,
                description: bottleneck.suggestion,
                category: 'performance',
                priority: 'high',
            });
        }

        // Time complexity improvements
        if (metrics.complexity.timeComplexity.includes('n²') || metrics.complexity.timeComplexity.includes('n³')) {
            recommendations.push({
                title: 'Optimize Algorithm Complexity',
                description: `Current time complexity is ${metrics.complexity.timeComplexity}. Consider using more efficient data structures.`,
                category: 'performance',
                priority: 'high',
            });
        }

        return recommendations;
    }

    // ========================================================================
    // COMPARISON
    // ========================================================================

    async compare(beforeId: string, afterId: string): Promise<Comparison | undefined> {
        const before = this.profiles.get(beforeId);
        const after = this.profiles.get(afterId);

        if (!before || !after) return undefined;

        const improvements: Comparison['improvements'] = [];

        // Compare cyclomatic complexity
        const ccBefore = before.metrics.complexity.cyclomaticComplexity;
        const ccAfter = after.metrics.complexity.cyclomaticComplexity;
        improvements.push({
            metric: 'Cyclomatic Complexity',
            before: ccBefore,
            after: ccAfter,
            change: ccAfter - ccBefore,
            changePercent: ((ccAfter - ccBefore) / ccBefore) * 100,
        });

        // Compare cognitive complexity
        const cogBefore = before.metrics.complexity.cognitiveComplexity;
        const cogAfter = after.metrics.complexity.cognitiveComplexity;
        improvements.push({
            metric: 'Cognitive Complexity',
            before: cogBefore,
            after: cogAfter,
            change: cogAfter - cogBefore,
            changePercent: ((cogAfter - cogBefore) / cogBefore) * 100,
        });

        // Compare lines of code
        const locBefore = before.metrics.codeQuality.linesOfCode;
        const locAfter = after.metrics.codeQuality.linesOfCode;
        improvements.push({
            metric: 'Lines of Code',
            before: locBefore,
            after: locAfter,
            change: locAfter - locBefore,
            changePercent: ((locAfter - locBefore) / locBefore) * 100,
        });

        const comparison: Comparison = {
            id: `comp_${Date.now()}`,
            beforeProfile: beforeId,
            afterProfile: afterId,
            improvements,
        };

        this.comparisons.set(comparison.id, comparison);
        this.emit('comparison:created', comparison);
        return comparison;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getProfile(id: string): PerformanceProfile | undefined {
        return this.profiles.get(id);
    }

    getAllProfiles(): PerformanceProfile[] {
        return Array.from(this.profiles.values());
    }

    getComparison(id: string): Comparison | undefined {
        return this.comparisons.get(id);
    }

    getStats(): {
        totalProfiles: number;
        avgComplexity: number;
        totalBottlenecks: number;
    } {
        const profiles = Array.from(this.profiles.values());

        return {
            totalProfiles: profiles.length,
            avgComplexity: profiles.length > 0
                ? profiles.reduce((sum, p) => sum + p.metrics.complexity.cyclomaticComplexity, 0) / profiles.length
                : 0,
            totalBottlenecks: profiles.reduce((sum, p) => sum + p.bottlenecks.length, 0),
        };
    }
}

export const performanceProfiler = PerformanceProfiler.getInstance();
