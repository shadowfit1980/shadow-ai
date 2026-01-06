// API Rate Limiter Generator - Token bucket, sliding window, and distributed rate limiting
import Anthropic from '@anthropic-ai/sdk';

class APIRateLimiterGenerator {
    private anthropic: Anthropic | null = null;

    generateTokenBucket(): string {
        return `class TokenBucket {
    private tokens: number;
    private lastRefill: number;
    private readonly maxTokens: number;
    private readonly refillRate: number;

    constructor(maxTokens: number, refillRatePerSecond: number) {
        this.maxTokens = maxTokens;
        this.refillRate = refillRatePerSecond;
        this.tokens = maxTokens;
        this.lastRefill = Date.now();
    }

    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }

    consume(count: number = 1): boolean {
        this.refill();
        if (this.tokens >= count) {
            this.tokens -= count;
            return true;
        }
        return false;
    }

    getWaitTime(count: number = 1): number {
        this.refill();
        if (this.tokens >= count) return 0;
        const needed = count - this.tokens;
        return Math.ceil((needed / this.refillRate) * 1000);
    }

    getTokens(): number {
        this.refill();
        return this.tokens;
    }
}

export default TokenBucket;
`;
    }

    generateSlidingWindow(): string {
        return `import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SlidingWindowOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix?: string;
}

export async function checkSlidingWindow(
    identifier: string,
    options: SlidingWindowOptions
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = options;
    const key = \`\${keyPrefix}:\${identifier}\`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zcard(key);
    multi.zadd(key, now.toString(), \`\${now}-\${Math.random()}\`);
    multi.pexpire(key, windowMs);
    
    const results = await multi.exec();
    const requestCount = (results?.[1]?.[1] as number) || 0;
    
    const allowed = requestCount < maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount - 1);
    const resetAt = now + windowMs;

    if (!allowed) {
        await redis.zrem(key, \`\${now}-\${Math.random()}\`);
    }

    return { allowed, remaining, resetAt };
}

export async function resetSlidingWindow(identifier: string, keyPrefix = 'ratelimit'): Promise<void> {
    await redis.del(\`\${keyPrefix}:\${identifier}\`);
}
`;
    }

    generateExpressMiddleware(): string {
        return `import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    keyGenerator?: (req: Request) => string;
    handler?: (req: Request, res: Response) => void;
    skip?: (req: Request) => boolean;
    headers?: boolean;
}

export function rateLimit(options: RateLimitOptions = {}) {
    const {
        windowMs = 60000,
        max = 100,
        keyGenerator = (req) => req.ip || 'unknown',
        handler = (req, res) => res.status(429).json({ error: 'Too many requests' }),
        skip = () => false,
        headers = true,
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        if (skip(req)) return next();

        const key = \`ratelimit:\${keyGenerator(req)}\`;
        const now = Date.now();
        const windowStart = now - windowMs;

        try {
            const multi = redis.multi();
            multi.zremrangebyscore(key, 0, windowStart);
            multi.zcard(key);
            multi.zadd(key, now.toString(), now.toString());
            multi.pexpire(key, windowMs);

            const results = await multi.exec();
            const count = (results?.[1]?.[1] as number) || 0;

            if (headers) {
                res.setHeader('X-RateLimit-Limit', max);
                res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count - 1));
                res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
            }

            if (count >= max) {
                res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
                return handler(req, res);
            }

            next();
        } catch (error) {
            console.error('Rate limit error:', error);
            next();
        }
    };
}

// Tiered rate limiting
export function tieredRateLimit(tiers: Record<string, RateLimitOptions>) {
    const limiters = Object.fromEntries(
        Object.entries(tiers).map(([tier, opts]) => [tier, rateLimit(opts)])
    );

    return (getTier: (req: Request) => string) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const tier = getTier(req);
            const limiter = limiters[tier] || limiters['default'];
            if (limiter) return limiter(req, res, next);
            next();
        };
    };
}
`;
    }

    generateNextAPIRateLimit(): string {
        return `import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
    interval: number;
    limit: number;
}

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function withRateLimit(config: RateLimitConfig) {
    return function (handler: (req: NextRequest) => Promise<NextResponse>) {
        return async function (req: NextRequest): Promise<NextResponse> {
            const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
            const now = Date.now();
            
            let rateLimit = rateLimitMap.get(ip);
            
            if (!rateLimit || now - rateLimit.lastReset > config.interval) {
                rateLimit = { count: 0, lastReset: now };
                rateLimitMap.set(ip, rateLimit);
            }

            rateLimit.count++;

            const remaining = Math.max(0, config.limit - rateLimit.count);
            const resetAt = rateLimit.lastReset + config.interval;

            if (rateLimit.count > config.limit) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': config.limit.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
                            'Retry-After': Math.ceil((resetAt - now) / 1000).toString(),
                        },
                    }
                );
            }

            const response = await handler(req);
            response.headers.set('X-RateLimit-Limit', config.limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
            
            return response;
        };
    };
}

// Usage: export const GET = withRateLimit({ interval: 60000, limit: 100 })(handler);

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap) {
        if (now - value.lastReset > 300000) {
            rateLimitMap.delete(key);
        }
    }
}, 60000);
`;
    }
}

export const apiRateLimiterGenerator = new APIRateLimiterGenerator();
