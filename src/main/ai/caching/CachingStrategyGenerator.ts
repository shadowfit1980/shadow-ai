/**
 * Caching Strategy Generator
 * 
 * Generate caching configurations, middleware, and utilities
 * for various caching strategies and providers.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type CacheProvider = 'memory' | 'redis' | 'memcached' | 'node-cache';
export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'cache-only' | 'network-only';
export type InvalidationStrategy = 'ttl' | 'event-driven' | 'tag-based' | 'manual';

export interface CacheConfig {
    provider: CacheProvider;
    defaultTTL: number; // seconds
    maxSize?: number; // max items
    strategy: CacheStrategy;
    invalidation: InvalidationStrategy;
    prefix?: string;
    compression?: boolean;
}

export interface CacheRule {
    pattern: string; // URL pattern or key pattern
    ttl: number;
    strategy?: CacheStrategy;
    tags?: string[];
    conditions?: {
        method?: string[];
        headers?: Record<string, string>;
        query?: Record<string, string>;
    };
}

// ============================================================================
// CACHING STRATEGY GENERATOR
// ============================================================================

export class CachingStrategyGenerator extends EventEmitter {
    private static instance: CachingStrategyGenerator;

    private constructor() {
        super();
    }

    static getInstance(): CachingStrategyGenerator {
        if (!CachingStrategyGenerator.instance) {
            CachingStrategyGenerator.instance = new CachingStrategyGenerator();
        }
        return CachingStrategyGenerator.instance;
    }

    // ========================================================================
    // REDIS CACHE SERVICE
    // ========================================================================

    generateRedisCacheService(config: CacheConfig): string {
        return `import { createClient, RedisClientType } from 'redis';

interface CacheOptions {
    ttl?: number;
    tags?: string[];
}

class RedisCacheService {
    private client: RedisClientType;
    private prefix: string;
    private defaultTTL: number;
    private isConnected: boolean = false;

    constructor() {
        this.prefix = '${config.prefix || 'cache'}:';
        this.defaultTTL = ${config.defaultTTL};
        
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.client.on('error', (err) => console.error('Redis Error:', err));
        this.client.on('connect', () => {
            this.isConnected = true;
            console.log('Redis connected');
        });
    }

    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect();
        }
    }

    private getKey(key: string): string {
        return this.prefix + key;
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(this.getKey(key));
        if (!data) return null;
        
        try {
            return JSON.parse(data) as T;
        } catch {
            return data as unknown as T;
        }
    }

    async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
        const ttl = options.ttl || this.defaultTTL;
        const data = typeof value === 'string' ? value : JSON.stringify(value);
        
        await this.client.setEx(this.getKey(key), ttl, data);
        
        // Tag-based invalidation support
        if (options.tags) {
            for (const tag of options.tags) {
                await this.client.sAdd(\`\${this.prefix}tag:\${tag}\`, key);
            }
        }
    }

    async delete(key: string): Promise<boolean> {
        const result = await this.client.del(this.getKey(key));
        return result > 0;
    }

    async deleteByTag(tag: string): Promise<number> {
        const keys = await this.client.sMembers(\`\${this.prefix}tag:\${tag}\`);
        if (keys.length === 0) return 0;
        
        const fullKeys = keys.map(k => this.getKey(k));
        const deleted = await this.client.del(fullKeys);
        await this.client.del(\`\${this.prefix}tag:\${tag}\`);
        
        return deleted;
    }

    async deleteByPattern(pattern: string): Promise<number> {
        const keys = await this.client.keys(this.getKey(pattern));
        if (keys.length === 0) return 0;
        return await this.client.del(keys);
    }

    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) return cached;
        
        const value = await fetcher();
        await this.set(key, value, options);
        return value;
    }

    async clear(): Promise<void> {
        const keys = await this.client.keys(this.prefix + '*');
        if (keys.length > 0) {
            await this.client.del(keys);
        }
    }

    async stats(): Promise<{ keys: number; memory: string }> {
        const keys = await this.client.keys(this.prefix + '*');
        const info = await this.client.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        
        return {
            keys: keys.length,
            memory: memoryMatch ? memoryMatch[1].trim() : 'unknown',
        };
    }
}

export const cacheService = new RedisCacheService();
`;
    }

    // ========================================================================
    // IN-MEMORY CACHE
    // ========================================================================

    generateMemoryCache(config: CacheConfig): string {
        return `interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    tags: string[];
}

class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private maxSize: number;
    private defaultTTL: number;
    private prefix: string;

    constructor() {
        this.maxSize = ${config.maxSize || 1000};
        this.defaultTTL = ${config.defaultTTL} * 1000; // Convert to ms
        this.prefix = '${config.prefix || ''}';
        
        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    private getKey(key: string): string {
        return this.prefix + key;
    }

    get<T>(key: string): T | undefined {
        const entry = this.cache.get(this.getKey(key));
        
        if (!entry) return undefined;
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(this.getKey(key));
            return undefined;
        }
        
        return entry.value as T;
    }

    set<T>(key: string, value: T, options: { ttl?: number; tags?: string[] } = {}): void {
        // Evict if at max size
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const ttl = (options.ttl || this.defaultTTL / 1000) * 1000;
        
        this.cache.set(this.getKey(key), {
            value,
            expiresAt: Date.now() + ttl,
            tags: options.tags || [],
        });
    }

    delete(key: string): boolean {
        return this.cache.delete(this.getKey(key));
    }

    deleteByTag(tag: string): number {
        let count = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.includes(tag)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }

    has(key: string): boolean {
        const entry = this.cache.get(this.getKey(key));
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(this.getKey(key));
            return false;
        }
        return true;
    }

    getOrSet<T>(key: string, fetcher: () => T, options?: { ttl?: number; tags?: string[] }): T {
        const cached = this.get<T>(key);
        if (cached !== undefined) return cached;
        
        const value = fetcher();
        this.set(key, value, options);
        return value;
    }

    async getOrSetAsync<T>(
        key: string,
        fetcher: () => Promise<T>,
        options?: { ttl?: number; tags?: string[] }
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== undefined) return cached;
        
        const value = await fetcher();
        this.set(key, value, options);
        return value;
    }

    clear(): void {
        this.cache.clear();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }

    private evictOldest(): void {
        // LRU-style: just delete the first entry (oldest)
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
            this.cache.delete(firstKey);
        }
    }

    stats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
        };
    }
}

export const memoryCache = new MemoryCache();
`;
    }

    // ========================================================================
    // CACHE MIDDLEWARE
    // ========================================================================

    generateCacheMiddleware(rules: CacheRule[]): string {
        return `import { Request, Response, NextFunction } from 'express';
import { memoryCache } from './MemoryCache'; // or use cacheService for Redis

interface CacheRule {
    pattern: RegExp;
    ttl: number;
    methods: string[];
    tags: string[];
}

const CACHE_RULES: CacheRule[] = [
${rules.map(r => `    {
        pattern: new RegExp('${r.pattern.replace(/\//g, '\\/')}'),
        ttl: ${r.ttl},
        methods: ${JSON.stringify(r.conditions?.method || ['GET'])},
        tags: ${JSON.stringify(r.tags || [])},
    },`).join('\n')}
];

function getCacheKey(req: Request): string {
    const url = req.originalUrl || req.url;
    const userId = (req as any).user?.id || 'anonymous';
    return \`\${req.method}:\${url}:\${userId}\`;
}

function getMatchingRule(req: Request): CacheRule | null {
    const url = req.originalUrl || req.url;
    const method = req.method;
    
    for (const rule of CACHE_RULES) {
        if (rule.pattern.test(url) && rule.methods.includes(method)) {
            return rule;
        }
    }
    return null;
}

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const rule = getMatchingRule(req);
    
    // Skip if no matching rule
    if (!rule) {
        return next();
    }

    const cacheKey = getCacheKey(req);
    const cached = memoryCache.get<{ body: any; headers: Record<string, string> }>(cacheKey);

    if (cached) {
        // Serve from cache
        res.set('X-Cache', 'HIT');
        Object.entries(cached.headers).forEach(([key, value]) => {
            res.set(key, value);
        });
        return res.json(cached.body);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = (body: any) => {
        res.set('X-Cache', 'MISS');
        
        // Cache the response
        memoryCache.set(cacheKey, {
            body,
            headers: {
                'Content-Type': 'application/json',
            },
        }, { ttl: rule.ttl, tags: rule.tags });

        return originalJson(body);
    };

    next();
};

// Invalidation helper
export const invalidateCache = (tags: string[]): number => {
    let total = 0;
    for (const tag of tags) {
        total += memoryCache.deleteByTag(tag);
    }
    return total;
};

// Usage: app.use(cacheMiddleware);
`;
    }

    // ========================================================================
    // STALE-WHILE-REVALIDATE
    // ========================================================================

    generateSWRCache(): string {
        return `/**
 * Stale-While-Revalidate Cache
 * 
 * Returns stale data immediately while fetching fresh data in background.
 */

