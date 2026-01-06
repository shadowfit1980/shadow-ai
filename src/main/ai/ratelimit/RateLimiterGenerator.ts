/**
 * Rate Limiter Generator
 * 
 * Generate rate limiting configurations and middleware
 * for APIs with various strategies (fixed window, sliding window, token bucket).
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type RateLimitStrategy = 'fixed-window' | 'sliding-window' | 'token-bucket' | 'leaky-bucket';
export type RateLimitStore = 'memory' | 'redis' | 'database';

export interface RateLimitConfig {
    strategy: RateLimitStrategy;
    store: RateLimitStore;
    windowMs: number;
    maxRequests: number;
    keyGenerator?: 'ip' | 'user' | 'api-key' | 'custom';
    skipList?: string[];
    whitelistIPs?: string[];
    errorMessage?: string;
    headers?: boolean;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
}

export interface RateLimitTier {
    name: string;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burstLimit?: number;
}

export interface RateLimitEndpoint {
    path: string;
    method: string;
    limit: number;
    windowMs: number;
}

// ============================================================================
// RATE LIMITER GENERATOR
// ============================================================================

export class RateLimiterGenerator extends EventEmitter {
    private static instance: RateLimiterGenerator;

    private constructor() {
        super();
    }

    static getInstance(): RateLimiterGenerator {
        if (!RateLimiterGenerator.instance) {
            RateLimiterGenerator.instance = new RateLimiterGenerator();
        }
        return RateLimiterGenerator.instance;
    }

    // ========================================================================
    // EXPRESS MIDDLEWARE
    // ========================================================================

    generateExpressMiddleware(config: RateLimitConfig): string {
        const storeCode = this.getStoreCode(config.store);
        const keyGeneratorCode = this.getKeyGeneratorCode(config.keyGenerator || 'ip');

        return `import rateLimit from 'express-rate-limit';
${config.store === 'redis' ? "import RedisStore from 'rate-limit-redis';\nimport { createClient } from 'redis';" : ''}

${config.store === 'redis' ? `const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
redisClient.connect().catch(console.error);
` : ''}

${keyGeneratorCode}

export const rateLimiter = rateLimit({
    windowMs: ${config.windowMs}, // ${config.windowMs / 1000 / 60} minutes
    max: ${config.maxRequests}, // Limit each key to ${config.maxRequests} requests per window
    ${storeCode}
    keyGenerator,
    message: {
        error: '${config.errorMessage || 'Too many requests, please try again later.'}',
        retryAfter: Math.ceil(${config.windowMs} / 1000),
    },
    standardHeaders: ${config.headers !== false}, // Return rate limit info in headers
    legacyHeaders: false,
    skipFailedRequests: ${config.skipFailedRequests || false},
    skipSuccessfulRequests: ${config.skipSuccessfulRequests || false},
    ${config.skipList ? `skip: (req) => ${JSON.stringify(config.skipList)}.includes(req.path),` : ''}
    ${config.whitelistIPs ? `skip: (req) => ${JSON.stringify(config.whitelistIPs)}.includes(req.ip),` : ''}
});

// Usage: app.use(rateLimiter);
// Or for specific routes: app.use('/api/', rateLimiter);
`;
    }

    private getStoreCode(store: RateLimitStore): string {
        switch (store) {
            case 'redis':
                return `store: new RedisStore({
        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),`;
            case 'database':
                return `// Use a custom store for database-backed rate limiting
    // store: new DatabaseStore({ ... }),`;
            default:
                return '// Using default in-memory store';
        }
    }

    private getKeyGeneratorCode(keyGen: string): string {
        switch (keyGen) {
            case 'ip':
                return `const keyGenerator = (req: any) => req.ip;`;
            case 'user':
                return `const keyGenerator = (req: any) => req.user?.id || req.ip;`;
            case 'api-key':
                return `const keyGenerator = (req: any) => req.headers['x-api-key'] || req.ip;`;
            default:
                return `const keyGenerator = (req: any) => req.ip;`;
        }
    }

    // ========================================================================
    // TIERED RATE LIMITING
    // ========================================================================

    generateTieredRateLimiter(tiers: RateLimitTier[]): string {
        return `import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limit tiers
const TIERS: Record<string, { minute: number; hour: number; day: number; burst?: number }> = {
${tiers.map(t => `    '${t.name}': { minute: ${t.requestsPerMinute}, hour: ${t.requestsPerHour}, day: ${t.requestsPerDay}${t.burstLimit ? `, burst: ${t.burstLimit}` : ''} },`).join('\n')}
};

// Create limiters for each tier and time window
const createTierLimiters = (tier: string) => {
    const limits = TIERS[tier] || TIERS['free'];
    
    return {
        minute: rateLimit({
            windowMs: 60 * 1000,
            max: limits.minute,
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req: any) => \`\${req.user?.id || req.ip}:minute\`,
        }),
        hour: rateLimit({
            windowMs: 60 * 60 * 1000,
            max: limits.hour,
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req: any) => \`\${req.user?.id || req.ip}:hour\`,
        }),
        day: rateLimit({
            windowMs: 24 * 60 * 60 * 1000,
            max: limits.day,
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req: any) => \`\${req.user?.id || req.ip}:day\`,
        }),
    };
};

// Middleware to apply tiered rate limiting
export const tieredRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const tier = (req as any).user?.tier || 'free';
    const limiters = createTierLimiters(tier);
    
    // Apply all limiters in sequence
    limiters.minute(req, res, (err) => {
        if (err) return next(err);
        limiters.hour(req, res, (err) => {
            if (err) return next(err);
            limiters.day(req, res, next);
        });
    });
};

// Get user's current rate limit status
export const getRateLimitStatus = (userId: string, tier: string): {
    tier: string;
    limits: typeof TIERS[string];
    remaining?: { minute: number; hour: number; day: number };
} => {
    return {
        tier,
        limits: TIERS[tier] || TIERS['free'],
        // Note: actual remaining counts require store integration
    };
};
`;
    }

    // ========================================================================
    // ENDPOINT-SPECIFIC LIMITING
    // ========================================================================

    generateEndpointLimiters(endpoints: RateLimitEndpoint[]): string {
        return `import rateLimit from 'express-rate-limit';
import { Router } from 'express';

// Endpoint-specific rate limiters
${endpoints.map(ep => `
const ${this.endpointToVarName(ep)}Limiter = rateLimit({
    windowMs: ${ep.windowMs},
    max: ${ep.limit},
    message: { error: 'Rate limit exceeded for ${ep.method} ${ep.path}' },
    standardHeaders: true,
    legacyHeaders: false,
});`).join('\n')}

// Apply to router
export const applyRateLimiters = (router: Router) => {
${endpoints.map(ep => `    router.${ep.method.toLowerCase()}('${ep.path}', ${this.endpointToVarName(ep)}Limiter);`).join('\n')}
};

// Or use as middleware mapping
export const rateLimiters = {
${endpoints.map(ep => `    '${ep.method} ${ep.path}': ${this.endpointToVarName(ep)}Limiter,`).join('\n')}
};
`;
    }

    private endpointToVarName(ep: RateLimitEndpoint): string {
        return ep.method.toLowerCase() + ep.path.replace(/[/:]/g, '_').replace(/_+/g, '_');
    }

    // ========================================================================
    // TOKEN BUCKET
    // ========================================================================

    generateTokenBucket(): string {
        return `/**
 * Token Bucket Rate Limiter
 * 
 * Allows burst traffic while maintaining average rate.
 */

