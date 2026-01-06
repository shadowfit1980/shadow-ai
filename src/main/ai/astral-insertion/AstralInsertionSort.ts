/**
 * Astral Insertion Sort
 */
import { EventEmitter } from 'events';
export class AstralInsertionSort extends EventEmitter {
    private static instance: AstralInsertionSort;
    private constructor() { super(); }
    static getInstance(): AstralInsertionSort { if (!AstralInsertionSort.instance) { AstralInsertionSort.instance = new AstralInsertionSort(); } return AstralInsertionSort.instance; }
    sort(arr: number[]): number[] { const a = [...arr]; for (let i = 1; i < a.length; i++) { const key = a[i]; let j = i - 1; while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; } a[j + 1] = key; } return a; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const astralInsertionSort = AstralInsertionSort.getInstance();
