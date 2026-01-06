/**
 * Elemental Code Balancer
 * 
 * Balances the elemental forces within code to achieve
 * perfect harmony between all components.
 */

import { EventEmitter } from 'events';

export interface ElementalBalance {
    id: string;
    code: string;
    elements: { fire: number; water: number; earth: number; air: number };
    harmony: number;
    adjustments: string[];
}

export class ElementalCodeBalancer extends EventEmitter {
    private static instance: ElementalCodeBalancer;
    private balances: Map<string, ElementalBalance> = new Map();

    private constructor() { super(); }

    static getInstance(): ElementalCodeBalancer {
        if (!ElementalCodeBalancer.instance) {
            ElementalCodeBalancer.instance = new ElementalCodeBalancer();
        }
        return ElementalCodeBalancer.instance;
    }

    balance(code: string): ElementalBalance {
        const elements = this.measureElements(code);
        const harmony = this.calculateHarmony(elements);
        const adjustments = this.suggestAdjustments(elements);

        const balance: ElementalBalance = {
            id: `balance_${Date.now()}`,
            code,
            elements,
            harmony,
            adjustments,
        };

        this.balances.set(balance.id, balance);
        this.emit('balance:achieved', balance);
        return balance;
    }

    private measureElements(code: string): { fire: number; water: number; earth: number; air: number } {
        return {
            fire: (code.match(/async|await|Promise/g) || []).length * 0.1,
            water: (code.match(/map|filter|reduce/g) || []).length * 0.15,
            earth: (code.match(/interface|type|class/g) || []).length * 0.12,
            air: (code.match(/export|import/g) || []).length * 0.1,
        };
    }

    private calculateHarmony(elements: { fire: number; water: number; earth: number; air: number }): number {
        const values = Object.values(elements);
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
        return Math.max(0, 1 - variance);
    }

    private suggestAdjustments(elements: { fire: number; water: number; earth: number; air: number }): string[] {
        const adjustments: string[] = [];
        if (elements.fire < 0.2) adjustments.push('Add more async operations');
        if (elements.earth < 0.2) adjustments.push('Define more types');
        return adjustments;
    }

    getStats(): { total: number; avgHarmony: number } {
        const bals = Array.from(this.balances.values());
        return {
            total: bals.length,
            avgHarmony: bals.length > 0 ? bals.reduce((s, b) => s + b.harmony, 0) / bals.length : 0,
        };
    }
}

export const elementalCodeBalancer = ElementalCodeBalancer.getInstance();
