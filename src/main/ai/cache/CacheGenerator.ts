/**
 * Cache Generator
 * 
 * Generate caching code for Redis and in-memory caching.
 */

import { EventEmitter } from 'events';

interface CacheConfig {
    ttl?: number;
    prefix?: string;
}

export class CacheGenerator extends EventEmitter {
    private static instance: CacheGenerator;

    private constructor() { super(); }

    static getInstance(): CacheGenerator {
        if (!CacheGenerator.instance) {
            CacheGenerator.instance = new CacheGenerator();
        }
        return CacheGenerator.instance;
    }

    generateRedisClient(config: CacheConfig = {}): string {
        return `import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

const PREFIX = '${config.prefix || 'app'}:';
const DEFAULT_TTL = ${config.ttl || 3600};

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(PREFIX + key);
    return data ? JSON.parse(data) : null;
  },

  async set<T>(key: string, value: T, ttl = DEFAULT_TTL): Promise<void> {
    await redis.setex(PREFIX + key, ttl, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(PREFIX + key);
  },

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(PREFIX + pattern);
    if (keys.length) await redis.del(...keys);
  },
};

export default redis;`;
    }

    generateInMemoryCache(): string {
        return `interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timer;

  constructor(cleanupMs = 60000) {
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupMs);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set<T>(key: string, value: T, ttlMs = 300000): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) this.cache.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

export const cache = new InMemoryCache();`;
    }

    generateCacheDecorator(): string {
        return `import { cache } from './cache';

export function Cached(ttl = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = \`\${target.constructor.name}:\${propertyKey}:\${JSON.stringify(args)}\`;
      const cached = await cache.get(key);
      if (cached) return cached;
      
      const result = await original.apply(this, args);
      await cache.set(key, result, ttl);
      return result;
    };
    
    return descriptor;
  };
}`;
    }

    generateReactQueryCache(): string {
        return `import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});`;
    }
}

export const cacheGenerator = CacheGenerator.getInstance();
