/**
 * Dimensional Odd Even Sort
 */
import { EventEmitter } from 'events';
export class DimensionalOddEvenSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; const n = result.length; let sorted = false; while (!sorted) { sorted = true; for (let i = 1; i < n - 1; i += 2) { if (this.compare(result[i], result[i + 1]) > 0) { [result[i], result[i + 1]] = [result[i + 1], result[i]]; sorted = false; } } for (let i = 0; i < n - 1; i += 2) { if (this.compare(result[i], result[i + 1]) > 0) { [result[i], result[i + 1]] = [result[i + 1], result[i]]; sorted = false; } } } return result; }
}
export const createOddEvenSort = <T>(compare?: (a: T, b: T) => number) => new DimensionalOddEvenSort<T>(compare);
