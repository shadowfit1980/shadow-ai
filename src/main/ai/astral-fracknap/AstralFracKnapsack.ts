/**
 * Astral Fractional Knapsack
 */
import { EventEmitter } from 'events';
export interface FracItem { id: number; weight: number; value: number; }
export class AstralFracKnapsack extends EventEmitter {
    private static instance: AstralFracKnapsack;
    private constructor() { super(); }
    static getInstance(): AstralFracKnapsack { if (!AstralFracKnapsack.instance) { AstralFracKnapsack.instance = new AstralFracKnapsack(); } return AstralFracKnapsack.instance; }
    solve(items: FracItem[], capacity: number): { items: { id: number; fraction: number }[]; totalValue: number } { const sorted = [...items].sort((a, b) => (b.value / b.weight) - (a.value / a.weight)); const result: { id: number; fraction: number }[] = []; let totalValue = 0; let remaining = capacity; for (const item of sorted) { if (remaining === 0) break; if (item.weight <= remaining) { result.push({ id: item.id, fraction: 1 }); totalValue += item.value; remaining -= item.weight; } else { const fraction = remaining / item.weight; result.push({ id: item.id, fraction }); totalValue += item.value * fraction; remaining = 0; } } return { items: result, totalValue }; }
    minimizeWeight(items: FracItem[], minValue: number): { items: { id: number; fraction: number }[]; totalWeight: number } { const sorted = [...items].sort((a, b) => (b.value / b.weight) - (a.value / a.weight)); const result: { id: number; fraction: number }[] = []; let totalWeight = 0; let valueNeeded = minValue; for (const item of sorted) { if (valueNeeded <= 0) break; if (item.value <= valueNeeded) { result.push({ id: item.id, fraction: 1 }); totalWeight += item.weight; valueNeeded -= item.value; } else { const fraction = valueNeeded / item.value; result.push({ id: item.id, fraction }); totalWeight += item.weight * fraction; valueNeeded = 0; } } return { items: result, totalWeight }; }
}
export const astralFracKnapsack = AstralFracKnapsack.getInstance();
