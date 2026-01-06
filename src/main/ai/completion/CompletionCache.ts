/**
 * Completion Cache
 * Intelligent LRU cache for code completions to reduce latency
 */

export interface CacheEntry {
    key: string;
    completion: string;
    timestamp: number;
    contextHash: string;
    hitCount: number;
}

export interface CacheStats {
    totalEntries: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    avgHitCount: number;
}

export class CompletionCache {
    private cache = new Map<string, CacheEntry>();
    private maxSize: number;
    private totalHits = 0;
    private totalMisses = 0;

    // LRU tracking
    private accessOrder: string[] = [];

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
    }

    /**
     * Generate cache key from context
     */
    generateKey(context: {
        filePath: string;
        linePrefix: string;
        cursorContext: string;
        language: string;
    }): string {
        const { filePath, linePrefix, cursorContext, language } = context;

        // Use a hash of the context for the key
        const contextStr = `${filePath}:${language}:${linePrefix}:${cursorContext}`;
        return this.hashString(contextStr);
    }

    /**
     * Get completion from cache
     */
    get(key: string, contextHash: string): string | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.totalMisses++;
            return null;
        }

        // Check if context has changed significantly
        if (entry.contextHash !== contextHash) {
            this.totalMisses++;
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return null;
        }

        // Cache hit
        this.totalHits++;
        entry.hitCount++;
        entry.timestamp = Date.now();

        // Update LRU order
        this.updateAccessOrder(key);

        return entry.completion;
    }

    /**
     * Store completion in cache
     */
    set(key: string, completion: string, contextHash: string): void {
        // Check if we need to evict entries
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        const entry: CacheEntry = {
            key,
            completion,
            timestamp: Date.now(),
            contextHash,
            hitCount: 0,
        };

        this.cache.set(key, entry);
        this.updateAccessOrder(key);
    }

    /**
     * Invalidate cache entries for a file (when file is edited)
     */
    invalidateFile(filePath: string): number {
        let invalidated = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.key.startsWith(filePath)) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                invalidated++;
            }
        }

        return invalidated;
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.totalHits = 0;
        this.totalMisses = 0;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const totalEntries = this.cache.size;
        const totalRequests = this.totalHits + this.totalMisses;
        const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

        let totalHitCount = 0;
        for (const entry of this.cache.values()) {
            totalHitCount += entry.hitCount;
        }
        const avgHitCount = totalEntries > 0 ? totalHitCount / totalEntries : 0;

        return {
            totalEntries,
            hitRate,
            totalHits: this.totalHits,
            totalMisses: this.totalMisses,
            avgHitCount,
        };
    }

    /**
     * Prefetch common patterns (e.g., common imports, boilerplate)
     */
    async prefetchPatterns(patterns: Array<{
        context: any;
        completion: string;
    }>): Promise<void> {
        for (const pattern of patterns) {
            const key = this.generateKey(pattern.context);
            const contextHash = this.hashString(JSON.stringify(pattern.context));
            this.set(key, pattern.completion, contextHash);
        }
    }

    // ============ Private Helper Methods ============

    private evictLRU(): void {
        if (this.accessOrder.length === 0) return;

        // Evict least recently used entry
        const lruKey = this.accessOrder[0];
        this.cache.delete(lruKey);
        this.accessOrder.shift();
    }

    private updateAccessOrder(key: string): void {
        // Remove from current position
        this.removeFromAccessOrder(key);

        // Add to end (most recently used)
        this.accessOrder.push(key);
    }

    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    }
}

// Singleton instance
let instance: CompletionCache | null = null;

export function getCompletionCache(maxSize?: number): CompletionCache {
    if (!instance) {
        instance = new CompletionCache(maxSize);
    }
    return instance;
}
