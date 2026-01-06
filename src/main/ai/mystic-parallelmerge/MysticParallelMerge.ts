/**
 * Mystic Parallel Merge Sort
 */
import { EventEmitter } from 'events';
export class MysticParallelMerge<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    private threshold: number = 1000;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    setThreshold(t: number): void { this.threshold = t; }
    sort(arr: T[]): T[] { return this.mergeSort(arr); }
    private mergeSort(arr: T[]): T[] { if (arr.length <= 1) return arr; if (arr.length < this.threshold) return this.sequentialMergeSort(arr); const mid = Math.floor(arr.length / 2); const left = this.mergeSort(arr.slice(0, mid)); const right = this.mergeSort(arr.slice(mid)); return this.merge(left, right); }
    private sequentialMergeSort(arr: T[]): T[] { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = this.sequentialMergeSort(arr.slice(0, mid)); const right = this.sequentialMergeSort(arr.slice(mid)); return this.merge(left, right); }
    private merge(left: T[], right: T[]): T[] { const result: T[] = []; let i = 0, j = 0; while (i < left.length && j < right.length) { if (this.compare(left[i], right[j]) <= 0) result.push(left[i++]); else result.push(right[j++]); } return result.concat(left.slice(i)).concat(right.slice(j)); }
    parallelMerge(sorted1: T[], sorted2: T[]): T[] { return this.merge(sorted1, sorted2); }
}
export const createParallelMerge = <T>(compare?: (a: T, b: T) => number) => new MysticParallelMerge<T>(compare);
