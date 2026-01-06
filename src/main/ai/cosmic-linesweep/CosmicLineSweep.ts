/**
 * Cosmic Line Sweep
 */
import { EventEmitter } from 'events';
export interface Event { x: number; type: 'start' | 'end'; data: unknown; }
export class CosmicLineSweep extends EventEmitter {
    private static instance: CosmicLineSweep;
    private constructor() { super(); }
    static getInstance(): CosmicLineSweep { if (!CosmicLineSweep.instance) { CosmicLineSweep.instance = new CosmicLineSweep(); } return CosmicLineSweep.instance; }
    maxOverlappingIntervals(intervals: [number, number][]): number { const events: { x: number; delta: number }[] = []; for (const [start, end] of intervals) { events.push({ x: start, delta: 1 }); events.push({ x: end, delta: -1 }); } events.sort((a, b) => a.x === b.x ? b.delta - a.delta : a.x - b.x); let count = 0, maxCount = 0; for (const e of events) { count += e.delta; maxCount = Math.max(maxCount, count); } return maxCount; }
    mergeIntervals(intervals: [number, number][]): [number, number][] { if (intervals.length === 0) return []; const sorted = [...intervals].sort((a, b) => a[0] - b[0]); const result: [number, number][] = [sorted[0]]; for (let i = 1; i < sorted.length; i++) { const last = result[result.length - 1]; if (sorted[i][0] <= last[1]) last[1] = Math.max(last[1], sorted[i][1]); else result.push(sorted[i]); } return result; }
    intersectionLength(intervals1: [number, number][], intervals2: [number, number][]): number { let i = 0, j = 0, total = 0; const a = [...intervals1].sort((x, y) => x[0] - y[0]); const b = [...intervals2].sort((x, y) => x[0] - y[0]); while (i < a.length && j < b.length) { const start = Math.max(a[i][0], b[j][0]); const end = Math.min(a[i][1], b[j][1]); if (start < end) total += end - start; if (a[i][1] < b[j][1]) i++; else j++; } return total; }
    removeInterval(intervals: [number, number][], toRemove: [number, number]): [number, number][] { const result: [number, number][] = []; for (const [start, end] of intervals) { if (end <= toRemove[0] || start >= toRemove[1]) result.push([start, end]); else { if (start < toRemove[0]) result.push([start, toRemove[0]]); if (end > toRemove[1]) result.push([toRemove[1], end]); } } return result; }
}
export const cosmicLineSweep = CosmicLineSweep.getInstance();
