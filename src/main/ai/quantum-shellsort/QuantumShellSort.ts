/**
 * Quantum Shell Sort
 */
import { EventEmitter } from 'events';
export class QuantumShellSort<T> extends EventEmitter {
    private compare: (a: T, b: T) => number;
    constructor(compare: (a: T, b: T) => number = (a, b) => (a as unknown as number) - (b as unknown as number)) { super(); this.compare = compare; }
    sort(arr: T[]): T[] { const result = [...arr]; const n = result.length; let gap = Math.floor(n / 2); while (gap > 0) { for (let i = gap; i < n; i++) { const temp = result[i]; let j = i; while (j >= gap && this.compare(result[j - gap], temp) > 0) { result[j] = result[j - gap]; j -= gap; } result[j] = temp; } gap = Math.floor(gap / 2); } return result; }
    sortWithGaps(arr: T[], gaps: number[]): T[] { const result = [...arr]; const n = result.length; for (const gap of gaps) { for (let i = gap; i < n; i++) { const temp = result[i]; let j = i; while (j >= gap && this.compare(result[j - gap], temp) > 0) { result[j] = result[j - gap]; j -= gap; } result[j] = temp; } } return result; }
    hibbardGaps(n: number): number[] { const gaps: number[] = []; let k = 1; while ((1 << k) - 1 < n) { gaps.unshift((1 << k) - 1); k++; } return gaps; }
}
export const createShellSort = <T>(compare?: (a: T, b: T) => number) => new QuantumShellSort<T>(compare);
