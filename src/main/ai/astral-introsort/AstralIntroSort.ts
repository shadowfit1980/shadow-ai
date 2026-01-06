/**
 * Astral Intro Sort
 */
import { EventEmitter } from 'events';
export class AstralIntroSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; const maxDepth = 2 * Math.floor(Math.log2(result.length)); this.introSort(result, 0, result.length - 1, maxDepth); return result; }
    private introSort(arr: T[], low: number, high: number, depthLimit: number): void { const size = high - low + 1; if (size < 16) { this.insertionSort(arr, low, high); return; } if (depthLimit === 0) { this.heapSort(arr, low, high); return; } const pivot = this.partition(arr, low, high); this.introSort(arr, low, pivot - 1, depthLimit - 1); this.introSort(arr, pivot + 1, high, depthLimit - 1); }
    private partition(arr: T[], low: number, high: number): number { const mid = Math.floor((low + high) / 2); if (this.compare(arr[mid], arr[low]) < 0) [arr[low], arr[mid]] = [arr[mid], arr[low]]; if (this.compare(arr[high], arr[low]) < 0) [arr[low], arr[high]] = [arr[high], arr[low]]; if (this.compare(arr[mid], arr[high]) < 0) [arr[mid], arr[high]] = [arr[high], arr[mid]]; const pivot = arr[high]; let i = low - 1; for (let j = low; j < high; j++) { if (this.compare(arr[j], pivot) <= 0) { i++;[arr[i], arr[j]] = [arr[j], arr[i]]; } } [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]; return i + 1; }
    private insertionSort(arr: T[], low: number, high: number): void { for (let i = low + 1; i <= high; i++) { const key = arr[i]; let j = i - 1; while (j >= low && this.compare(arr[j], key) > 0) { arr[j + 1] = arr[j]; j--; } arr[j + 1] = key; } }
    private heapSort(arr: T[], low: number, high: number): void { const n = high - low + 1; const heapify = (size: number, i: number): void => { let largest = i; const left = 2 * i + 1; const right = 2 * i + 2; if (left < size && this.compare(arr[low + left], arr[low + largest]) > 0) largest = left; if (right < size && this.compare(arr[low + right], arr[low + largest]) > 0) largest = right; if (largest !== i) { [arr[low + i], arr[low + largest]] = [arr[low + largest], arr[low + i]]; heapify(size, largest); } }; for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i); for (let i = n - 1; i > 0; i--) { [arr[low], arr[low + i]] = [arr[low + i], arr[low]]; heapify(i, 0); } }
}
export const createIntroSort = <T>(compare?: (a: T, b: T) => number) => new AstralIntroSort<T>(compare);
