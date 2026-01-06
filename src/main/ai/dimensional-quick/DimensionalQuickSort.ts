/**
 * Dimensional Quick Sort
 */
import { EventEmitter } from 'events';
export class DimensionalQuickSort extends EventEmitter {
    private static instance: DimensionalQuickSort;
    private constructor() { super(); }
    static getInstance(): DimensionalQuickSort { if (!DimensionalQuickSort.instance) { DimensionalQuickSort.instance = new DimensionalQuickSort(); } return DimensionalQuickSort.instance; }
    sort(arr: number[]): number[] { if (arr.length <= 1) return arr; const pivot = arr[Math.floor(arr.length / 2)]; const left = arr.filter(x => x < pivot); const middle = arr.filter(x => x === pivot); const right = arr.filter(x => x > pivot); return [...this.sort(left), ...middle, ...this.sort(right)]; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const dimensionalQuickSort = DimensionalQuickSort.getInstance();
