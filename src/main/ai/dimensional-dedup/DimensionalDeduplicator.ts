/**
 * Dimensional Deduplicator
 */
import { EventEmitter } from 'events';
export class DimensionalDeduplicator extends EventEmitter {
    private static instance: DimensionalDeduplicator;
    private seen: Set<string> = new Set();
    private constructor() { super(); }
    static getInstance(): DimensionalDeduplicator { if (!DimensionalDeduplicator.instance) { DimensionalDeduplicator.instance = new DimensionalDeduplicator(); } return DimensionalDeduplicator.instance; }
    isDuplicate(key: string): boolean { if (this.seen.has(key)) return true; this.seen.add(key); return false; }
    clear(): void { this.seen.clear(); }
    getStats(): { total: number } { return { total: this.seen.size }; }
}
export const dimensionalDeduplicator = DimensionalDeduplicator.getInstance();
