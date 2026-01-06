/**
 * Dimensional Zip
 */
import { EventEmitter } from 'events';
export class DimensionalZip extends EventEmitter {
    private static instance: DimensionalZip;
    private constructor() { super(); }
    static getInstance(): DimensionalZip { if (!DimensionalZip.instance) { DimensionalZip.instance = new DimensionalZip(); } return DimensionalZip.instance; }
    zip<T, U>(arr1: T[], arr2: U[]): [T, U][] { const len = Math.min(arr1.length, arr2.length); return Array.from({ length: len }, (_, i) => [arr1[i], arr2[i]]); }
    zipWith<T, U, R>(arr1: T[], arr2: U[], fn: (a: T, b: U) => R): R[] { const len = Math.min(arr1.length, arr2.length); return Array.from({ length: len }, (_, i) => fn(arr1[i], arr2[i])); }
    getStats(): { zipped: number } { return { zipped: 0 }; }
}
export const dimensionalZip = DimensionalZip.getInstance();
