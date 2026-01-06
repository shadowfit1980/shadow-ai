/**
 * Dimensional Stable Sort
 */
import { EventEmitter } from 'events';
export class DimensionalStableSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    mergeSort(arr: T[]): T[] { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = this.mergeSort(arr.slice(0, mid)); const right = this.mergeSort(arr.slice(mid)); return this.merge(left, right); }
    private merge(left: T[], right: T[]): T[] { const result: T[] = []; let i = 0, j = 0; while (i < left.length && j < right.length) { if (this.compare(left[i], right[j]) <= 0) result.push(left[i++]); else result.push(right[j++]); } return result.concat(left.slice(i)).concat(right.slice(j)); }
    insertionSort(arr: T[]): T[] { const result = [...arr]; for (let i = 1; i < result.length; i++) { const key = result[i]; let j = i - 1; while (j >= 0 && this.compare(result[j], key) > 0) { result[j + 1] = result[j]; j--; } result[j + 1] = key; } return result; }
    bubbleSort(arr: T[]): T[] { const result = [...arr]; for (let i = 0; i < result.length; i++) { for (let j = 0; j < result.length - i - 1; j++) { if (this.compare(result[j], result[j + 1]) > 0) { [result[j], result[j + 1]] = [result[j + 1], result[j]]; } } } return result; }
}
export const createStableSort = <T>(compare?: (a: T, b: T) => number) => new DimensionalStableSort<T>(compare);
