/**
 * Zen Code Simplifier
 * 
 * Applies Zen principles to code: simplicity, mindfulness, and
 * the elimination of unnecessary complexity.
 */

import { EventEmitter } from 'events';

export interface ZenAnalysis {
    id: string;
    code: string;
    originalComplexity: number;
    zenState: ZenState;
    koans: Koan[];
    simplifications: Simplification[];
    enlightenment: number;
    createdAt: Date;
}

export interface ZenState {
    clarity: number;
    simplicity: number;
    mindfulness: number;
    flow: number;
    emptiness: number;
}

export interface Koan {
    question: string;
    insight: string;
    applicable: boolean;
}

export interface Simplification {
    before: string;
    after: string;
    principle: ZenPrinciple;
    improvement: number;
}

export type ZenPrinciple =
    | 'empty-your-cup'
    | 'beginners-mind'
    | 'less-is-more'
    | 'presence'
    | 'non-attachment'
    | 'wu-wei';

export class ZenCodeSimplifier extends EventEmitter {
    private static instance: ZenCodeSimplifier;
    private analyses: Map<string, ZenAnalysis> = new Map();
    private koans: Koan[] = [];

    private constructor() {
        super();
        this.initializeKoans();
    }

    static getInstance(): ZenCodeSimplifier {
        if (!ZenCodeSimplifier.instance) {
            ZenCodeSimplifier.instance = new ZenCodeSimplifier();
        }
        return ZenCodeSimplifier.instance;
    }

    private initializeKoans(): void {
        this.koans = [
            {
                question: 'What is the sound of one function calling?',
                insight: 'A function should have one purpose',
                applicable: true,
            },
            {
                question: 'If code falls in a codebase and no one reads it, does it exist?',
                insight: 'Remove unused code',
                applicable: true,
            },
            {
                question: 'Before enlightenment, write code. After enlightenment, write code.',
                insight: 'Simplicity comes through practice',
                applicable: true,
            },
            {
                question: 'The obstacle is the path.',
                insight: 'Complexity reveals opportunities for simplification',
                applicable: true,
            },
            {
                question: 'Empty your cup so that it may be filled.',
                insight: 'Remove assumptions before refactoring',
                applicable: true,
            },
        ];
    }

    analyze(code: string): ZenAnalysis {
        const originalComplexity = this.measureComplexity(code);
        const zenState = this.assessZenState(code);
        const koans = this.selectRelevantKoans(code);
        const simplifications = this.findSimplifications(code);

        const analysis: ZenAnalysis = {
            id: `zen_${Date.now()}`,
            code,
            originalComplexity,
            zenState,
            koans,
            simplifications,
            enlightenment: this.calculateEnlightenment(zenState),
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private measureComplexity(code: string): number {
        let complexity = 0;
        complexity += code.split('\n').length / 100;
        complexity += (code.match(/if|else|for|while|switch/g) || []).length * 0.05;
        complexity += (code.match(/\?\./g) || []).length * 0.02;
        complexity += (code.match(/&&|\|\|/g) || []).length * 0.03;
        return Math.min(1, complexity);
    }

    private assessZenState(code: string): ZenState {
        const lines = code.split('\n');
        const avgLineLength = code.length / lines.length;
        const hasComments = code.includes('//') || code.includes('/*');
        const hasTypes = code.includes(': ') && (code.includes('string') || code.includes('number'));

        return {
            clarity: hasComments ? 0.7 : 0.4,
            simplicity: Math.max(0, 1 - avgLineLength / 100),
            mindfulness: hasTypes ? 0.8 : 0.5,
            flow: code.includes('async') ? 0.7 : 0.6,
            emptiness: Math.max(0, 1 - lines.length / 200),
        };
    }

    private selectRelevantKoans(code: string): Koan[] {
        const relevant: Koan[] = [];

        // Select koans based on code characteristics
        if (code.split('\n').length > 100) {
            relevant.push(this.koans[4]); // Empty your cup
        }
        if ((code.match(/function|class/g) || []).length > 5) {
            relevant.push(this.koans[0]); // One function calling
        }
        if (code.includes('// unused') || code.includes('// TODO: remove')) {
            relevant.push(this.koans[1]); // Unused code
        }

        return relevant.length > 0 ? relevant : [this.koans[2]]; // Default: practice
    }

    private findSimplifications(code: string): Simplification[] {
        const simplifications: Simplification[] = [];

        // Check for nested ternaries
        if (code.includes('?') && code.match(/\?[^:]+\?/)) {
            simplifications.push({
                before: 'condition1 ? (condition2 ? a : b) : c',
                after: 'if/else or early return',
                principle: 'less-is-more',
                improvement: 0.3,
            });
        }

        // Check for long chains
        if (code.match(/\.\w+\([^)]*\)\.\w+\([^)]*\)\.\w+\([^)]*\)\.\w+/)) {
            simplifications.push({
                before: 'obj.method1().method2().method3().method4()',
                after: 'Use intermediate variables for clarity',
                principle: 'presence',
                improvement: 0.2,
            });
        }

        // Check for unnecessary else
        if (code.match(/if[^}]+return[^}]+}\s*else\s*{/)) {
            simplifications.push({
                before: 'if (...) { return x; } else { ... }',
                after: 'if (...) { return x; } // else is unnecessary',
                principle: 'empty-your-cup',
                improvement: 0.15,
            });
        }

        // Check for double negatives
        if (code.includes('!!') || code.match(/!\s*!\s*/)) {
            simplifications.push({
                before: '!!value',
                after: 'Boolean(value)',
                principle: 'beginners-mind',
                improvement: 0.1,
            });
        }

        return simplifications;
    }

    private calculateEnlightenment(state: ZenState): number {
        return (state.clarity + state.simplicity + state.mindfulness + state.flow + state.emptiness) / 5;
    }

    simplify(code: string): string {
        const analysis = this.analyze(code);
        let simplified = code;

        // Apply simplifications (basic example)
        simplified = simplified.replace(/else\s*{\s*return/g, 'return');
        simplified = simplified.replace(/!!/g, 'Boolean(');

        return simplified;
    }

    getAnalysis(id: string): ZenAnalysis | undefined {
        return this.analyses.get(id);
    }

    getStats(): { total: number; avgEnlightenment: number; topPrinciple: string } {
        const analyses = Array.from(this.analyses.values());
        const principleCounts: Record<string, number> = {};

        for (const a of analyses) {
            for (const s of a.simplifications) {
                principleCounts[s.principle] = (principleCounts[s.principle] || 0) + 1;
            }
        }

        const topPrinciple = Object.entries(principleCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

        return {
            total: analyses.length,
            avgEnlightenment: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.enlightenment, 0) / analyses.length
                : 0,
            topPrinciple,
        };
    }
}

export const zenCodeSimplifier = ZenCodeSimplifier.getInstance();
