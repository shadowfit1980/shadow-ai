/**
 * Token Counter - Accurate token counting
 */
import { EventEmitter } from 'events';

export interface TokenCount { text: string; tokens: number; model: string; estimatedCost: number; }

export class TokenCounter extends EventEmitter {
    private static instance: TokenCounter;
    private modelPricing: Record<string, { input: number; output: number }> = { 'gpt-4': { input: 0.03, output: 0.06 }, 'gpt-3.5': { input: 0.001, output: 0.002 }, 'claude-3': { input: 0.015, output: 0.075 } };
    private constructor() { super(); }
    static getInstance(): TokenCounter { if (!TokenCounter.instance) TokenCounter.instance = new TokenCounter(); return TokenCounter.instance; }

    count(text: string, model = 'gpt-4'): TokenCount {
        const tokens = Math.ceil(text.length / 4);
        const pricing = this.modelPricing[model] || { input: 0.01, output: 0.01 };
        return { text: text.slice(0, 50) + '...', tokens, model, estimatedCost: (tokens / 1000) * pricing.input };
    }

    estimateConversation(messages: { role: string; content: string }[], model = 'gpt-4'): { totalTokens: number; estimatedCost: number } {
        const pricing = this.modelPricing[model] || { input: 0.01, output: 0.01 };
        let input = 0, output = 0;
        messages.forEach(m => { const t = Math.ceil(m.content.length / 4); if (m.role === 'assistant') output += t; else input += t; });
        return { totalTokens: input + output, estimatedCost: (input / 1000) * pricing.input + (output / 1000) * pricing.output };
    }

    setPricing(model: string, input: number, output: number): void { this.modelPricing[model] = { input, output }; }
}
export function getTokenCounter(): TokenCounter { return TokenCounter.getInstance(); }
