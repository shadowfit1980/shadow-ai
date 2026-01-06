/**
 * LRU Cache - Least Recently Used cache
 */
import { EventEmitter } from 'events';

export class LRUCache<K, V> extends EventEmitter {
    private static instance: LRUCache<any, any>;
    private cache: Map<K, V> = new Map();
    private maxSize: number;
    private constructor(maxSize = 100) { super(); this.maxSize = maxSize; }
    static getInstance<K, V>(maxSize = 100): LRUCache<K, V> { if (!LRUCache.instance) LRUCache.instance = new LRUCache(maxSize); return LRUCache.instance as LRUCache<K, V>; }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) { this.cache.delete(key); this.cache.set(key, value); }
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) this.cache.delete(key);
        else if (this.cache.size >= this.maxSize) { const oldest = this.cache.keys().next().value; if (oldest) this.cache.delete(oldest); this.emit('evicted', oldest); }
        this.cache.set(key, value);
    }

    has(key: K): boolean { return this.cache.has(key); }
    delete(key: K): boolean { return this.cache.delete(key); }
    clear(): void { this.cache.clear(); }
    size(): number { return this.cache.size; }
    keys(): K[] { return Array.from(this.cache.keys()); }
}

export function getLRUCache<K, V>(maxSize = 100): LRUCache<K, V> { return LRUCache.getInstance<K, V>(maxSize); }
