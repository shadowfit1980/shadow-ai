/**
 * Dimensional LRU Cache
 */
import { EventEmitter } from 'events';
export class DimensionalLRUCache extends EventEmitter {
    private capacity: number;
    private cache: Map<number, number>;
    constructor(capacity: number) { super(); this.capacity = capacity; this.cache = new Map(); }
    get(key: number): number { if (!this.cache.has(key)) return -1; const value = this.cache.get(key)!; this.cache.delete(key); this.cache.set(key, value); return value; }
    put(key: number, value: number): void { if (this.cache.has(key)) this.cache.delete(key); this.cache.set(key, value); if (this.cache.size > this.capacity) this.cache.delete(this.cache.keys().next().value); }
}
export class LFUCache extends EventEmitter {
    private capacity: number;
    private cache: Map<number, { value: number; freq: number }>;
    private freqMap: Map<number, Set<number>>;
    private minFreq: number;
    constructor(capacity: number) { super(); this.capacity = capacity; this.cache = new Map(); this.freqMap = new Map(); this.minFreq = 0; }
    private updateFreq(key: number): void { const node = this.cache.get(key)!; const freq = node.freq; this.freqMap.get(freq)!.delete(key); if (this.freqMap.get(freq)!.size === 0) { this.freqMap.delete(freq); if (this.minFreq === freq) this.minFreq++; } node.freq++; if (!this.freqMap.has(node.freq)) this.freqMap.set(node.freq, new Set()); this.freqMap.get(node.freq)!.add(key); }
    get(key: number): number { if (!this.cache.has(key)) return -1; this.updateFreq(key); return this.cache.get(key)!.value; }
    put(key: number, value: number): void { if (this.capacity === 0) return; if (this.cache.has(key)) { this.cache.get(key)!.value = value; this.updateFreq(key); return; } if (this.cache.size >= this.capacity) { const keys = this.freqMap.get(this.minFreq)!.keys(); const delKey = keys.next().value; this.freqMap.get(this.minFreq)!.delete(delKey); this.cache.delete(delKey); } this.cache.set(key, { value, freq: 1 }); if (!this.freqMap.has(1)) this.freqMap.set(1, new Set()); this.freqMap.get(1)!.add(key); this.minFreq = 1; }
}
export const createLRUCache = (capacity: number) => new DimensionalLRUCache(capacity);
export const createLFUCache = (capacity: number) => new LFUCache(capacity);
