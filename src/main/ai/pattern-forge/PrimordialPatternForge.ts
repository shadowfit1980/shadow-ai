/**
 * Primordial Pattern Forge
 * 
 * Forges fundamental design patterns from primordial essence,
 * creating the building blocks of solid architecture.
 */

import { EventEmitter } from 'events';

export interface ForgedPattern {
    id: string;
    name: string;
    essence: PatternEssence;
    components: PatternComponent[];
    strength: number;
    template: string;
    createdAt: Date;
}

export type PatternEssence =
    | 'creation'
    | 'structure'
    | 'behavior'
    | 'concurrency'
    | 'resilience';

export interface PatternComponent {
    name: string;
    role: string;
    code: string;
}

export class PrimordialPatternForge extends EventEmitter {
    private static instance: PrimordialPatternForge;
    private forgedPatterns: Map<string, ForgedPattern> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PrimordialPatternForge {
        if (!PrimordialPatternForge.instance) {
            PrimordialPatternForge.instance = new PrimordialPatternForge();
        }
        return PrimordialPatternForge.instance;
    }

    forge(name: string, essence: PatternEssence): ForgedPattern {
        const components = this.createComponents(essence);
        const template = this.generateTemplate(name, components);

        const pattern: ForgedPattern = {
            id: `forge_${Date.now()}`,
            name,
            essence,
            components,
            strength: 0.7 + Math.random() * 0.3,
            template,
            createdAt: new Date(),
        };

        this.forgedPatterns.set(pattern.id, pattern);
        this.emit('pattern:forged', pattern);
        return pattern;
    }

    private createComponents(essence: PatternEssence): PatternComponent[] {
        const components: PatternComponent[] = [];

        switch (essence) {
            case 'creation':
                components.push({ name: 'Creator', role: 'Creates instances', code: 'create(): T' });
                components.push({ name: 'Product', role: 'The created instance', code: 'interface Product {}' });
                break;
            case 'structure':
                components.push({ name: 'Adapter', role: 'Adapts interfaces', code: 'adapt(source): Target' });
                components.push({ name: 'Facade', role: 'Simplifies access', code: 'simplify(): Result' });
                break;
            case 'behavior':
                components.push({ name: 'Strategy', role: 'Encapsulates algorithm', code: 'execute(data): Result' });
                components.push({ name: 'Observer', role: 'Watches for changes', code: 'notify(event): void' });
                break;
            case 'concurrency':
                components.push({ name: 'Mutex', role: 'Ensures exclusive access', code: 'lock(): Promise<void>' });
                components.push({ name: 'Pool', role: 'Manages resources', code: 'acquire(): Resource' });
                break;
            case 'resilience':
                components.push({ name: 'Retry', role: 'Retries on failure', code: 'retry(fn, attempts): Result' });
                components.push({ name: 'Circuit', role: 'Prevents cascading failures', code: 'call(fn): Result' });
                break;
        }

        return components;
    }

    private generateTemplate(name: string, components: PatternComponent[]): string {
        let template = `// ${name} Pattern\n\n`;
        for (const comp of components) {
            template += `// ${comp.name}: ${comp.role}\n`;
            template += `${comp.code}\n\n`;
        }
        return template;
    }

    getAllPatterns(): ForgedPattern[] {
        return Array.from(this.forgedPatterns.values());
    }

    getStats(): { total: number; avgStrength: number; essences: Record<string, number> } {
        const patterns = Array.from(this.forgedPatterns.values());
        const essences: Record<string, number> = {};

        for (const p of patterns) {
            essences[p.essence] = (essences[p.essence] || 0) + 1;
        }

        return {
            total: patterns.length,
            avgStrength: patterns.length > 0
                ? patterns.reduce((s, p) => s + p.strength, 0) / patterns.length
                : 0,
            essences,
        };
    }
}

export const primordialPatternForge = PrimordialPatternForge.getInstance();
