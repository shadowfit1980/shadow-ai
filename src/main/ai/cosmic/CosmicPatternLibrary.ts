/**
 * Cosmic Pattern Library
 * 
 * A universal library of patterns that transcend programming languages,
 * representing the fundamental building blocks of all software.
 */

import { EventEmitter } from 'events';

export interface CosmicPattern {
    id: string;
    name: string;
    category: PatternCategory;
    description: string;
    universalForm: string;
    implementations: LanguageImplementation[];
    useCases: string[];
    antiPatterns: string[];
    cosmicSignificance: number;
}

export type PatternCategory =
    | 'creational'
    | 'structural'
    | 'behavioral'
    | 'concurrency'
    | 'architectural'
    | 'data'
    | 'communication';

export interface LanguageImplementation {
    language: string;
    code: string;
    notes?: string;
}

export interface PatternMatch {
    patternId: string;
    confidence: number;
    location: { start: number; end: number };
    suggestion?: string;
}

export class CosmicPatternLibrary extends EventEmitter {
    private static instance: CosmicPatternLibrary;
    private patterns: Map<string, CosmicPattern> = new Map();

    private constructor() {
        super();
        this.initializePatterns();
    }

    static getInstance(): CosmicPatternLibrary {
        if (!CosmicPatternLibrary.instance) {
            CosmicPatternLibrary.instance = new CosmicPatternLibrary();
        }
        return CosmicPatternLibrary.instance;
    }

    private initializePatterns(): void {
        const basePatterns: Omit<CosmicPattern, 'id'>[] = [
            {
                name: 'Singleton',
                category: 'creational',
                description: 'Ensure a class has only one instance with global access',
                universalForm: 'ONE = getInstance()',
                implementations: [
                    { language: 'typescript', code: 'static getInstance(): T { if (!instance) instance = new T(); return instance; }' },
                    { language: 'python', code: 'class Singleton: _instance = None; @classmethod def getInstance(cls): ...' },
                ],
                useCases: ['Configuration', 'Logging', 'Database connections'],
                antiPatterns: ['Global mutable state', 'Hidden dependencies'],
                cosmicSignificance: 0.8,
            },
            {
                name: 'Factory',
                category: 'creational',
                description: 'Create objects without specifying exact class',
                universalForm: 'OBJECT = Factory.create(type)',
                implementations: [
                    { language: 'typescript', code: 'function createWidget(type: string): Widget { switch(type) { ... } }' },
                ],
                useCases: ['Plugin systems', 'Dependency injection', 'Object pools'],
                antiPatterns: ['God factory', 'Tight coupling'],
                cosmicSignificance: 0.85,
            },
            {
                name: 'Observer',
                category: 'behavioral',
                description: 'Define subscription mechanism for state changes',
                universalForm: 'SUBJECT.notify(OBSERVERS)',
                implementations: [
                    { language: 'typescript', code: 'interface Observer { update(state: T): void }' },
                ],
                useCases: ['Event systems', 'UI updates', 'Pub/sub'],
                antiPatterns: ['Cascade updates', 'Memory leaks'],
                cosmicSignificance: 0.9,
            },
            {
                name: 'Strategy',
                category: 'behavioral',
                description: 'Define family of interchangeable algorithms',
                universalForm: 'CONTEXT.setStrategy(ALGORITHM)',
                implementations: [
                    { language: 'typescript', code: 'interface Strategy { execute(data: T): R }' },
                ],
                useCases: ['Sorting algorithms', 'Payment methods', 'Validation'],
                antiPatterns: ['Strategy explosion', 'Complex switching'],
                cosmicSignificance: 0.85,
            },
            {
                name: 'Adapter',
                category: 'structural',
                description: 'Convert interface of one class to another',
                universalForm: 'ADAPTER.adapt(INCOMPATIBLE)',
                implementations: [
                    { language: 'typescript', code: 'class Adapter implements Target { private adaptee: Adaptee; ... }' },
                ],
                useCases: ['Legacy integration', 'Third-party APIs', 'Format conversion'],
                antiPatterns: ['Adapter chains', 'Over-adaptation'],
                cosmicSignificance: 0.8,
            },
        ];

        for (const pattern of basePatterns) {
            const id = `cosmic_${pattern.name.toLowerCase()}`;
            this.patterns.set(id, { id, ...pattern });
        }
    }

    getPattern(nameOrId: string): CosmicPattern | undefined {
        const lower = nameOrId.toLowerCase();
        return this.patterns.get(`cosmic_${lower}`) ||
            Array.from(this.patterns.values()).find(p => p.name.toLowerCase() === lower);
    }

    getAllPatterns(): CosmicPattern[] {
        return Array.from(this.patterns.values());
    }

    getByCategory(category: PatternCategory): CosmicPattern[] {
        return Array.from(this.patterns.values()).filter(p => p.category === category);
    }

    detectPatterns(code: string): PatternMatch[] {
        const matches: PatternMatch[] = [];

        for (const pattern of this.patterns.values()) {
            const match = this.matchPattern(code, pattern);
            if (match) matches.push(match);
        }

        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    private matchPattern(code: string, pattern: CosmicPattern): PatternMatch | null {
        let confidence = 0;
        let found = false;

        const lower = code.toLowerCase();
        const patternLower = pattern.name.toLowerCase();

        // Check for explicit pattern mentions
        if (lower.includes(patternLower)) {
            confidence += 0.3;
            found = true;
        }

        // Check for pattern-specific signatures
        switch (pattern.name) {
            case 'Singleton':
                if (code.includes('getInstance') || code.includes('_instance')) {
                    confidence += 0.5;
                    found = true;
                }
                break;
            case 'Factory':
                if (code.includes('create') && code.includes('switch')) {
                    confidence += 0.4;
                    found = true;
                }
                break;
            case 'Observer':
                if (code.includes('subscribe') || code.includes('notify') || code.includes('emit')) {
                    confidence += 0.5;
                    found = true;
                }
                break;
            case 'Strategy':
                if (code.includes('Strategy') || (code.includes('interface') && code.includes('execute'))) {
                    confidence += 0.4;
                    found = true;
                }
                break;
            case 'Adapter':
                if (code.includes('Adapter') || code.includes('adapt')) {
                    confidence += 0.5;
                    found = true;
                }
                break;
        }

        if (!found) return null;

        return {
            patternId: pattern.id,
            confidence: Math.min(1, confidence),
            location: { start: 0, end: code.length },
            suggestion: `Consider using the ${pattern.name} pattern: ${pattern.description}`,
        };
    }

    suggestPattern(problemDescription: string): CosmicPattern[] {
        const lower = problemDescription.toLowerCase();
        const suggestions: CosmicPattern[] = [];

        for (const pattern of this.patterns.values()) {
            const matches = pattern.useCases.some(uc =>
                lower.includes(uc.toLowerCase()) || uc.toLowerCase().includes(lower)
            );
            if (matches) {
                suggestions.push(pattern);
            }
        }

        return suggestions.sort((a, b) => b.cosmicSignificance - a.cosmicSignificance);
    }

    getStats(): { total: number; byCategory: Record<string, number>; avgSignificance: number } {
        const patterns = Array.from(this.patterns.values());
        const byCategory: Record<string, number> = {};

        for (const p of patterns) {
            byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        }

        return {
            total: patterns.length,
            byCategory,
            avgSignificance: patterns.length > 0
                ? patterns.reduce((s, p) => s + p.cosmicSignificance, 0) / patterns.length
                : 0,
        };
    }
}

export const cosmicPatternLibrary = CosmicPatternLibrary.getInstance();
