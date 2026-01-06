/**
 * Dimensional First Last
 */
import { EventEmitter } from 'events';
export class DimensionalFirstLast extends EventEmitter {
    private static instance: DimensionalFirstLast;
    private constructor() { super(); }
    static getInstance(): DimensionalFirstLast { if (!DimensionalFirstLast.instance) { DimensionalFirstLast.instance = new DimensionalFirstLast(); } return DimensionalFirstLast.instance; }
    first<T>(arr: T[], n: number = 1): T | T[] { return n === 1 ? arr[0] : arr.slice(0, n); }
    last<T>(arr: T[], n: number = 1): T | T[] { return n === 1 ? arr[arr.length - 1] : arr.slice(-n); }
    head<T>(arr: T[]): T | undefined { return arr[0]; }
    tail<T>(arr: T[]): T[] { return arr.slice(1); }
    getStats(): { accessed: number } { return { accessed: 0 }; }
}
export const dimensionalFirstLast = DimensionalFirstLast.getInstance();
