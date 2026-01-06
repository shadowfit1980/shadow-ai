/**
 * Elemental Code Forces
 * 
 * Analyzes code through the lens of elemental forces:
 * Fire (performance), Water (flow), Earth (stability), Air (flexibility),
 * Aether (abstraction).
 */

import { EventEmitter } from 'events';

export interface ElementalAnalysis {
    id: string;
    code: string;
    elements: ElementalForce[];
    dominantElement: string;
    balance: ElementalBalance;
    rituals: ElementalRitual[];
    createdAt: Date;
}

export interface ElementalForce {
    name: 'fire' | 'water' | 'earth' | 'air' | 'aether';
    symbol: string;
    strength: number;
    manifestations: string[];
    recommendations: string[];
}

export interface ElementalBalance {
    overall: number;
    harmony: number;
    dissonance: string[];
}

export interface ElementalRitual {
    element: string;
    name: string;
    description: string;
    effect: string;
    difficulty: 'apprentice' | 'journeyman' | 'master' | 'grandmaster';
}

export class ElementalCodeForces extends EventEmitter {
    private static instance: ElementalCodeForces;
    private analyses: Map<string, ElementalAnalysis> = new Map();

    private elementalSymbols = {
        fire: '🔥',
        water: '💧',
        earth: '🌍',
        air: '💨',
        aether: '✨',
    };

    private constructor() {
        super();
    }

    static getInstance(): ElementalCodeForces {
        if (!ElementalCodeForces.instance) {
            ElementalCodeForces.instance = new ElementalCodeForces();
        }
        return ElementalCodeForces.instance;
    }

    analyze(code: string): ElementalAnalysis {
        const elements = this.measureElements(code);
        const dominantElement = this.findDominantElement(elements);
        const balance = this.assessBalance(elements);
        const rituals = this.suggestRituals(elements, balance);

        const analysis: ElementalAnalysis = {
            id: `elemental_${Date.now()}`,
            code,
            elements,
            dominantElement,
            balance,
            rituals,
            createdAt: new Date(),
        };

        this.analyses.set(analysis.id, analysis);
        this.emit('analysis:complete', analysis);
        return analysis;
    }

    private measureElements(code: string): ElementalForce[] {
        return [
            this.measureFire(code),
            this.measureWater(code),
            this.measureEarth(code),
            this.measureAir(code),
            this.measureAether(code),
        ];
    }

    private measureFire(code: string): ElementalForce {
        let strength = 0;
        const manifestations: string[] = [];
        const recommendations: string[] = [];

        // Fire = Performance
        if (code.includes('cache') || code.includes('memo')) {
            strength += 0.3;
            manifestations.push('Caching/memoization detected');
        }
        if (code.includes('async') && code.includes('Promise.all')) {
            strength += 0.25;
            manifestations.push('Parallel async operations');
        }
        if (!code.includes('for') && !code.includes('while')) {
            strength += 0.2;
            manifestations.push('Avoids explicit loops');
        }

        if (strength < 0.3) {
            recommendations.push('Add caching for repeated operations');
            recommendations.push('Consider parallelizing async operations');
        }

        return {
            name: 'fire',
            symbol: this.elementalSymbols.fire,
            strength: Math.min(1, strength),
            manifestations,
            recommendations,
        };
    }

    private measureWater(code: string): ElementalForce {
        let strength = 0;
        const manifestations: string[] = [];
        const recommendations: string[] = [];

        // Water = Flow
        if (code.includes('pipe') || code.includes('compose')) {
            strength += 0.3;
            manifestations.push('Functional pipelines');
        }
        if (code.includes('.map') || code.includes('.filter') || code.includes('.reduce')) {
            strength += 0.25;
            manifestations.push('Fluent array methods');
        }
        if (code.includes('stream') || code.includes('Observable')) {
            strength += 0.25;
            manifestations.push('Streaming data flow');
        }

        if (strength < 0.3) {
            recommendations.push('Use fluent array methods');
            recommendations.push('Consider reactive streams for data flow');
        }

        return {
            name: 'water',
            symbol: this.elementalSymbols.water,
            strength: Math.min(1, strength),
            manifestations,
            recommendations,
        };
    }

