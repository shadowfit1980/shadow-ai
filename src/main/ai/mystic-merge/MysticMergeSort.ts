/**
 * Mystic Merge Sort
 */
import { EventEmitter } from 'events';
export class MysticMergeSort extends EventEmitter {
    private static instance: MysticMergeSort;
    private constructor() { super(); }
    static getInstance(): MysticMergeSort { if (!MysticMergeSort.instance) { MysticMergeSort.instance = new MysticMergeSort(); } return MysticMergeSort.instance; }
    sort(arr: number[]): number[] { if (arr.length <= 1) return arr; const mid = Math.floor(arr.length / 2); const left = this.sort(arr.slice(0, mid)); const right = this.sort(arr.slice(mid)); return this.merge(left, right); }
    private merge(left: number[], right: number[]): number[] { const result: number[] = []; let i = 0, j = 0; while (i < left.length && j < right.length) { if (left[i] < right[j]) result.push(left[i++]); else result.push(right[j++]); } return result.concat(left.slice(i)).concat(right.slice(j)); }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const mysticMergeSort = MysticMergeSort.getInstance();
