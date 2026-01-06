/**
 * Parallel Universe Code Explorer
 * 
 * Explores alternative implementations that could exist,
 * showing developers what their code "could have been."
 */

import { EventEmitter } from 'events';

export interface UniverseExploration {
    id: string;
    originalCode: string;
    universes: AlternativeUniverse[];
    comparison: UniverseComparison;
    recommendation: string;
    createdAt: Date;
}

export interface AlternativeUniverse {
    id: string;
    name: string;
    description: string;
    code: string;
    paradigm: string;
    tradeoffs: Tradeoff[];
    similarity: number;
}

export interface Tradeoff {
    aspect: string;
    original: number;
    alternative: number;
    winner: 'original' | 'alternative' | 'tie';
}

export interface UniverseComparison {
    bestForPerformance: string;
    bestForReadability: string;
    bestForMaintainability: string;
    bestOverall: string;
}

export class ParallelUniverseCodeExplorer extends EventEmitter {
    private static instance: ParallelUniverseCodeExplorer;
    private explorations: Map<string, UniverseExploration> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): ParallelUniverseCodeExplorer {
        if (!ParallelUniverseCodeExplorer.instance) {
            ParallelUniverseCodeExplorer.instance = new ParallelUniverseCodeExplorer();
        }
        return ParallelUniverseCodeExplorer.instance;
    }

    explore(code: string): UniverseExploration {
        const universes = this.generateAlternativeUniverses(code);
        const comparison = this.compareUniverses(code, universes);

        const exploration: UniverseExploration = {
            id: `explore_${Date.now()}`,
            originalCode: code,
            universes,
            comparison,
            recommendation: this.generateRecommendation(universes, comparison),
            createdAt: new Date(),
        };

        this.explorations.set(exploration.id, exploration);
        this.emit('exploration:completed', exploration);
        return exploration;
    }

    private generateAlternativeUniverses(code: string): AlternativeUniverse[] {
        const universes: AlternativeUniverse[] = [];

        // Functional universe
        if (code.includes('class') || code.includes('this.')) {
            universes.push({
                id: `universe_functional_${Date.now()}`,
                name: 'Functional Universe',
                description: 'What if this was written functionally?',
                code: this.toFunctional(code),
                paradigm: 'functional',
                tradeoffs: [
                    { aspect: 'Immutability', original: 0.3, alternative: 0.9, winner: 'alternative' },
                    { aspect: 'State Management', original: 0.7, alternative: 0.5, winner: 'original' },
                ],
                similarity: 0.6,
            });
        }

        // OOP universe
        if (!code.includes('class') && code.includes('function')) {
            universes.push({
                id: `universe_oop_${Date.now()}`,
                name: 'Object-Oriented Universe',
                description: 'What if this was class-based?',
                code: this.toOOP(code),
                paradigm: 'object-oriented',
                tradeoffs: [
                    { aspect: 'Encapsulation', original: 0.4, alternative: 0.8, winner: 'alternative' },
                    { aspect: 'Simplicity', original: 0.8, alternative: 0.5, winner: 'original' },
                ],
                similarity: 0.7,
            });
        }

        // Declarative universe
        if (code.includes('for') || code.includes('while')) {
            universes.push({
                id: `universe_declarative_${Date.now()}`,
                name: 'Declarative Universe',
                description: 'What if loops were replaced with declarations?',
                code: this.toDeclarative(code),
                paradigm: 'declarative',
                tradeoffs: [
                    { aspect: 'Readability', original: 0.5, alternative: 0.8, winner: 'alternative' },
                    { aspect: 'Performance', original: 0.7, alternative: 0.6, winner: 'original' },
                ],
                similarity: 0.8,
            });
        }

        // Reactive universe
        if (code.includes('callback') || code.includes('addEventListener')) {
            universes.push({
                id: `universe_reactive_${Date.now()}`,
                name: 'Reactive Universe',
                description: 'What if this used reactive streams?',
                code: this.toReactive(code),
                paradigm: 'reactive',
                tradeoffs: [
                    { aspect: 'Composability', original: 0.4, alternative: 0.9, winner: 'alternative' },
                    { aspect: 'Learning Curve', original: 0.2, alternative: 0.7, winner: 'original' },
                ],
                similarity: 0.5,
            });
        }

        // Minimal universe
        universes.push({
            id: `universe_minimal_${Date.now()}`,
            name: 'Minimal Universe',
            description: 'The most concise version possible',
            code: this.toMinimal(code),
            paradigm: 'minimalist',
            tradeoffs: [
                { aspect: 'Lines of Code', original: 0.4, alternative: 0.9, winner: 'alternative' },
                { aspect: 'Clarity', original: 0.7, alternative: 0.5, winner: 'original' },
            ],
            similarity: 0.7,
        });

        return universes;
    }

    private toFunctional(code: string): string {
        let result = code;
        result = result.replace(/class\s+(\w+)/g, 'const $1 = ');
        result = result.replace(/this\./g, '');
        result = result.replace(/new\s+(\w+)/g, 'create$1');
        return `// Functional transformation\n${result}`;
    }

    private toOOP(code: string): string {
        const funcName = code.match(/function\s+(\w+)/)?.[1] || 'MyClass';
        return `// Object-Oriented transformation
class ${funcName.charAt(0).toUpperCase() + funcName.slice(1)} {
    constructor() {
        // Initialize state
    }
    
${code.replace(/function\s+\w+/g, 'method').replace(/^/gm, '    ')}
}`;
    }

    private toDeclarative(code: string): string {
        let result = code;
        result = result.replace(/for\s*\([^)]+\)\s*{([^}]+)}/g, 'items.map(item => {$1})');
        result = result.replace(/while\s*\([^)]+\)\s*{([^}]+)}/g, 'until(condition, () => {$1})');
        return `// Declarative transformation\n${result}`;
    }

    private toReactive(code: string): string {
        let result = code;
        result = result.replace(/callback\(/g, 'observable$.subscribe(');
        result = result.replace(/addEventListener\([^,]+,/g, 'fromEvent(element,');
        return `// Reactive transformation\nimport { Observable, fromEvent } from 'rxjs';\n\n${result}`;
    }

    private toMinimal(code: string): string {
        let result = code;
        // Remove comments
        result = result.replace(/\/\/[^\n]*/g, '');
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        // Remove empty lines
        result = result.replace(/\n\s*\n/g, '\n');
        // Shorten variable names (simplified)
        return `// Minimal transformation\n${result}`;
    }

    private compareUniverses(original: string, universes: AlternativeUniverse[]): UniverseComparison {
        let bestPerf = 'original';
        let bestRead = 'original';
        let bestMaint = 'original';

        for (const u of universes) {
            const perfScore = u.tradeoffs.find(t => t.aspect.toLowerCase().includes('perf'))?.alternative || 0;
            const readScore = u.tradeoffs.find(t => t.aspect.toLowerCase().includes('read'))?.alternative || 0;
            const maintScore = u.tradeoffs.find(t => t.aspect.toLowerCase().includes('maint'))?.alternative || 0;

            if (perfScore > 0.7) bestPerf = u.name;
            if (readScore > 0.7) bestRead = u.name;
            if (maintScore > 0.7) bestMaint = u.name;
        }

        return {
            bestForPerformance: bestPerf,
            bestForReadability: bestRead,
            bestForMaintainability: bestMaint,
            bestOverall: universes.length > 0 ? universes.sort((a, b) => b.similarity - a.similarity)[0].name : 'original',
        };
    }

    private generateRecommendation(universes: AlternativeUniverse[], comparison: UniverseComparison): string {
        if (universes.length === 0) {
            return 'The current implementation is already optimal for this context.';
        }

        const best = universes.find(u => u.name === comparison.bestOverall);
        if (best && best.similarity > 0.7) {
            return `Consider the ${best.name}: ${best.description}. It offers good trade-offs.`;
        }

        return 'The current implementation is a good balance. Alternative universes offer specialized trade-offs.';
    }

    getExploration(id: string): UniverseExploration | undefined {
        return this.explorations.get(id);
    }

    getStats(): { total: number; avgUniverses: number; topParadigms: string[] } {
        const explorations = Array.from(this.explorations.values());
        const paradigmCounts: Record<string, number> = {};

        for (const e of explorations) {
            for (const u of e.universes) {
                paradigmCounts[u.paradigm] = (paradigmCounts[u.paradigm] || 0) + 1;
            }
        }

        const topParadigms = Object.entries(paradigmCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([p]) => p);

        return {
            total: explorations.length,
            avgUniverses: explorations.length > 0
                ? explorations.reduce((s, e) => s + e.universes.length, 0) / explorations.length
                : 0,
            topParadigms,
        };
    }
}

export const parallelUniverseCodeExplorer = ParallelUniverseCodeExplorer.getInstance();
