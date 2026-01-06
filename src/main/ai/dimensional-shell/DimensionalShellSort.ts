/**
 * Dimensional Shell Sort
 */
import { EventEmitter } from 'events';
export class DimensionalShellSort extends EventEmitter {
    private static instance: DimensionalShellSort;
    private constructor() { super(); }
    static getInstance(): DimensionalShellSort { if (!DimensionalShellSort.instance) { DimensionalShellSort.instance = new DimensionalShellSort(); } return DimensionalShellSort.instance; }
    sort(arr: number[]): number[] { const a = [...arr]; for (let gap = Math.floor(a.length / 2); gap > 0; gap = Math.floor(gap / 2)) for (let i = gap; i < a.length; i++) { const temp = a[i]; let j = i; while (j >= gap && a[j - gap] > temp) { a[j] = a[j - gap]; j -= gap; } a[j] = temp; } return a; }
    getStats(): { sorts: number } { return { sorts: 0 }; }
}
export const dimensionalShellSort = DimensionalShellSort.getInstance();
