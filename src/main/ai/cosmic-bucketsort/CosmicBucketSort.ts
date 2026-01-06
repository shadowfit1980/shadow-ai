/**
 * Cosmic Bucket Sort
 */
import { EventEmitter } from 'events';
export class CosmicBucketSort extends EventEmitter {
    private static instance: CosmicBucketSort;
    private constructor() { super(); }
    static getInstance(): CosmicBucketSort { if (!CosmicBucketSort.instance) { CosmicBucketSort.instance = new CosmicBucketSort(); } return CosmicBucketSort.instance; }
    sort(arr: number[], numBuckets?: number): number[] { if (arr.length <= 1) return arr; const min = Math.min(...arr); const max = Math.max(...arr); const range = max - min || 1; const n = numBuckets ?? Math.ceil(Math.sqrt(arr.length)); const buckets: number[][] = Array.from({ length: n }, () => []); for (const num of arr) { const idx = Math.min(Math.floor((num - min) / range * (n - 1)), n - 1); buckets[idx].push(num); } for (const bucket of buckets) bucket.sort((a, b) => a - b); return buckets.flat(); }
    uniformSort(arr: number[]): number[] { if (arr.length <= 1) return arr; const n = arr.length; const buckets: number[][] = Array.from({ length: n }, () => []); for (const num of arr) { const idx = Math.min(Math.floor(num * n), n - 1); buckets[idx].push(num); } for (const bucket of buckets) bucket.sort((a, b) => a - b); return buckets.flat(); }
}
export const cosmicBucketSort = CosmicBucketSort.getInstance();
