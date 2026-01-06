/**
 * Sacred Geometry Analyzer
 * 
 * Analyzes code structure through the lens of sacred geometry,
 * finding golden ratios, fibonacci sequences, and harmonic proportions.
 */

import { EventEmitter } from 'events';

export interface SacredGeometryAnalysis {
    id: string;
    code: string;
    geometricPatterns: GeometricPattern[];
    proportions: Proportion[];
    harmonicScore: number;
    sacredNumbers: SacredNumber[];
    recommendations: GeometricRecommendation[];
    createdAt: Date;
}

export interface GeometricPattern {
    name: string;
    description: string;
    presence: number;
    location?: string;
}

export interface Proportion {
    name: string;
    ratio: number;
    ideal: number;
    deviation: number;
    significance: string;
}

export interface SacredNumber {
    value: number;
    occurrences: number;
    significance: string;
}

export interface GeometricRecommendation {
    pattern: string;
    suggestion: string;
    improvement: number;
}

export class SacredGeometryAnalyzer extends EventEmitter {
    private static instance: SacredGeometryAnalyzer;
    private analyses: Map<string, SacredGeometryAnalysis> = new Map();

    private readonly PHI = 1.618033988749895; // Golden ratio
    private readonly FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

    private constructor() {
        super();
    }

    static getInstance(): SacredGeometryAnalyzer {
        if (!SacredGeometryAnalyzer.instance) {
            SacredGeometryAnalyzer.instance = new SacredGeometryAnalyzer();
        }
        return SacredGeometryAnalyzer.instance;
    }

