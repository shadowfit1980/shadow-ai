/**
 * Cosmic Radix Heap
 */
import { EventEmitter } from 'events';
export class CosmicRadixHeap extends EventEmitter {
    private buckets: [number, number][][];
    private last: number = 0;
    private size: number = 0;
    constructor(maxValue: number = 1e9) { super(); const numBuckets = Math.ceil(Math.log2(maxValue)) + 2; this.buckets = Array.from({ length: numBuckets }, () => []); }
    private getBucket(value: number): number { if (value === this.last) return 0; const diff = value ^ this.last; return Math.floor(Math.log2(diff)) + 1; }
    insert(key: number, value: number): void { const bucket = this.getBucket(key); this.buckets[bucket].push([key, value]); this.size++; }
    extractMin(): [number, number] | null { if (this.size === 0) return null; for (let i = 0; i < this.buckets.length; i++) { if (this.buckets[i].length > 0) { if (i === 0) { this.size--; return this.buckets[i].shift()!; } let minIdx = 0; for (let j = 1; j < this.buckets[i].length; j++) if (this.buckets[i][j][0] < this.buckets[i][minIdx][0]) minIdx = j; const min = this.buckets[i].splice(minIdx, 1)[0]; this.last = min[0]; for (const item of this.buckets[i]) { const newBucket = this.getBucket(item[0]); this.buckets[newBucket].push(item); } this.buckets[i] = []; this.size--; return min; } } return null; }
    isEmpty(): boolean { return this.size === 0; }
}
export const createRadixHeap = (maxValue?: number) => new CosmicRadixHeap(maxValue);
