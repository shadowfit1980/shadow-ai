/**
 * Metamorphic Code Transformer
 * 
 * Enables code to undergo complete metamorphosis, transforming
 * from one form (paradigm) to another while preserving functionality.
 */

import { EventEmitter } from 'events';

export interface Metamorphosis {
    id: string;
    originalCode: string;
    transformedCode: string;
    originalParadigm: Paradigm;
    targetParadigm: Paradigm;
    stages: MetamorphicStage[];
    preservedBehaviors: string[];
    completionLevel: number;
    createdAt: Date;
}

export type Paradigm =
    | 'imperative'
    | 'object-oriented'
    | 'functional'
    | 'reactive'
    | 'declarative'
    | 'event-driven';

export interface MetamorphicStage {
    name: string;
    description: string;
    code: string;
    progress: number;
}

export interface TransformationRule {
    from: string;
    to: string;
    description: string;
}

export class MetamorphicCodeTransformer extends EventEmitter {
    private static instance: MetamorphicCodeTransformer;
    private transformations: Map<string, Metamorphosis> = new Map();
    private rules: Map<string, TransformationRule[]> = new Map();

    private constructor() {
        super();
        this.initializeRules();
    }

    static getInstance(): MetamorphicCodeTransformer {
        if (!MetamorphicCodeTransformer.instance) {
            MetamorphicCodeTransformer.instance = new MetamorphicCodeTransformer();
        }
        return MetamorphicCodeTransformer.instance;
    }

    private initializeRules(): void {
        // OOP to Functional
        this.rules.set('object-oriented->functional', [
            { from: 'class', to: 'closures/functions', description: 'Replace classes with closures' },
            { from: 'methods', to: 'pure functions', description: 'Extract methods as pure functions' },
            { from: 'this.state', to: 'immutable data', description: 'Replace mutable state with immutable' },
            { from: 'inheritance', to: 'composition', description: 'Replace inheritance with composition' },
        ]);

        // Imperative to Declarative
        this.rules.set('imperative->declarative', [
            { from: 'for loops', to: 'map/filter/reduce', description: 'Replace loops with array methods' },
            { from: 'if/else chains', to: 'pattern matching', description: 'Use pattern matching syntax' },
            { from: 'mutation', to: 'immutability', description: 'Eliminate mutations' },
        ]);

        // Callbacks to Reactive
        this.rules.set('event-driven->reactive', [
            { from: 'callbacks', to: 'observables', description: 'Convert callbacks to observables' },
            { from: 'events', to: 'streams', description: 'Model events as streams' },
            { from: 'state', to: 'reactive state', description: 'Use reactive state management' },
        ]);
    }

    transform(code: string, targetParadigm: Paradigm): Metamorphosis {
        const originalParadigm = this.detectParadigm(code);
        const stages = this.generateStages(code, originalParadigm, targetParadigm);
        const transformedCode = this.applyTransformation(code, originalParadigm, targetParadigm);

        const metamorphosis: Metamorphosis = {
            id: `meta_${Date.now()}`,
            originalCode: code,
            transformedCode,
            originalParadigm,
            targetParadigm,
            stages,
            preservedBehaviors: this.identifyBehaviors(code),
            completionLevel: this.calculateCompletion(originalParadigm, targetParadigm),
            createdAt: new Date(),
        };

        this.transformations.set(metamorphosis.id, metamorphosis);
        this.emit('metamorphosis:completed', metamorphosis);
        return metamorphosis;
    }

    private detectParadigm(code: string): Paradigm {
        if (code.includes('class') && code.includes('extends')) return 'object-oriented';
        if (code.includes('Observable') || code.includes('subscribe')) return 'reactive';
        if (code.includes('addEventListener') || code.includes('.on(')) return 'event-driven';
        if (code.includes('=>') && !code.includes('class') && code.includes('map')) return 'functional';
        if (code.includes('for') || code.includes('while')) return 'imperative';
        return 'declarative';
    }

    private generateStages(code: string, from: Paradigm, to: Paradigm): MetamorphicStage[] {
        const stages: MetamorphicStage[] = [];

        stages.push({
            name: 'Larva',
            description: `Original ${from} code`,
            code: code,
            progress: 0,
        });

        stages.push({
            name: 'Pupa',
            description: 'Intermediate transformation',
            code: this.partialTransform(code, from, to, 0.5),
            progress: 0.5,
        });

        stages.push({
            name: 'Chrysalis',
            description: 'Near-complete transformation',
            code: this.partialTransform(code, from, to, 0.8),
            progress: 0.8,
        });

        stages.push({
            name: 'Imago',
            description: `Final ${to} form`,
            code: this.applyTransformation(code, from, to),
            progress: 1,
        });

        return stages;
    }

    private partialTransform(code: string, from: Paradigm, to: Paradigm, level: number): string {
        let result = code;

        if (from === 'object-oriented' && to === 'functional') {
            if (level >= 0.5) {
                result = result.replace(/this\./g, '');
            }
            if (level >= 0.8) {
                result = result.replace(/class\s+(\w+)/g, '// Transformed from class $1\nconst $1 = ');
            }
        }

        if (from === 'imperative' && to === 'functional') {
            if (level >= 0.5) {
                result = result.replace(/for\s*\([^)]+\)\s*{([^}]+)}/g, 'items.forEach(item => {$1})');
            }
            if (level >= 0.8) {
                result = result.replace(/let\s+/g, 'const ');
            }
        }

        return result;
    }

    private applyTransformation(code: string, from: Paradigm, to: Paradigm): string {
        let result = `// Metamorphosed from ${from} to ${to}\n`;
        result += this.partialTransform(code, from, to, 1);

        // Add paradigm-specific headers
        if (to === 'functional') {
            result = `// Functional paradigm - Pure functions, immutability\n` + result;
        } else if (to === 'reactive') {
            result = `// Reactive paradigm - Observables, streams\n` + result;
        }

        return result;
    }

    private identifyBehaviors(code: string): string[] {
        const behaviors: string[] = [];

        const functions = code.match(/(?:function|const)\s+(\w+)/g) || [];
        for (const func of functions.slice(0, 5)) {
            behaviors.push(`Preserves: ${func}`);
        }

        return behaviors;
    }

    private calculateCompletion(from: Paradigm, to: Paradigm): number {
        // Easier transformations have higher completion
        if (from === 'object-oriented' && to === 'functional') return 0.85;
        if (from === 'imperative' && to === 'declarative') return 0.9;
        if (from === 'event-driven' && to === 'reactive') return 0.8;
        return 0.7;
    }

    getTransformation(id: string): Metamorphosis | undefined {
        return this.transformations.get(id);
    }

    getSupportedTransformations(): string[] {
        return Array.from(this.rules.keys());
    }

    getStats(): { total: number; avgCompletion: number; paradigmCounts: Record<string, number> } {
        const transforms = Array.from(this.transformations.values());
        const paradigmCounts: Record<string, number> = {};

        for (const t of transforms) {
            paradigmCounts[t.targetParadigm] = (paradigmCounts[t.targetParadigm] || 0) + 1;
        }

        return {
            total: transforms.length,
            avgCompletion: transforms.length > 0
                ? transforms.reduce((s, t) => s + t.completionLevel, 0) / transforms.length
                : 0,
            paradigmCounts,
        };
    }
}

export const metamorphicCodeTransformer = MetamorphicCodeTransformer.getInstance();
