/**
 * Context Engine - Advanced context management
 */
import { EventEmitter } from 'events';

export interface ContextWindow { id: string; tokens: number; messages: { role: string; content: string; tokens: number }[]; maxTokens: number; strategy: 'sliding' | 'summary' | 'hybrid'; }

export class ContextEngine extends EventEmitter {
    private static instance: ContextEngine;
    private windows: Map<string, ContextWindow> = new Map();
    private constructor() { super(); }
    static getInstance(): ContextEngine { if (!ContextEngine.instance) ContextEngine.instance = new ContextEngine(); return ContextEngine.instance; }

    create(maxTokens = 128000, strategy: ContextWindow['strategy'] = 'hybrid'): ContextWindow {
        const window: ContextWindow = { id: `ctx_${Date.now()}`, tokens: 0, messages: [], maxTokens, strategy };
        this.windows.set(window.id, window); return window;
    }

    add(windowId: string, role: string, content: string): boolean {
        const w = this.windows.get(windowId); if (!w) return false;
        const tokens = Math.ceil(content.length / 4);
        while (w.tokens + tokens > w.maxTokens && w.messages.length > 0) { const removed = w.messages.shift()!; w.tokens -= removed.tokens; }
        w.messages.push({ role, content, tokens }); w.tokens += tokens; this.emit('added', { windowId, tokens: w.tokens }); return true;
    }

    getMessages(windowId: string): { role: string; content: string }[] { const w = this.windows.get(windowId); return w?.messages.map(m => ({ role: m.role, content: m.content })) || []; }
    summarize(windowId: string): string { const w = this.windows.get(windowId); if (!w) return ''; return `Context with ${w.messages.length} messages, ${w.tokens} tokens`; }
    clear(windowId: string): void { const w = this.windows.get(windowId); if (w) { w.messages = []; w.tokens = 0; } }
}
export function getContextEngine(): ContextEngine { return ContextEngine.getInstance(); }
