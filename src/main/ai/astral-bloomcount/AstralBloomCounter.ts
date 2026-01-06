/**
 * Astral Bloom Counter
 */
import { EventEmitter } from 'events';
export class AstralBloomCounter extends EventEmitter {
    private counters: Uint8Array;
    private size: number;
    private hashCount: number;
    constructor(size: number = 10000, hashCount: number = 7) { super(); this.size = size; this.hashCount = hashCount; this.counters = new Uint8Array(size); }
    private hash(item: string, seed: number): number { let h = seed; for (let i = 0; i < item.length; i++) h = ((h << 5) - h + item.charCodeAt(i)) >>> 0; return h % this.size; }
    add(item: string): void { for (let i = 0; i < this.hashCount; i++) { const idx = this.hash(item, i); if (this.counters[idx] < 255) this.counters[idx]++; } }
    remove(item: string): void { for (let i = 0; i < this.hashCount; i++) { const idx = this.hash(item, i); if (this.counters[idx] > 0) this.counters[idx]--; } }
    count(item: string): number { let min = 255; for (let i = 0; i < this.hashCount; i++) min = Math.min(min, this.counters[this.hash(item, i)]); return min; }
    mightContain(item: string): boolean { return this.count(item) > 0; }
}
export const createBloomCounter = (size?: number, hashCount?: number) => new AstralBloomCounter(size, hashCount);
