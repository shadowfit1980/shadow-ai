/**
 * Tokenizer
 * Text tokenization for AI
 */

import { EventEmitter } from 'events';

export interface TokenizeResult {
    tokens: string[];
    count: number;
    estimatedCost?: number;
}

export class Tokenizer extends EventEmitter {
    private static instance: Tokenizer;

    private constructor() { super(); }

    static getInstance(): Tokenizer {
        if (!Tokenizer.instance) Tokenizer.instance = new Tokenizer();
        return Tokenizer.instance;
    }

    tokenize(text: string): TokenizeResult {
        // Simple word-based tokenization (GPT uses BPE, this is approximate)
        const tokens = text.split(/\s+/).filter(t => t.length > 0);
        const count = Math.ceil(text.length / 4); // Rough estimate: ~4 chars per token
        return { tokens, count, estimatedCost: count * 0.00001 };
    }

    countTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    truncate(text: string, maxTokens: number): string {
        const estimated = this.countTokens(text);
        if (estimated <= maxTokens) return text;
        const ratio = maxTokens / estimated;
        return text.slice(0, Math.floor(text.length * ratio));
    }

    split(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        let current = '';
        for (const word of text.split(/\s+/)) {
            if (this.countTokens(current + ' ' + word) > chunkSize) {
                chunks.push(current.trim());
                current = word;
            } else {
                current += ' ' + word;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }
}

export function getTokenizer(): Tokenizer { return Tokenizer.getInstance(); }
