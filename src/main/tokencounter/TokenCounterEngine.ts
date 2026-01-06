/**
 * Token Counter - Count and estimate tokens
 */
import { EventEmitter } from 'events';

export interface TokenCount { text: string; tokens: number; characters: number; words: number; estimatedCost?: number; }

export class TokenCounterEngine extends EventEmitter {
    private static instance: TokenCounterEngine;
    private tokensPerWord = 1.3;
    private constructor() { super(); }
    static getInstance(): TokenCounterEngine { if (!TokenCounterEngine.instance) TokenCounterEngine.instance = new TokenCounterEngine(); return TokenCounterEngine.instance; }

    count(text: string): TokenCount { const words = text.split(/\s+/).filter(w => w.length > 0).length; const tokens = Math.ceil(words * this.tokensPerWord); return { text: text.slice(0, 50), tokens, characters: text.length, words }; }
    countMessages(messages: { role: string; content: string }[]): { total: number; byRole: Record<string, number> } { const byRole: Record<string, number> = {}; let total = 0; messages.forEach(m => { const t = this.count(m.content).tokens + 4; byRole[m.role] = (byRole[m.role] || 0) + t; total += t; }); return { total, byRole }; }
    estimateCost(tokens: number, model: string): number { const costs: Record<string, number> = { 'gpt-4o': 0.00001, 'claude-3.5-sonnet': 0.000003, 'llama': 0 }; const costPer = costs[model] || 0; return tokens * costPer; }
    willFit(tokens: number, contextLength: number, reserveForOutput = 1000): boolean { return tokens < contextLength - reserveForOutput; }
    setTokensPerWord(ratio: number): void { this.tokensPerWord = ratio; }
}
export function getTokenCounterEngine(): TokenCounterEngine { return TokenCounterEngine.getInstance(); }
