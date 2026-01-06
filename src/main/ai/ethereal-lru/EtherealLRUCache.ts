/**
 * Ethereal LRU Cache
 */
import { EventEmitter } from 'events';
export class EtherealLRUCache extends EventEmitter {
    private static instance: EtherealLRUCache;
    private cache: Map<string, { value: unknown; time: number }> = new Map();
    private maxSize: number = 100;
    private constructor() { super(); }
    static getInstance(): EtherealLRUCache { if (!EtherealLRUCache.instance) { EtherealLRUCache.instance = new EtherealLRUCache(); } return EtherealLRUCache.instance; }
    get(key: string): unknown | undefined { const entry = this.cache.get(key); if (entry) { entry.time = Date.now(); return entry.value; } return undefined; }
    set(key: string, value: unknown): void { if (this.cache.size >= this.maxSize) { const oldest = Array.from(this.cache.entries()).sort((a, b) => a[1].time - b[1].time)[0]; if (oldest) this.cache.delete(oldest[0]); } this.cache.set(key, { value, time: Date.now() }); }
    getStats(): { size: number; maxSize: number } { return { size: this.cache.size, maxSize: this.maxSize }; }
}
export const etherealLRUCache = EtherealLRUCache.getInstance();
