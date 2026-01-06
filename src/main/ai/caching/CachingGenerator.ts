/**
 * Caching & Rate Limiting Generator
 * 
 * Generate caching with Redis, in-memory, and rate limiting
 * for APIs and applications.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type CacheProvider = 'redis' | 'memcached' | 'memory' | 'upstash';

// ============================================================================
// CACHING GENERATOR
// ============================================================================

export class CachingGenerator extends EventEmitter {
    private static instance: CachingGenerator;

    private constructor() {
        super();
    }

    static getInstance(): CachingGenerator {
        if (!CachingGenerator.instance) {
            CachingGenerator.instance = new CachingGenerator();
        }
        return CachingGenerator.instance;
    }

    // ========================================================================
    // REDIS
    // ========================================================================

    generateRedis(): string {
        return `import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const cache = {
  // Get value
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  // Set value with optional TTL
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  // Delete key
  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  // Delete by pattern
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // Check if exists
  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  },

  // Increment
  async incr(key: string): Promise<number> {
    return redis.incr(key);
  },

  // Get or set (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  },

  // Hash operations
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await redis.hget(key, field);
    return value ? JSON.parse(value) : null;
  },

  async hset(key: string, field: string, value: any): Promise<void> {
    await redis.hset(key, field, JSON.stringify(value));
  },

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await redis.hgetall(key);
    const result: Record<string, T> = {};
    for (const [k, v] of Object.entries(data)) {
      result[k] = JSON.parse(v);
    }
    return result;
  },

  // List operations
  async lpush(key: string, ...values: any[]): Promise<void> {
    await redis.lpush(key, ...values.map(v => JSON.stringify(v)));
  },

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const values = await redis.lrange(key, start, stop);
    return values.map(v => JSON.parse(v));
  },

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<void> {
    await redis.sadd(key, ...members);
  },

  async smembers(key: string): Promise<string[]> {
    return redis.smembers(key);
  },

  async sismember(key: string, member: string): Promise<boolean> {
    return (await redis.sismember(key, member)) === 1;
  },

  // Pub/Sub
  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = redis.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) callback(message);
    });
  },

  async publish(channel: string, message: string): Promise<void> {
    await redis.publish(channel, message);
  },
};

// Rate limiter
export const rateLimiter = {
  async check(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const now = Date.now();
    const windowKey = \`ratelimit:\${key}:\${Math.floor(now / (windowSeconds * 1000))}\`;

    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: new Date(Math.ceil(now / (windowSeconds * 1000)) * windowSeconds * 1000),
    };
  },
};

// Express middleware
import { Request, Response, NextFunction } from 'express';

export function cacheMiddleware(ttlSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = \`cache:\${req.originalUrl}\`;
    const cached = await cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      cache.set(key, data, ttlSeconds);
      return originalJson(data);
    };

    next();
  };
}

export function rateLimitMiddleware(limit = 100, windowSeconds = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'anonymous';
    const result = await rateLimiter.check(key, limit, windowSeconds);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    next();
  };
}
`;
    }

    // ========================================================================
    // UPSTASH (Serverless Redis)
    // ========================================================================

    generateUpstash(): string {
        return `import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const upstashCache = {
  async get<T>(key: string): Promise<T | null> {
    return redis.get(key);
  },

  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    if (options?.ex) {
      await redis.setex(key, options.ex, value);
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    await this.set(key, value, { ex: ttl });
    return value;
  },
};

// Rate limiter for Vercel/Next.js
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

// Next.js middleware
import { NextRequest, NextResponse } from 'next/server';

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return NextResponse.next();
}

// Usage in API route
// export async function GET(request: NextRequest) {
//   const { success } = await ratelimit.limit(request.ip ?? 'anonymous');
//   if (!success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
//   // ... rest of handler
// }
`;
    }

    // ========================================================================
    // IN-MEMORY CACHE
    // ========================================================================

    generateMemoryCache(): string {
        return `// Simple in-memory cache with LRU eviction
interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  lastAccessed: number;
}

export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      lastAccessed: Date.now(),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldest: { key: string; time: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.lastAccessed < oldest.time) {
        oldest = { key, time: entry.lastAccessed };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  // Get or set pattern
  async getOrSet(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) return cached;

    const value = await fetcher();
    this.set(key, value, ttlMs);
    return value;
  }
}

// Global instance
export const memoryCache = new MemoryCache();

// Decorator for caching function results
export function cached(ttlMs = 60000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new MemoryCache();

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      return cache.getOrSet(key, () => originalMethod.apply(this, args), ttlMs);
    };

    return descriptor;
  };
}

// React Query-like cache
export class QueryCache {
  private cache = new MemoryCache<{ data: any; staleTime: number }>();

  async query<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { staleTime?: number; cacheTime?: number }
  ): Promise<T> {
    const { staleTime = 0, cacheTime = 300000 } = options || {};
    const cached = this.cache.get(key);

    if (cached) {
      // Return cached if not stale
      if (Date.now() < cached.staleTime) {
        return cached.data;
      }
      // Return stale while revalidating
      fetcher().then(data => {
        this.cache.set(key, { data, staleTime: Date.now() + staleTime }, cacheTime);
      });
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, staleTime: Date.now() + staleTime }, cacheTime);
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();
`;
    }

    generateEnvTemplate(provider: CacheProvider): string {
        switch (provider) {
            case 'redis':
                return `REDIS_URL=redis://localhost:6379`;
            case 'upstash':
                return `UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=`;
            default:
                return '';
        }
    }
}

export const cachingGenerator = CachingGenerator.getInstance();
