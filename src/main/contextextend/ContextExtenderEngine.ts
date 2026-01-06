/**
 * Context Extender - Extended context window
 */
import { EventEmitter } from 'events';

export interface ContextChunk { id: string; content: string; tokens: number; relevance: number; position: number; }
export interface ExtendedContext { id: string; chunks: ContextChunk[]; totalTokens: number; maxTokens: number; compression: number; }

export class ContextExtenderEngine extends EventEmitter {
    private static instance: ContextExtenderEngine;
    private contexts: Map<string, ExtendedContext> = new Map();
    private maxTokens = 128000;
    private constructor() { super(); }
    static getInstance(): ContextExtenderEngine { if (!ContextExtenderEngine.instance) ContextExtenderEngine.instance = new ContextExtenderEngine(); return ContextExtenderEngine.instance; }

    create(maxTokens = 128000): ExtendedContext { const ctx: ExtendedContext = { id: `ctx_${Date.now()}`, chunks: [], totalTokens: 0, maxTokens, compression: 1.0 }; this.contexts.set(ctx.id, ctx); return ctx; }

    async addChunk(contextId: string, content: string, relevance = 1.0): Promise<ContextChunk | null> {
        const ctx = this.contexts.get(contextId); if (!ctx) return null;
        const tokens = Math.ceil(content.length / 4);
        if (ctx.totalTokens + tokens > ctx.maxTokens) { await this.compress(contextId); }
        const chunk: ContextChunk = { id: `chunk_${Date.now()}`, content, tokens, relevance, position: ctx.chunks.length };
        ctx.chunks.push(chunk); ctx.totalTokens += tokens;
        this.emit('chunkAdded', { contextId, chunk }); return chunk;
    }

    async compress(contextId: string): Promise<number> { const ctx = this.contexts.get(contextId); if (!ctx) return 0; ctx.chunks = ctx.chunks.filter(c => c.relevance > 0.5).slice(-100); ctx.totalTokens = ctx.chunks.reduce((s, c) => s + c.tokens, 0); ctx.compression = 0.5; return ctx.totalTokens; }
    get(contextId: string): ExtendedContext | null { return this.contexts.get(contextId) || null; }
    getMaxTokens(): number { return this.maxTokens; }
}
export function getContextExtenderEngine(): ContextExtenderEngine { return ContextExtenderEngine.getInstance(); }
