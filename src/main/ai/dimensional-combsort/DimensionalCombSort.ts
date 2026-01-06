/**
 * Dimensional Comb Sort
 */
import { EventEmitter } from 'events';
export class DimensionalCombSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    private shrinkFactor: number = 1.3;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; const n = result.length; let gap = n; let swapped = true; while (gap > 1 || swapped) { gap = Math.max(1, Math.floor(gap / this.shrinkFactor)); swapped = false; for (let i = 0; i + gap < n; i++) { if (this.compare(result[i], result[i + gap]) > 0) { [result[i], result[i + gap]] = [result[i + gap], result[i]]; swapped = true; } } } return result; }
    setShrinkFactor(factor: number): void { this.shrinkFactor = factor; }
}
export const createCombSort = <T>(compare?: (a: T, b: T) => number) => new DimensionalCombSort<T>(compare);
