/**
 * Cache Manager
 * In-memory and persistent caching
 */

import { EventEmitter } from 'events';

export interface CacheEntry<T = any> {
    key: string;
    value: T;
    expires?: number;
    createdAt: number;
}

/**
 * CacheManager
 * Multi-level caching
 */
export class CacheManager extends EventEmitter {
    private static instance: CacheManager;
    private cache: Map<string, CacheEntry> = new Map();
    private maxSize = 1000;

    private constructor() {
        super();
    }

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    set<T>(key: string, value: T, ttlMs?: number): void {
        if (this.cache.size >= this.maxSize) {
            const oldest = Array.from(this.cache.keys())[0];
            this.cache.delete(oldest);
        }

        this.cache.set(key, {
            key,
            value,
            expires: ttlMs ? Date.now() + ttlMs : undefined,
            createdAt: Date.now(),
        });
        this.emit('set', { key });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (entry.expires && Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) this.emit('deleted', { key });
        return deleted;
    }

    clear(): void {
        this.cache.clear();
        this.emit('cleared');
    }

    getStats(): { size: number; maxSize: number } {
        return { size: this.cache.size, maxSize: this.maxSize };
    }

    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    setMaxSize(size: number): void {
        this.maxSize = size;
    }

    prune(): number {
        let pruned = 0;
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (entry.expires && now > entry.expires) {
                this.cache.delete(key);
                pruned++;
            }
        }
        return pruned;
    }
}

export function getCacheManager(): CacheManager {
    return CacheManager.getInstance();
}
