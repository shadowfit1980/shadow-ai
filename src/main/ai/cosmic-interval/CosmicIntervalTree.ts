/**
 * Cosmic Interval Tree
 */
import { EventEmitter } from 'events';
export interface Interval { start: number; end: number; data: unknown; }
export class CosmicIntervalTree extends EventEmitter {
    private static instance: CosmicIntervalTree;
    private intervals: Interval[] = [];
    private constructor() { super(); }
    static getInstance(): CosmicIntervalTree { if (!CosmicIntervalTree.instance) { CosmicIntervalTree.instance = new CosmicIntervalTree(); } return CosmicIntervalTree.instance; }
    insert(start: number, end: number, data: unknown): void { this.intervals.push({ start, end, data }); }
    query(point: number): Interval[] { return this.intervals.filter(i => i.start <= point && point <= i.end); }
    getStats(): { size: number } { return { size: this.intervals.length }; }
}
export const cosmicIntervalTree = CosmicIntervalTree.getInstance();
