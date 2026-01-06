/**
 * Layer Cache - Model layer caching
 */
import { EventEmitter } from 'events';

export interface CachedLayer { digest: string; size: number; path: string; accessCount: number; lastAccessed: number; }

export class LayerCacheEngine extends EventEmitter {
    private static instance: LayerCacheEngine;
    private layers: Map<string, CachedLayer> = new Map();
    private maxSize = 50 * 1024 * 1024 * 1024; // 50GB
    private currentSize = 0;
    private cacheDir = '~/.ollama/models/blobs';
    private constructor() { super(); }
    static getInstance(): LayerCacheEngine { if (!LayerCacheEngine.instance) LayerCacheEngine.instance = new LayerCacheEngine(); return LayerCacheEngine.instance; }

    add(digest: string, size: number): CachedLayer { while (this.currentSize + size > this.maxSize && this.layers.size > 0) this.evictLRU(); const layer: CachedLayer = { digest, size, path: `${this.cacheDir}/${digest}`, accessCount: 1, lastAccessed: Date.now() }; this.layers.set(digest, layer); this.currentSize += size; return layer; }

    get(digest: string): CachedLayer | null { const layer = this.layers.get(digest); if (layer) { layer.accessCount++; layer.lastAccessed = Date.now(); } return layer || null; }
    has(digest: string): boolean { return this.layers.has(digest); }

    private evictLRU(): void { let oldest: CachedLayer | null = null; for (const layer of this.layers.values()) { if (!oldest || layer.lastAccessed < oldest.lastAccessed) oldest = layer; } if (oldest) { this.layers.delete(oldest.digest); this.currentSize -= oldest.size; this.emit('evicted', oldest.digest); } }

    getStats(): { count: number; size: number; maxSize: number; hitRate: number } { const total = Array.from(this.layers.values()).reduce((s, l) => s + l.accessCount, 0); return { count: this.layers.size, size: this.currentSize, maxSize: this.maxSize, hitRate: this.layers.size > 0 ? (total - this.layers.size) / total : 0 }; }
    clear(): void { this.layers.clear(); this.currentSize = 0; }
}
export function getLayerCacheEngine(): LayerCacheEngine { return LayerCacheEngine.getInstance(); }
