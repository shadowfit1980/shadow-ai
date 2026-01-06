/**
 * Phoenix Code Resurrection
 * 
 * Resurrects dead or deprecated code, giving it new life through
 * modernization and transformation.
 */

import { EventEmitter } from 'events';

export interface ResurrectionResult {
    id: string;
    originalCode: string;
    resurrectedCode: string;
    transformations: Transformation[];
    lifeCycle: LifeCycleStage[];
    vitalSigns: VitalSigns;
    createdAt: Date;
}

export interface Transformation {
    type: 'modernize' | 'fix' | 'upgrade' | 'rewrite';
    description: string;
    before: string;
    after: string;
}

export interface LifeCycleStage {
    name: 'death' | 'ashes' | 'spark' | 'rebirth' | 'flight';
    status: 'complete' | 'in-progress' | 'pending';
    description: string;
}

export interface VitalSigns {
    health: number;
    modernness: number;
    compatibility: number;
    readability: number;
}

export class PhoenixCodeResurrection extends EventEmitter {
    private static instance: PhoenixCodeResurrection;
    private resurrections: Map<string, ResurrectionResult> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PhoenixCodeResurrection {
        if (!PhoenixCodeResurrection.instance) {
            PhoenixCodeResurrection.instance = new PhoenixCodeResurrection();
        }
        return PhoenixCodeResurrection.instance;
    }

    resurrect(code: string): ResurrectionResult {
        const lifeCycle = this.initializeLifeCycle();

        // Stage 1: Death - acknowledge the old code
        lifeCycle[0].status = 'complete';

        // Stage 2: Ashes - break down the old patterns
        const transformations = this.identifyTransformations(code);
        lifeCycle[1].status = 'complete';

        // Stage 3: Spark - begin modernization
        let resurrectedCode = this.applyTransformations(code, transformations);
        lifeCycle[2].status = 'complete';

        // Stage 4: Rebirth - assemble new code
        resurrectedCode = this.polish(resurrectedCode);
        lifeCycle[3].status = 'complete';

        // Stage 5: Flight - ready for production
        const vitalSigns = this.checkVitalSigns(resurrectedCode);
        lifeCycle[4].status = vitalSigns.health > 0.7 ? 'complete' : 'pending';

        const result: ResurrectionResult = {
            id: `phoenix_${Date.now()}`,
            originalCode: code,
            resurrectedCode,
            transformations,
            lifeCycle,
            vitalSigns,
            createdAt: new Date(),
        };

        this.resurrections.set(result.id, result);
        this.emit('resurrection:complete', result);
        return result;
    }

    private initializeLifeCycle(): LifeCycleStage[] {
        return [
            { name: 'death', status: 'pending', description: 'Acknowledging legacy code' },
            { name: 'ashes', status: 'pending', description: 'Breaking down old patterns' },
            { name: 'spark', status: 'pending', description: 'Initiating modernization' },
            { name: 'rebirth', status: 'pending', description: 'Assembling new code' },
            { name: 'flight', status: 'pending', description: 'Ready for production' },
        ];
    }

    private identifyTransformations(code: string): Transformation[] {
        const transformations: Transformation[] = [];

        // var to const/let
        if (code.includes('var ')) {
            transformations.push({
                type: 'modernize',
                description: 'Replace var with const/let',
                before: 'var x = value;',
                after: 'const x = value;',
            });
        }

        // function to arrow
        if (code.match(/function\s*\(/)) {
            transformations.push({
                type: 'modernize',
                description: 'Convert anonymous functions to arrow functions',
                before: 'function(x) { return x; }',
                after: '(x) => x',
            });
        }

        // require to import
        if (code.includes('require(')) {
            transformations.push({
                type: 'upgrade',
                description: 'Convert CommonJS to ES modules',
                before: "const x = require('module');",
                after: "import x from 'module';",
            });
        }

        // Promise callbacks to async/await
        if (code.includes('.then(') && !code.includes('async')) {
            transformations.push({
                type: 'modernize',
                description: 'Convert Promise chains to async/await',
                before: 'promise.then(x => ...).catch(e => ...)',
                after: 'try { const x = await promise; } catch(e) { ... }',
            });
        }

        // String concatenation to template literals
        if (code.match(/['"][^'"]*['"]\s*\+/)) {
            transformations.push({
                type: 'modernize',
                description: 'Use template literals',
                before: '"Hello " + name',
                after: '`Hello ${name}`',
            });
        }

        // Object.assign to spread
        if (code.includes('Object.assign')) {
            transformations.push({
                type: 'modernize',
                description: 'Use spread operator',
                before: 'Object.assign({}, a, b)',
                after: '{ ...a, ...b }',
            });
        }

        return transformations;
    }

    private applyTransformations(code: string, transformations: Transformation[]): string {
        let result = code;

        // Apply var -> const
        result = result.replace(/var\s+(\w+)\s*=/g, 'const $1 =');

        // Apply require -> import (basic)
        result = result.replace(
            /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g,
            "import $1 from '$2'"
        );

        // Apply function -> arrow (anonymous)
        result = result.replace(
            /function\s*\(([^)]*)\)\s*{/g,
            '($1) => {'
        );

        // Add modern header
        result = `// Resurrected by Phoenix\n// Modernized for ${new Date().getFullYear()}\n\n${result}`;

        return result;
    }

    private polish(code: string): string {
        // Clean up extra whitespace
        let result = code.replace(/\n{3,}/g, '\n\n');

        // Ensure consistent indentation (simplified)
        result = result.replace(/\t/g, '  ');

        return result;
    }

    private checkVitalSigns(code: string): VitalSigns {
        const hasModernSyntax = code.includes('=>') || code.includes('async');
        const hasTypes = code.includes(':') && (code.includes('string') || code.includes('number'));
        const hasImports = code.includes('import');
        const lineLength = code.length / code.split('\n').length;

        return {
            health: (hasModernSyntax ? 0.3 : 0) + (hasTypes ? 0.3 : 0) + (hasImports ? 0.2 : 0) + 0.2,
            modernness: hasModernSyntax && hasImports ? 0.9 : hasModernSyntax ? 0.6 : 0.3,
            compatibility: hasTypes ? 0.8 : 0.5,
            readability: Math.max(0, 1 - lineLength / 100),
        };
    }

    getResurrection(id: string): ResurrectionResult | undefined {
        return this.resurrections.get(id);
    }

    getStats(): { total: number; avgHealth: number; transformationCounts: Record<string, number> } {
        const results = Array.from(this.resurrections.values());
        const transformationCounts: Record<string, number> = {};

        for (const r of results) {
            for (const t of r.transformations) {
                transformationCounts[t.type] = (transformationCounts[t.type] || 0) + 1;
            }
        }

        return {
            total: results.length,
            avgHealth: results.length > 0
                ? results.reduce((s, r) => s + r.vitalSigns.health, 0) / results.length
                : 0,
            transformationCounts,
        };
    }
}

export const phoenixCodeResurrection = PhoenixCodeResurrection.getInstance();
