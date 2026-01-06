/**
 * Ethereal Radix Sort
 */
import { EventEmitter } from 'events';
export class EtherealRadixSort extends EventEmitter {
    private static instance: EtherealRadixSort;
    private constructor() { super(); }
    static getInstance(): EtherealRadixSort { if (!EtherealRadixSort.instance) { EtherealRadixSort.instance = new EtherealRadixSort(); } return EtherealRadixSort.instance; }
    sort(arr: number[]): number[] { if (arr.length === 0) return arr; const max = Math.max(...arr); for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) arr = this.countSort(arr, exp); return arr; }
    private countSort(arr: number[], exp: number): number[] { const output = new Array(arr.length); const count = new Array(10).fill(0); for (const n of arr) count[Math.floor(n / exp) % 10]++; for (let i = 1; i < 10; i++) count[i] += count[i - 1]; for (let i = arr.length - 1; i >= 0; i--) { output[count[Math.floor(arr[i] / exp) % 10] - 1] = arr[i]; count[Math.floor(arr[i] / exp) % 10]--; } return output; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const etherealRadixSort = EtherealRadixSort.getInstance();
