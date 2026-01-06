// Cache Strategy Generator - Redis, in-memory, SWR, and hybrid caching
import Anthropic from '@anthropic-ai/sdk';

class CacheStrategyGenerator {
    private anthropic: Anthropic | null = null;

    generateRedisCache(): string {
        return `import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CacheOptions {
    ttl?: number;
    prefix?: string;
}

export async function cacheGet<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const prefixedKey = options.prefix ? \`\${options.prefix}:\${key}\` : key;
    const cached = await redis.get(prefixedKey);
    return cached ? JSON.parse(cached) : null;
}

export async function cacheSet<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const prefixedKey = options.prefix ? \`\${options.prefix}:\${key}\` : key;
    const ttl = options.ttl || 3600;
    await redis.setex(prefixedKey, ttl, JSON.stringify(value));
}

export async function cacheDelete(key: string, options: CacheOptions = {}): Promise<void> {
    const prefixedKey = options.prefix ? \`\${options.prefix}:\${key}\` : key;
    await redis.del(prefixedKey);
}

export async function cacheGetOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const cached = await cacheGet<T>(key, options);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await cacheSet(key, fresh, options);
    return fresh;
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
}

// Cache decorator
export function Cached(ttl: number = 3600, prefix: string = 'cache') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const original = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const key = \`\${propertyKey}:\${JSON.stringify(args)}\`;
            return cacheGetOrSet(key, () => original.apply(this, args), { ttl, prefix });
        };
        return descriptor;
    };
}
`;
    }

    generateInMemoryCache(): string {
        return `interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize: number;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
        this.startCleanup();
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldest = this.cache.keys().next().value;
            if (oldest) this.cache.delete(oldest);
        }
        this.cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache) {
                if (now > entry.expiresAt) this.cache.delete(key);
            }
        }, 60000);
    }

    destroy(): void {
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

export const memoryCache = new MemoryCache();
export default MemoryCache;
`;
    }

    generateHTTPCacheHeaders(): string {
        return `import { NextResponse } from 'next/server';

type CacheControl = 'no-store' | 'no-cache' | 'private' | 'public';

interface CacheHeaderOptions {
    control?: CacheControl;
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    staleIfError?: number;
    mustRevalidate?: boolean;
    immutable?: boolean;
}

export function setCacheHeaders(response: NextResponse, options: CacheHeaderOptions): NextResponse {
    const parts: string[] = [];
    
    if (options.control) parts.push(options.control);
    if (options.maxAge !== undefined) parts.push(\`max-age=\${options.maxAge}\`);
    if (options.sMaxAge !== undefined) parts.push(\`s-maxage=\${options.sMaxAge}\`);
    if (options.staleWhileRevalidate !== undefined) parts.push(\`stale-while-revalidate=\${options.staleWhileRevalidate}\`);
    if (options.staleIfError !== undefined) parts.push(\`stale-if-error=\${options.staleIfError}\`);
    if (options.mustRevalidate) parts.push('must-revalidate');
    if (options.immutable) parts.push('immutable');

    response.headers.set('Cache-Control', parts.join(', '));
    return response;
}

// Presets
export const CachePresets = {
    noCache: { control: 'no-store' as const },
    shortLived: { control: 'public' as const, maxAge: 60, sMaxAge: 120, staleWhileRevalidate: 300 },
    standard: { control: 'public' as const, maxAge: 300, sMaxAge: 600, staleWhileRevalidate: 3600 },
    longLived: { control: 'public' as const, maxAge: 86400, sMaxAge: 604800, staleWhileRevalidate: 86400 },
    immutable: { control: 'public' as const, maxAge: 31536000, immutable: true },
    private: { control: 'private' as const, maxAge: 0, mustRevalidate: true },
};

// Express middleware
export function cacheMiddleware(options: CacheHeaderOptions) {
    return (req: any, res: any, next: any) => {
        const parts: string[] = [];
        if (options.control) parts.push(options.control);
        if (options.maxAge !== undefined) parts.push(\`max-age=\${options.maxAge}\`);
        if (options.sMaxAge !== undefined) parts.push(\`s-maxage=\${options.sMaxAge}\`);
        if (options.staleWhileRevalidate !== undefined) parts.push(\`stale-while-revalidate=\${options.staleWhileRevalidate}\`);
        res.setHeader('Cache-Control', parts.join(', '));
        next();
    };
}
`;
    }

    generateSWRConfig(): string {
        return `import useSWR, { SWRConfiguration } from 'swr';

// Default fetcher
const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
};

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
    fetcher,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    focusThrottleInterval: 5000,
    shouldRetryOnError: true,
};

// Custom hooks with different caching strategies
export function useData<T>(key: string | null, options: SWRConfiguration = {}) {
    return useSWR<T>(key, fetcher, { ...swrConfig, ...options });
}

export function useDataOnce<T>(key: string | null) {
    return useSWR<T>(key, fetcher, {
        ...swrConfig,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
    });
}

export function useRealtimeData<T>(key: string | null, refreshInterval: number = 5000) {
    return useSWR<T>(key, fetcher, {
        ...swrConfig,
        refreshInterval,
        refreshWhenHidden: false,
        refreshWhenOffline: false,
    });
}

export function useInfiniteData<T>(getKey: (index: number, prevData: T | null) => string | null) {
    const { useSWRInfinite } = require('swr/infinite');
    return useSWRInfinite<T>(getKey, fetcher, { ...swrConfig });
}

// Optimistic updates
export function useOptimisticUpdate<T>(key: string) {
    const { mutate } = require('swr');
    
    return async (updateFn: (current: T) => T, apiCall: () => Promise<T>) => {
        try {
            await mutate(key, async (current: T) => updateFn(current), { revalidate: false });
            const result = await apiCall();
            await mutate(key, result, { revalidate: false });
            return result;
        } catch (error) {
            await mutate(key);
            throw error;
        }
    };
}
`;
    }
}

export const cacheStrategyGenerator = new CacheStrategyGenerator();
