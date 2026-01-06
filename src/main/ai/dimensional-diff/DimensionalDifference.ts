/**
 * Dimensional Difference
 */
import { EventEmitter } from 'events';
export class DimensionalDifference extends EventEmitter {
    private static instance: DimensionalDifference;
    private constructor() { super(); }
    static getInstance(): DimensionalDifference { if (!DimensionalDifference.instance) { DimensionalDifference.instance = new DimensionalDifference(); } return DimensionalDifference.instance; }
    difference<T>(arr: T[], ...others: T[][]): T[] { const excluded = new Set(others.flat()); return arr.filter(x => !excluded.has(x)); }
    symmetricDifference<T>(arr1: T[], arr2: T[]): T[] { const s1 = new Set(arr1), s2 = new Set(arr2); return [...arr1.filter(x => !s2.has(x)), ...arr2.filter(x => !s1.has(x))]; }
    getStats(): { diffed: number } { return { diffed: 0 }; }
}
export const dimensionalDifference = DimensionalDifference.getInstance();
