/**
 * Rate Limiter - API throttling
 */
import { EventEmitter } from 'events';

export interface RateLimitConfig { endpoint: string; limit: number; window: number; }
export interface RateLimitState { endpoint: string; remaining: number; reset: number; }

export class RateLimiterEngine extends EventEmitter {
    private static instance: RateLimiterEngine;
    private configs: Map<string, RateLimitConfig> = new Map();
    private states: Map<string, { count: number; reset: number }> = new Map();
    private constructor() { super(); }
    static getInstance(): RateLimiterEngine { if (!RateLimiterEngine.instance) RateLimiterEngine.instance = new RateLimiterEngine(); return RateLimiterEngine.instance; }

    configure(endpoint: string, limit = 100, window = 60000): void { this.configs.set(endpoint, { endpoint, limit, window }); }

    check(endpoint: string): RateLimitState {
        const config = this.configs.get(endpoint) || { endpoint, limit: 100, window: 60000 };
        const now = Date.now();
        let state = this.states.get(endpoint);
        if (!state || now > state.reset) { state = { count: 0, reset: now + config.window }; this.states.set(endpoint, state); }
        return { endpoint, remaining: Math.max(0, config.limit - state.count), reset: state.reset };
    }

    consume(endpoint: string): boolean { const state = this.check(endpoint); if (state.remaining <= 0) { this.emit('limited', endpoint); return false; } const s = this.states.get(endpoint)!; s.count++; return true; }
    reset(endpoint: string): void { this.states.delete(endpoint); }
    getConfigs(): RateLimitConfig[] { return Array.from(this.configs.values()); }
}
export function getRateLimiterEngine(): RateLimiterEngine { return RateLimiterEngine.getInstance(); }