interface SWREntry<T> {
    value: T;
    fetchedAt: number;
    staleAt: number;
    expiresAt: number;
}

class SWRCache {
    private cache: Map<string, SWREntry<any>> = new Map();
    private fetching: Set<string> = new Set();

    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: {
            staleTime?: number; // ms before data is considered stale
            maxAge?: number; // ms before data expires completely
        } = {}
    ): Promise<T> {
        const staleTime = options.staleTime || 60000; // 1 minute
        const maxAge = options.maxAge || 300000; // 5 minutes

        const entry = this.cache.get(key);
        const now = Date.now();

        // No entry or expired - must fetch
        if (!entry || now > entry.expiresAt) {
            const value = await fetcher();
            this.cache.set(key, {
                value,
                fetchedAt: now,
                staleAt: now + staleTime,
                expiresAt: now + maxAge,
            });
            return value;
        }

        // Entry is stale but not expired - return stale and revalidate
        if (now > entry.staleAt && !this.fetching.has(key)) {
            this.fetching.add(key);
            
            // Revalidate in background
            fetcher()
                .then(value => {
                    this.cache.set(key, {
                        value,
                        fetchedAt: Date.now(),
                        staleAt: Date.now() + staleTime,
                        expiresAt: Date.now() + maxAge,
                    });
                })
                .finally(() => {
                    this.fetching.delete(key);
                });
        }

        // Return cached value (possibly stale)
        return entry.value;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const swrCache = new SWRCache();

// Usage:
// const data = await swrCache.get('user:123', () => fetchUser(123), { staleTime: 30000 });
`;
    }

    // ========================================================================
    // CACHE HEADERS
    // ========================================================================

    generateCacheHeaders(): string {
        return `import { Response } from 'express';

interface CacheHeaderOptions {
    maxAge?: number; // seconds
    sMaxAge?: number; // CDN cache time in seconds
    staleWhileRevalidate?: number; // seconds
    staleIfError?: number; // seconds
    private?: boolean;
    noCache?: boolean;
    noStore?: boolean;
    mustRevalidate?: boolean;
    immutable?: boolean;
}

export function setCacheHeaders(res: Response, options: CacheHeaderOptions): void {
    const directives: string[] = [];

    if (options.noStore) {
        directives.push('no-store');
    } else if (options.noCache) {
        directives.push('no-cache');
    } else {
        directives.push(options.private ? 'private' : 'public');
        
        if (options.maxAge !== undefined) {
            directives.push(\`max-age=\${options.maxAge}\`);
        }
        
        if (options.sMaxAge !== undefined) {
            directives.push(\`s-maxage=\${options.sMaxAge}\`);
        }
        
        if (options.staleWhileRevalidate !== undefined) {
            directives.push(\`stale-while-revalidate=\${options.staleWhileRevalidate}\`);
        }
        
        if (options.staleIfError !== undefined) {
            directives.push(\`stale-if-error=\${options.staleIfError}\`);
        }
        
        if (options.mustRevalidate) {
            directives.push('must-revalidate');
        }
        
        if (options.immutable) {
            directives.push('immutable');
        }
    }

    res.set('Cache-Control', directives.join(', '));
}

// Presets
export const cachePresets = {
    // Static assets - cache for 1 year
    static: { maxAge: 31536000, immutable: true },
    
    // API responses - cache briefly, revalidate
    api: { maxAge: 60, sMaxAge: 300, staleWhileRevalidate: 3600 },
    
    // User-specific data - private cache
    private: { private: true, maxAge: 300 },
    
    // No caching at all
    none: { noStore: true },
    
    // Revalidate on every request
    revalidate: { noCache: true },
};

// Usage: setCacheHeaders(res, cachePresets.api);
`;
    }
}

export const cachingStrategyGenerator = CachingStrategyGenerator.getInstance();
