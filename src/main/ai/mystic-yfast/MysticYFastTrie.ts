/**
 * Mystic Y-Fast Trie
 */
import { EventEmitter } from 'events';
export class MysticYFastTrie extends EventEmitter {
    private buckets: Map<number, Set<number>> = new Map();
    private representatives: Set<number> = new Set();
    private bucketSize: number;
    constructor(universe: number = 1e9) { super(); this.bucketSize = Math.max(1, Math.ceil(Math.log2(universe))); }
    private getBucket(x: number): number { return Math.floor(x / this.bucketSize); }
    insert(x: number): void { const b = this.getBucket(x); if (!this.buckets.has(b)) this.buckets.set(b, new Set()); this.buckets.get(b)!.add(x); this.representatives.add(b); }
    remove(x: number): void { const b = this.getBucket(x); if (this.buckets.has(b)) { this.buckets.get(b)!.delete(x); if (this.buckets.get(b)!.size === 0) { this.buckets.delete(b); this.representatives.delete(b); } } }
    member(x: number): boolean { const b = this.getBucket(x); return this.buckets.has(b) && this.buckets.get(b)!.has(x); }
    successor(x: number): number | null { const b = this.getBucket(x); if (this.buckets.has(b)) { const bucket = this.buckets.get(b)!; for (const v of bucket) if (v > x) return v; } const sortedReps = [...this.representatives].sort((a, b) => a - b); for (const rep of sortedReps) { if (rep > b && this.buckets.has(rep)) return Math.min(...this.buckets.get(rep)!); } return null; }
    predecessor(x: number): number | null { const b = this.getBucket(x); if (this.buckets.has(b)) { const bucket = [...this.buckets.get(b)!].filter(v => v < x); if (bucket.length > 0) return Math.max(...bucket); } const sortedReps = [...this.representatives].sort((a, b) => b - a); for (const rep of sortedReps) { if (rep < b && this.buckets.has(rep)) return Math.max(...this.buckets.get(rep)!); } return null; }
}
export const createYFastTrie = (universe?: number) => new MysticYFastTrie(universe);
