/**
 * Quantum Stooge Sort
 */
import { EventEmitter } from 'events';
export class QuantumStoogeSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; this.stoogeSort(result, 0, result.length - 1); return result; }
    private stoogeSort(arr: T[], l: number, h: number): void { if (l >= h) return; if (this.compare(arr[l], arr[h]) > 0) [arr[l], arr[h]] = [arr[h], arr[l]]; if (h - l + 1 > 2) { const t = Math.floor((h - l + 1) / 3); this.stoogeSort(arr, l, h - t); this.stoogeSort(arr, l + t, h); this.stoogeSort(arr, l, h - t); } }
}
export const createStoogeSort = <T>(compare?: (a: T, b: T) => number) => new QuantumStoogeSort<T>(compare);
