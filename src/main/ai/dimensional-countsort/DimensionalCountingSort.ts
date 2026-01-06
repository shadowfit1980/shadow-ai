/**
 * Dimensional Counting Sort
 */
import { EventEmitter } from 'events';
export class DimensionalCountingSort extends EventEmitter {
    private static instance: DimensionalCountingSort;
    private constructor() { super(); }
    static getInstance(): DimensionalCountingSort { if (!DimensionalCountingSort.instance) { DimensionalCountingSort.instance = new DimensionalCountingSort(); } return DimensionalCountingSort.instance; }
    sort(arr: number[]): number[] { if (arr.length <= 1) return arr; const max = Math.max(...arr); const min = Math.min(...arr); const range = max - min + 1; const count = new Array(range).fill(0); const output = new Array(arr.length); for (const num of arr) count[num - min]++; for (let i = 1; i < range; i++) count[i] += count[i - 1]; for (let i = arr.length - 1; i >= 0; i--) { output[count[arr[i] - min] - 1] = arr[i]; count[arr[i] - min]--; } return output; }
    sortWithKey<T>(arr: T[], keyFn: (item: T) => number): T[] { if (arr.length <= 1) return arr; const keys = arr.map(keyFn); const max = Math.max(...keys); const min = Math.min(...keys); const range = max - min + 1; const count = new Array(range).fill(0); const output = new Array(arr.length); for (const key of keys) count[key - min]++; for (let i = 1; i < range; i++) count[i] += count[i - 1]; for (let i = arr.length - 1; i >= 0; i--) { output[count[keys[i] - min] - 1] = arr[i]; count[keys[i] - min]--; } return output; }
}
export const dimensionalCountingSort = DimensionalCountingSort.getInstance();