interface TokenBucket {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number; // tokens per second
}

class TokenBucketLimiter {
    private buckets: Map<string, TokenBucket> = new Map();
    private capacity: number;
    private refillRate: number;

    constructor(options: { capacity: number; refillRate: number }) {
        this.capacity = options.capacity;
        this.refillRate = options.refillRate;
    }

    private getBucket(key: string): TokenBucket {
        if (!this.buckets.has(key)) {
            this.buckets.set(key, {
                tokens: this.capacity,
                lastRefill: Date.now(),
                capacity: this.capacity,
                refillRate: this.refillRate,
            });
        }
        return this.buckets.get(key)!;
    }

    private refillTokens(bucket: TokenBucket): void {
        const now = Date.now();
        const elapsed = (now - bucket.lastRefill) / 1000;
        const tokensToAdd = elapsed * bucket.refillRate;
        
        bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }

    consume(key: string, tokens = 1): { allowed: boolean; remaining: number; resetIn: number } {
        const bucket = this.getBucket(key);
        this.refillTokens(bucket);

        if (bucket.tokens >= tokens) {
            bucket.tokens -= tokens;
            return {
                allowed: true,
                remaining: Math.floor(bucket.tokens),
                resetIn: 0,
            };
        }

        const tokensNeeded = tokens - bucket.tokens;
        const resetIn = Math.ceil(tokensNeeded / bucket.refillRate * 1000);

        return {
            allowed: false,
            remaining: 0,
            resetIn,
        };
    }

