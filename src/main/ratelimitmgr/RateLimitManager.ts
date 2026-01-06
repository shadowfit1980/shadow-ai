/**
 * Rate Limit Manager - Request throttling
 */
import { EventEmitter } from 'events';

export interface RateLimitConfig { endpoint: string; requestsPerMinute: number; requestsPerHour: number; tokensPerMinute: number; }
export interface RateLimitState { endpoint: string; minuteRequests: number; hourRequests: number; minuteTokens: number; windowStart: number; }

export class RateLimitManager extends EventEmitter {
    private static instance: RateLimitManager;
    private configs: Map<string, RateLimitConfig> = new Map();
    private states: Map<string, RateLimitState> = new Map();
    private constructor() { super(); }
    static getInstance(): RateLimitManager { if (!RateLimitManager.instance) RateLimitManager.instance = new RateLimitManager(); return RateLimitManager.instance; }

    configure(endpoint: string, rpm: number, rph: number, tpm: number): void { this.configs.set(endpoint, { endpoint, requestsPerMinute: rpm, requestsPerHour: rph, tokensPerMinute: tpm }); this.states.set(endpoint, { endpoint, minuteRequests: 0, hourRequests: 0, minuteTokens: 0, windowStart: Date.now() }); }

    check(endpoint: string, tokens: number): { allowed: boolean; retryAfter?: number } {
        const config = this.configs.get(endpoint); const state = this.states.get(endpoint);
        if (!config || !state) return { allowed: true };
        if (Date.now() - state.windowStart > 60000) { state.minuteRequests = 0; state.minuteTokens = 0; state.windowStart = Date.now(); }
        if (state.minuteRequests >= config.requestsPerMinute || state.minuteTokens + tokens > config.tokensPerMinute) { this.emit('limited', endpoint); return { allowed: false, retryAfter: 60 - Math.floor((Date.now() - state.windowStart) / 1000) }; }
        state.minuteRequests++; state.hourRequests++; state.minuteTokens += tokens;
        return { allowed: true };
    }

    getState(endpoint: string): RateLimitState | null { return this.states.get(endpoint) || null; }
    resetAll(): void { this.states.forEach(s => { s.minuteRequests = 0; s.hourRequests = 0; s.minuteTokens = 0; }); }
}
export function getRateLimitManager(): RateLimitManager { return RateLimitManager.getInstance(); }
