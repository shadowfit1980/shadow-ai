/**
 * Dimensional Statistics
 */
import { EventEmitter } from 'events';
export class DimensionalStatistics extends EventEmitter {
    private static instance: DimensionalStatistics;
    private constructor() { super(); }
    static getInstance(): DimensionalStatistics { if (!DimensionalStatistics.instance) { DimensionalStatistics.instance = new DimensionalStatistics(); } return DimensionalStatistics.instance; }
    mean(arr: number[]): number { return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length; }
    median(arr: number[]): number { if (arr.length === 0) return 0; const sorted = [...arr].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; }
    mode(arr: number[]): number[] { const freq = new Map<number, number>(); let maxFreq = 0; for (const n of arr) { const f = (freq.get(n) || 0) + 1; freq.set(n, f); maxFreq = Math.max(maxFreq, f); } return [...freq.entries()].filter(([, f]) => f === maxFreq).map(([n]) => n); }
    variance(arr: number[]): number { const m = this.mean(arr); return arr.reduce((sum, n) => sum + (n - m) ** 2, 0) / arr.length; }
    stdDev(arr: number[]): number { return Math.sqrt(this.variance(arr)); }
    getStats(): { calculated: number } { return { calculated: 0 }; }
}
export const dimensionalStatistics = DimensionalStatistics.getInstance();