    private measureEarth(code: string): ElementalForce {
        let strength = 0;
        const manifestations: string[] = [];
        const recommendations: string[] = [];

        // Earth = Stability
        if (code.includes('try') && code.includes('catch')) {
            strength += 0.3;
            manifestations.push('Error handling present');
        }
        if (code.includes('interface') || code.includes('type ')) {
            strength += 0.25;
            manifestations.push('Type definitions');
        }
        if (code.includes('test') || code.includes('describe') || code.includes('it(')) {
            strength += 0.25;
            manifestations.push('Tests present');
        }
        if (code.includes('//') || code.includes('/*')) {
            strength += 0.1;
            manifestations.push('Documentation');
        }

        if (strength < 0.4) {
            recommendations.push('Add comprehensive error handling');
            recommendations.push('Define types for all data structures');
        }

        return {
            name: 'earth',
            symbol: this.elementalSymbols.earth,
            strength: Math.min(1, strength),
            manifestations,
            recommendations,
        };
    }

    private measureAir(code: string): ElementalForce {
        let strength = 0;
        const manifestations: string[] = [];
        const recommendations: string[] = [];

        // Air = Flexibility
        if (code.includes('abstract') || code.includes('interface')) {
            strength += 0.25;
            manifestations.push('Abstractions defined');
        }
        if (code.includes('extends') || code.includes('implements')) {
            strength += 0.2;
            manifestations.push('Inheritance/implementation');
        }
        if (code.includes('=>') || code.includes('callback')) {
            strength += 0.2;
            manifestations.push('Higher-order functions');
        }
        if (code.includes('generic') || code.includes('<T>') || code.includes('<T,')) {
            strength += 0.25;
            manifestations.push('Generic types');
        }

        if (strength < 0.3) {
            recommendations.push('Use generics for reusability');
            recommendations.push('Consider dependency injection');
        }

        return {
            name: 'air',
            symbol: this.elementalSymbols.air,
            strength: Math.min(1, strength),
            manifestations,
            recommendations,
        };
    }

    private measureAether(code: string): ElementalForce {
        let strength = 0;
        const manifestations: string[] = [];
        const recommendations: string[] = [];

        // Aether = Abstraction/Purity
        if (!code.includes('any')) {
            strength += 0.2;
            manifestations.push('No any type');
        }
        if (code.includes('readonly') || code.includes('const ')) {
            strength += 0.2;
            manifestations.push('Immutability patterns');
        }
        if (!code.includes('console.')) {
            strength += 0.15;
            manifestations.push('No console statements');
        }
        if (code.includes('pure') || (!code.includes('this.') && code.includes('=>'))) {
            strength += 0.25;
            manifestations.push('Pure function patterns');
        }

        if (strength < 0.3) {
            recommendations.push('Remove any types');
            recommendations.push('Use pure functions where possible');
        }

        return {
            name: 'aether',
            symbol: this.elementalSymbols.aether,
            strength: Math.min(1, strength),
            manifestations,
            recommendations,
        };
    }

    private findDominantElement(elements: ElementalForce[]): string {
        return elements.reduce((max, el) => el.strength > max.strength ? el : max).name;
    }

    private assessBalance(elements: ElementalForce[]): ElementalBalance {
        const strengths = elements.map(e => e.strength);
        const avg = strengths.reduce((s, v) => s + v, 0) / strengths.length;
        const variance = strengths.reduce((s, v) => s + (v - avg) ** 2, 0) / strengths.length;

        const dissonance: string[] = [];
        for (const el of elements) {
            if (el.strength < 0.3) {
                dissonance.push(`${el.name} is weak`);
            }
        }

        return {
            overall: avg,
            harmony: 1 - Math.sqrt(variance),
            dissonance,
        };
    }

    private suggestRituals(elements: ElementalForce[], balance: ElementalBalance): ElementalRitual[] {
        const rituals: ElementalRitual[] = [];

        for (const el of elements) {
            if (el.strength < 0.4) {
                rituals.push({
                    element: el.name,
                    name: `Invoke ${el.name}`,
                    description: `Strengthen the ${el.name} element in your code`,
                    effect: el.recommendations[0] || `Improve ${el.name} qualities`,
                    difficulty: el.strength < 0.2 ? 'master' : 'journeyman',
                });
            }
        }

        return rituals;
    }

    getAnalysis(id: string): ElementalAnalysis | undefined {
        return this.analyses.get(id);
    }

    getStats(): { total: number; avgBalance: number; dominantElements: Record<string, number> } {
        const analyses = Array.from(this.analyses.values());
        const dominantElements: Record<string, number> = {};

        for (const a of analyses) {
            dominantElements[a.dominantElement] = (dominantElements[a.dominantElement] || 0) + 1;
        }

        return {
            total: analyses.length,
            avgBalance: analyses.length > 0
                ? analyses.reduce((s, a) => s + a.balance.overall, 0) / analyses.length
                : 0,
            dominantElements,
        };
    }
}

export const elementalCodeForces = ElementalCodeForces.getInstance();
