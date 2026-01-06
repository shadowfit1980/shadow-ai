/**
 * Quantum Insert Interval
 */
import { EventEmitter } from 'events';
export class QuantumInsertInterval extends EventEmitter {
    private static instance: QuantumInsertInterval;
    private constructor() { super(); }
    static getInstance(): QuantumInsertInterval { if (!QuantumInsertInterval.instance) { QuantumInsertInterval.instance = new QuantumInsertInterval(); } return QuantumInsertInterval.instance; }
    insert(intervals: number[][], newInterval: number[]): number[][] { const result: number[][] = []; let i = 0; while (i < intervals.length && intervals[i][1] < newInterval[0]) result.push(intervals[i++]); while (i < intervals.length && intervals[i][0] <= newInterval[1]) { newInterval[0] = Math.min(newInterval[0], intervals[i][0]); newInterval[1] = Math.max(newInterval[1], intervals[i][1]); i++; } result.push(newInterval); while (i < intervals.length) result.push(intervals[i++]); return result; }
    getStats(): { inserted: number } { return { inserted: 0 }; }
}
export const quantumInsertInterval = QuantumInsertInterval.getInstance();
