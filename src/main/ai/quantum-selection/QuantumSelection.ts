/**
 * Quantum Selection Algorithms
 */
import { EventEmitter } from 'events';
export class QuantumSelection<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    quickSelect(arr: T[], k: number): T { const result = [...arr]; return this.quickSelectHelper(result, 0, result.length - 1, k - 1); }
    private quickSelectHelper(arr: T[], left: number, right: number, k: number): T { if (left === right) return arr[left]; const pivotIdx = this.partition(arr, left, right); if (k === pivotIdx) return arr[k]; if (k < pivotIdx) return this.quickSelectHelper(arr, left, pivotIdx - 1, k); return this.quickSelectHelper(arr, pivotIdx + 1, right, k); }
    private partition(arr: T[], left: number, right: number): number { const pivot = arr[right]; let i = left; for (let j = left; j < right; j++) { if (this.compare(arr[j], pivot) <= 0) { [arr[i], arr[j]] = [arr[j], arr[i]]; i++; } } [arr[i], arr[right]] = [arr[right], arr[i]]; return i; }
    medianOfMedians(arr: T[]): T { if (arr.length <= 5) return this.sortAndGetMedian(arr); const medians: T[] = []; for (let i = 0; i < arr.length; i += 5) { const group = arr.slice(i, Math.min(i + 5, arr.length)); medians.push(this.sortAndGetMedian(group)); } return this.medianOfMedians(medians); }
    private sortAndGetMedian(arr: T[]): T { const sorted = [...arr].sort(this.compare); return sorted[Math.floor(sorted.length / 2)]; }
}
export const createSelection = <T>(compare?: (a: T, b: T) => number) => new QuantumSelection<T>(compare);
