/**
 * Rate Limiter - API rate limiting
 */
import { EventEmitter } from 'events';

export interface RateLimitRule { id: string; name: string; maxRequests: number; windowMs: number; }
export interface RateLimitState { requests: number; resetAt: number; }

export class RateLimiter extends EventEmitter {
    private static instance: RateLimiter;
    private rules: Map<string, RateLimitRule> = new Map();
    private states: Map<string, RateLimitState> = new Map();
    private constructor() { super(); }
    static getInstance(): RateLimiter { if (!RateLimiter.instance) RateLimiter.instance = new RateLimiter(); return RateLimiter.instance; }

    addRule(name: string, maxRequests: number, windowMs: number): RateLimitRule {
        const rule: RateLimitRule = { id: `rl_${Date.now()}`, name, maxRequests, windowMs };
        this.rules.set(rule.id, rule);
        return rule;
    }

    check(ruleId: string, key: string): { allowed: boolean; remaining: number; resetAt: number } {
        const rule = this.rules.get(ruleId);
        if (!rule) return { allowed: true, remaining: Infinity, resetAt: 0 };

        const stateKey = `${ruleId}:${key}`;
        let state = this.states.get(stateKey);
        const now = Date.now();

        if (!state || now > state.resetAt) {
            state = { requests: 0, resetAt: now + rule.windowMs };
            this.states.set(stateKey, state);
        }

        const allowed = state.requests < rule.maxRequests;
        if (allowed) state.requests++;
        if (!allowed) this.emit('limited', { ruleId, key });

        return { allowed, remaining: Math.max(0, rule.maxRequests - state.requests), resetAt: state.resetAt };
    }

    getRules(): RateLimitRule[] { return Array.from(this.rules.values()); }
    reset(ruleId: string, key: string): void { this.states.delete(`${ruleId}:${key}`); }
}

export function getRateLimiter(): RateLimiter { return RateLimiter.getInstance(); }