    analyze(code: string): SacredGeometryAnalysis {
        const geometricPatterns = this.findGeometricPatterns(code);
        const proportions = this.analyzeProportions(code);
        const sacredNumbers = this.findSacredNumbers(code);
        const harmonicScore = this.calculateHarmonicScore(proportions);
        const recommendations = this.generateRecommendations(proportions, geometricPatterns);

        const analysis: SacredGeometryAnalysis = {
            id: `sacred_${Date.now()}`,
            code,
            geometricPatterns,
            proportions,
            harmonicScore,
            sacredNumbers,
            recommendations,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private findGeometricPatterns(code: string): GeometricPattern[] {
        const patterns: GeometricPattern[] = [];
        const lines = code.split('\n');

        // Circle pattern - self-referential/recursive
        if (code.includes('this.') && code.match(/return this/)) {
            patterns.push({
                name: 'Circle',
                description: 'Self-referential pattern (method chaining or builder)',
                presence: 0.8,
            });
        }

        // Triangle pattern - three-part structure
        const threePartMatch = code.match(/(if|switch|try).*{/g);
        if (threePartMatch && threePartMatch.length === 3) {
            patterns.push({
                name: 'Triangle',
                description: 'Three-part control structure',
                presence: 0.7,
            });
        }

        // Spiral pattern - nested structures
        let maxNesting = 0;
        let nesting = 0;
        for (const char of code) {
            if (char === '{') nesting++;
            if (char === '}') nesting--;
            maxNesting = Math.max(maxNesting, nesting);
        }
        if (maxNesting >= 3) {
            patterns.push({
                name: 'Spiral',
                description: `Nested structure with ${maxNesting} levels`,
                presence: Math.min(1, maxNesting / 5),
            });
        }

        // Hexagon pattern - six-sided (six methods or properties)
        const methodCount = (code.match(/(?:function|async|get|set)\s+\w+/g) || []).length;
        if (methodCount === 6) {
            patterns.push({
                name: 'Hexagon',
                description: 'Six-method structure (perfect balance)',
                presence: 1.0,
            });
        }

        // Vesica Piscis - intersection of two circles (two interacting classes)
        const classCount = (code.match(/class\s+\w+/g) || []).length;
        if (classCount === 2) {
            patterns.push({
                name: 'Vesica Piscis',
                description: 'Two interacting classes',
                presence: 0.85,
            });
        }

        return patterns;
    }

    private analyzeProportions(code: string): Proportion[] {
        const proportions: Proportion[] = [];
        const lines = code.split('\n');

        // Code to comment ratio
        const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
        const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
        const codeCommentRatio = commentLines > 0 ? codeLines / commentLines : codeLines;

        proportions.push({
            name: 'Code to Comment',
            ratio: codeCommentRatio,
            ideal: this.PHI * 10, // ~16:1
            deviation: Math.abs(codeCommentRatio - this.PHI * 10) / (this.PHI * 10),
            significance: 'Balance between implementation and documentation',
        });

        // Function length to count ratio
        const functions = code.match(/(?:function|=>)/g) || [];
        const avgFunctionLength = functions.length > 0 ? lines.length / functions.length : lines.length;

        proportions.push({
            name: 'Lines per Function',
            ratio: avgFunctionLength,
            ideal: 21, // Fibonacci number
            deviation: Math.abs(avgFunctionLength - 21) / 21,
            significance: 'Function size following Fibonacci sequence',
        });

        // Import to export ratio
        const imports = (code.match(/import/g) || []).length;
        const exports = (code.match(/export/g) || []).length;
        const importExportRatio = exports > 0 ? imports / exports : imports;

        proportions.push({
            name: 'Import to Export',
            ratio: importExportRatio,
            ideal: this.PHI,
            deviation: Math.abs(importExportRatio - this.PHI) / this.PHI,
            significance: 'Module consumption vs production',
        });

        return proportions;
    }

    private findSacredNumbers(code: string): SacredNumber[] {
        const sacredNumbers: SacredNumber[] = [];

        // Check for Fibonacci occurrences
        for (const fib of this.FIBONACCI) {
            const regex = new RegExp(`\\b${fib}\\b`, 'g');
            const matches = code.match(regex) || [];
            if (matches.length > 0) {
                sacredNumbers.push({
                    value: fib,
                    occurrences: matches.length,
                    significance: 'Fibonacci number',
                });
            }
        }

        // Check for 7 (days of creation, chakras)
        const sevens = (code.match(/\b7\b/g) || []).length;
        if (sevens > 0) {
            sacredNumbers.push({
                value: 7,
                occurrences: sevens,
                significance: 'Number of completion and perfection',
            });
        }

        // Check for 12 (zodiac, months)
        const twelves = (code.match(/\b12\b/g) || []).length;
        if (twelves > 0) {
            sacredNumbers.push({
                value: 12,
                occurrences: twelves,
                significance: 'Number of cosmic order',
            });
        }

        return sacredNumbers;
    }

    private calculateHarmonicScore(proportions: Proportion[]): number {
        if (proportions.length === 0) return 0.5;

        const avgDeviation = proportions.reduce((s, p) => s + p.deviation, 0) / proportions.length;
        return Math.max(0, 1 - avgDeviation);
    }

    private generateRecommendations(
        proportions: Proportion[],
        patterns: GeometricPattern[]
    ): GeometricRecommendation[] {
        const recommendations: GeometricRecommendation[] = [];

        for (const prop of proportions) {
            if (prop.deviation > 0.3) {
                recommendations.push({
                    pattern: prop.name,
                    suggestion: `Adjust ${prop.name} ratio toward ${prop.ideal.toFixed(2)} (golden ratio derived)`,
                    improvement: prop.deviation * 0.5,
                });
            }
        }

        if (!patterns.some(p => p.name === 'Circle')) {
            recommendations.push({
                pattern: 'Circle',
                suggestion: 'Consider adding fluent interface (method chaining)',
                improvement: 0.2,
            });
        }

        return recommendations;
    }

    getAnalysis(id: string): SacredGeometryAnalysis | undefined {
        return this.analyses.get(id);
    }

    getStats(): { total: number; avgHarmony: number; dominantPattern: string } {
        const analyses = Array.from(this.analyses.values());
        const patternCounts: Record<string, number> = {};

        for (const a of analyses) {
            for (const p of a.geometricPatterns) {
                patternCounts[p.name] = (patternCounts[p.name] || 0) + 1;
            }
        }

        const dominantPattern = Object.entries(patternCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

        return {
            total: analyses.length,
            avgHarmony: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.harmonicScore, 0) / analyses.length
                : 0,
            dominantPattern,
        };
    }
}

export const sacredGeometryAnalyzer = SacredGeometryAnalyzer.getInstance();
