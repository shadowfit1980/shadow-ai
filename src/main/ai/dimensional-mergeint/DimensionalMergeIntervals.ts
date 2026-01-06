/**
 * Dimensional Merge Intervals
 */
import { EventEmitter } from 'events';
export class DimensionalMergeIntervals extends EventEmitter {
    private static instance: DimensionalMergeIntervals;
    private constructor() { super(); }
    static getInstance(): DimensionalMergeIntervals { if (!DimensionalMergeIntervals.instance) { DimensionalMergeIntervals.instance = new DimensionalMergeIntervals(); } return DimensionalMergeIntervals.instance; }
    merge(intervals: number[][]): number[][] { if (intervals.length === 0) return []; intervals.sort((a, b) => a[0] - b[0]); const result: number[][] = [intervals[0]]; for (let i = 1; i < intervals.length; i++) { const last = result[result.length - 1]; if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]); else result.push(intervals[i]); } return result; }
    insert(intervals: number[][], newInterval: number[]): number[][] { const result: number[][] = []; let i = 0; while (i < intervals.length && intervals[i][1] < newInterval[0]) result.push(intervals[i++]); while (i < intervals.length && intervals[i][0] <= newInterval[1]) { newInterval[0] = Math.min(newInterval[0], intervals[i][0]); newInterval[1] = Math.max(newInterval[1], intervals[i][1]); i++; } result.push(newInterval); while (i < intervals.length) result.push(intervals[i++]); return result; }
    eraseOverlapIntervals(intervals: number[][]): number { if (intervals.length === 0) return 0; intervals.sort((a, b) => a[1] - b[1]); let end = intervals[0][1], count = 0; for (let i = 1; i < intervals.length; i++) { if (intervals[i][0] < end) count++; else end = intervals[i][1]; } return count; }
}
export const dimensionalMergeIntervals = DimensionalMergeIntervals.getInstance();
