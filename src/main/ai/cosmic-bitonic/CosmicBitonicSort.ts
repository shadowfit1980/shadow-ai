/**
 * Cosmic Bitonic Sort
 */
import { EventEmitter } from 'events';
export class CosmicBitonicSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const n = arr.length; const nextPow2 = 1 << Math.ceil(Math.log2(n)); const result = [...arr]; while (result.length < nextPow2) result.push(result[result.length - 1]); this.bitonicSort(result, 0, nextPow2, true); return result.slice(0, n); }
    private bitonicSort(arr: T[], low: number, cnt: number, dir: boolean): void { if (cnt > 1) { const k = Math.floor(cnt / 2); this.bitonicSort(arr, low, k, true); this.bitonicSort(arr, low + k, k, false); this.bitonicMerge(arr, low, cnt, dir); } }
    private bitonicMerge(arr: T[], low: number, cnt: number, dir: boolean): void { if (cnt > 1) { const k = Math.floor(cnt / 2); for (let i = low; i < low + k; i++) this.compareAndSwap(arr, i, i + k, dir); this.bitonicMerge(arr, low, k, dir); this.bitonicMerge(arr, low + k, k, dir); } }
    private compareAndSwap(arr: T[], i: number, j: number, dir: boolean): void { const shouldSwap = dir ? this.compare(arr[i], arr[j]) > 0 : this.compare(arr[i], arr[j]) < 0; if (shouldSwap) [arr[i], arr[j]] = [arr[j], arr[i]]; }
}
export const createBitonicSort = <T>(compare?: (a: T, b: T) => number) => new CosmicBitonicSort<T>(compare);
