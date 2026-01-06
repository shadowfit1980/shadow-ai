/**
 * Quantum Sum By
 */
import { EventEmitter } from 'events';
export class QuantumSumBy extends EventEmitter {
    private static instance: QuantumSumBy;
    private constructor() { super(); }
    static getInstance(): QuantumSumBy { if (!QuantumSumBy.instance) { QuantumSumBy.instance = new QuantumSumBy(); } return QuantumSumBy.instance; }
    sumBy<T>(arr: T[], fn: (item: T) => number): number { return arr.reduce((sum, item) => sum + fn(item), 0); }
    meanBy<T>(arr: T[], fn: (item: T) => number): number { return arr.length === 0 ? 0 : this.sumBy(arr, fn) / arr.length; }
    getStats(): { summed: number } { return { summed: 0 }; }
}
export const quantumSumBy = QuantumSumBy.getInstance();
