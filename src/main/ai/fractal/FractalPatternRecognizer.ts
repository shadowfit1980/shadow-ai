/**
 * Fractal Pattern Recognizer
 * 
 * Detects self-similar patterns at different scales in code,
 * revealing hidden structure and opportunities for abstraction.
 */

import { EventEmitter } from 'events';

export interface FractalAnalysis {
    id: string;
    code: string;
    patterns: FractalPattern[];
    dimensions: FractalDimension[];
    selfsimilarity: number;
    abstractionOpportunities: AbstractionOpportunity[];
    createdAt: Date;
}

export interface FractalPattern {
    id: string;
    name: string;
    scale: 'micro' | 'meso' | 'macro';
    occurrences: number;
    locations: number[];
    template: string;
}

export interface FractalDimension {
    level: number;
    description: string;
    complexity: number;
    examples: string[];
}

export interface AbstractionOpportunity {
    pattern: string;
    currentLevel: number;
    suggestedLevel: number;
    benefit: string;
    implementation: string;
}

export class FractalPatternRecognizer extends EventEmitter {
    private static instance: FractalPatternRecognizer;
    private analyses: Map<string, FractalAnalysis> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): FractalPatternRecognizer {
        if (!FractalPatternRecognizer.instance) {
            FractalPatternRecognizer.instance = new FractalPatternRecognizer();
        }
        return FractalPatternRecognizer.instance;
    }

    analyze(code: string): FractalAnalysis {
        const patterns = this.detectPatterns(code);
        const dimensions = this.analyzeDimensions(code);
        const selfsimilarity = this.calculateSelfSimilarity(patterns);
        const abstractionOpportunities = this.findAbstractionOpportunities(patterns);

        const analysis: FractalAnalysis = {
            id: `fractal_${Date.now()}`,
            code,
            patterns,
            dimensions,
            selfsimilarity,
            abstractionOpportunities,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:created', analysis);
        return analysis;
    }

    private detectPatterns(code: string): FractalPattern[] {
        const patterns: FractalPattern[] = [];
        const lines = code.split('\n');

        // Micro patterns (single line)
        const assignments = lines.filter(l => l.includes('=') && !l.includes('=='));
        if (assignments.length > 3) {
            patterns.push({
                id: 'pattern_assignment',
                name: 'Assignment Pattern',
                scale: 'micro',
                occurrences: assignments.length,
                locations: assignments.map((_, i) => i),
                template: 'variable = value',
            });
        }

        // Meso patterns (function-level)
        const functions = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
        if (functions.length > 2) {
            patterns.push({
                id: 'pattern_function',
                name: 'Function Definition Pattern',
                scale: 'meso',
                occurrences: functions.length,
                locations: [],
                template: 'function name(params) { body }',
            });
        }

        // Macro patterns (structural)
        const classes = (code.match(/class\s+\w+/g) || []).length;
        const interfaces = (code.match(/interface\s+\w+/g) || []).length;
        if (classes + interfaces > 1) {
            patterns.push({
                id: 'pattern_oop',
                name: 'Object-Oriented Pattern',
                scale: 'macro',
                occurrences: classes + interfaces,
                locations: [],
                template: 'class/interface with members',
            });
        }

        // Error handling pattern
        const tryBlocks = (code.match(/try\s*{/g) || []).length;
        if (tryBlocks > 1) {
            patterns.push({
                id: 'pattern_error',
                name: 'Error Handling Pattern',
                scale: 'meso',
                occurrences: tryBlocks,
                locations: [],
                template: 'try { ... } catch (e) { ... }',
            });
        }

        return patterns;
    }

    private analyzeDimensions(code: string): FractalDimension[] {
        const dimensions: FractalDimension[] = [];
        const lines = code.split('\n');

        // Level 0: Character level
        dimensions.push({
            level: 0,
            description: 'Character Level',
            complexity: code.length / 1000,
            examples: ['Individual characters', 'Operators', 'Punctuation'],
        });

        // Level 1: Token level
        const tokens = code.split(/\s+/).length;
        dimensions.push({
            level: 1,
            description: 'Token Level',
            complexity: tokens / 100,
            examples: ['Keywords', 'Identifiers', 'Literals'],
        });

        // Level 2: Statement level
        const statements = (code.match(/;/g) || []).length;
        dimensions.push({
            level: 2,
            description: 'Statement Level',
            complexity: statements / 50,
            examples: ['Assignments', 'Calls', 'Returns'],
        });

        // Level 3: Block level
        const blocks = (code.match(/{/g) || []).length;
        dimensions.push({
            level: 3,
            description: 'Block Level',
            complexity: blocks / 20,
            examples: ['Functions', 'Loops', 'Conditionals'],
        });

        // Level 4: Module level
        dimensions.push({
            level: 4,
            description: 'Module Level',
            complexity: lines.length / 200,
            examples: ['Classes', 'Exports', 'Imports'],
        });

        return dimensions;
    }

    private calculateSelfSimilarity(patterns: FractalPattern[]): number {
        if (patterns.length === 0) return 0;

        // Higher self-similarity if patterns repeat at different scales
        const scales = new Set(patterns.map(p => p.scale));
        const scaleSpread = scales.size / 3; // 3 possible scales

        // Average occurrences as repetition indicator
        const avgOccurrences = patterns.reduce((s, p) => s + p.occurrences, 0) / patterns.length;
        const repetition = Math.min(1, avgOccurrences / 10);

        return (scaleSpread + repetition) / 2;
    }

    private findAbstractionOpportunities(patterns: FractalPattern[]): AbstractionOpportunity[] {
        const opportunities: AbstractionOpportunity[] = [];

        for (const pattern of patterns) {
            if (pattern.occurrences >= 3) {
                opportunities.push({
                    pattern: pattern.name,
                    currentLevel: pattern.scale === 'micro' ? 1 : pattern.scale === 'meso' ? 2 : 3,
                    suggestedLevel: pattern.scale === 'micro' ? 2 : 3,
                    benefit: `Reduce ${pattern.occurrences} occurrences to single abstraction`,
                    implementation: `Extract ${pattern.template} into reusable ${pattern.scale === 'micro' ? 'function' : 'module'}`,
                });
            }
        }

        return opportunities;
    }

    getAnalysis(id: string): FractalAnalysis | undefined {
        return this.analyses.get(id);
    }

    getAllAnalyses(): FractalAnalysis[] {
        return Array.from(this.analyses.values());
    }

    getStats(): { total: number; avgSelfSimilarity: number; patternCount: number } {
        const analyses = Array.from(this.analyses.values());
        return {
            total: analyses.length,
            avgSelfSimilarity: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.selfsimilarity, 0) / analyses.length
                : 0,
            patternCount: analyses.reduce((s, a) => s + a.patterns.length, 0),
        };
    }
}

export const fractalPatternRecognizer = FractalPatternRecognizer.getInstance();