    // Express middleware
    middleware() {
        return (req: any, res: any, next: any) => {
            const key = req.ip || 'anonymous';
            const result = this.consume(key);

            res.setHeader('X-RateLimit-Remaining', result.remaining);
            
            if (!result.allowed) {
                res.setHeader('Retry-After', Math.ceil(result.resetIn / 1000));
                return res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter: result.resetIn,
                });
            }

            next();
        };
    }
}

export const tokenBucketLimiter = new TokenBucketLimiter({
    capacity: 100, // Maximum burst
    refillRate: 10, // 10 tokens per second = 600 per minute
});

// Usage: app.use(tokenBucketLimiter.middleware());
`;
    }

    // ========================================================================
    // SLIDING WINDOW
    // ========================================================================

    generateSlidingWindow(): string {
        return `/**
 * Sliding Window Rate Limiter
 * 
 * More accurate than fixed window, prevents edge-case bursts.
 */

interface WindowRecord {
    timestamp: number;
    count: number;
}

class SlidingWindowLimiter {
    private windows: Map<string, WindowRecord[]> = new Map();
    private windowSize: number;
    private maxRequests: number;

    constructor(options: { windowMs: number; maxRequests: number }) {
        this.windowSize = options.windowMs;
        this.maxRequests = options.maxRequests;
    }

    private cleanOldRecords(key: string): WindowRecord[] {
        const now = Date.now();
        const cutoff = now - this.windowSize;
        
        let records = this.windows.get(key) || [];
        records = records.filter(r => r.timestamp > cutoff);
        this.windows.set(key, records);
        
        return records;
    }

    check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
        const records = this.cleanOldRecords(key);
        const totalCount = records.reduce((sum, r) => sum + r.count, 0);
        const remaining = Math.max(0, this.maxRequests - totalCount);

        if (totalCount >= this.maxRequests) {
            const oldestRecord = records[0];
            const resetIn = oldestRecord ? (oldestRecord.timestamp + this.windowSize - Date.now()) : this.windowSize;
            
            return { allowed: false, remaining: 0, resetIn };
        }

        // Add new record
        records.push({ timestamp: Date.now(), count: 1 });

        return { allowed: true, remaining: remaining - 1, resetIn: 0 };
    }

    middleware() {
        return (req: any, res: any, next: any) => {
            const key = req.ip || 'anonymous';
            const result = this.check(key);

            res.setHeader('X-RateLimit-Limit', this.maxRequests);
            res.setHeader('X-RateLimit-Remaining', result.remaining);

            if (!result.allowed) {
                res.setHeader('Retry-After', Math.ceil(result.resetIn / 1000));
                return res.status(429).json({
                    error: 'Too Many Requests',
                    retryAfter: result.resetIn,
                });
            }

            next();
        };
    }
}

export const slidingWindowLimiter = new SlidingWindowLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
});

// Usage: app.use(slidingWindowLimiter.middleware());
`;
    }
}

export const rateLimiterGenerator = RateLimiterGenerator.getInstance();
