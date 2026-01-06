/**
 * Dimensional Cuckoo Filter
 */
import { EventEmitter } from 'events';
export class DimensionalCuckooFilter extends EventEmitter {
    private buckets: (string | null)[][];
    private size: number;
    private bucketSize: number;
    private maxKicks: number;
    constructor(size: number = 1000, bucketSize: number = 4, maxKicks: number = 500) { super(); this.size = size; this.bucketSize = bucketSize; this.maxKicks = maxKicks; this.buckets = Array.from({ length: size }, () => Array(bucketSize).fill(null)); }
    private hash(item: string): number { let h = 0; for (let i = 0; i < item.length; i++) h = ((h << 5) - h + item.charCodeAt(i)) >>> 0; return h % this.size; }
    private fingerprint(item: string): string { let h = 0; for (let i = 0; i < item.length; i++) h = ((h * 31) + item.charCodeAt(i)) >>> 0; return (h & 0xFF).toString(16); }
    insert(item: string): boolean { const fp = this.fingerprint(item); let i1 = this.hash(item); let i2 = (i1 ^ this.hash(fp)) % this.size; for (const slot of [i1, i2]) { const idx = this.buckets[slot].indexOf(null); if (idx !== -1) { this.buckets[slot][idx] = fp; return true; } } let i = Math.random() < 0.5 ? i1 : i2; for (let n = 0; n < this.maxKicks; n++) { const j = Math.floor(Math.random() * this.bucketSize); const old = this.buckets[i][j]!; this.buckets[i][j] = fp; i = (i ^ this.hash(old)) % this.size; const idx = this.buckets[i].indexOf(null); if (idx !== -1) { this.buckets[i][idx] = old; return true; } } return false; }
    contains(item: string): boolean { const fp = this.fingerprint(item); const i1 = this.hash(item); const i2 = (i1 ^ this.hash(fp)) % this.size; return this.buckets[i1].includes(fp) || this.buckets[i2].includes(fp); }
}
export const createCuckooFilter = (size?: number) => new DimensionalCuckooFilter(size);
