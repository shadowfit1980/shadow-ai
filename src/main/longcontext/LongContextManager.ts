/**
 * Long Context Manager - 200K+ token context
 */
import { EventEmitter } from 'events';

export interface ContextWindow { id: string; tokens: number; maxTokens: number; content: { role: string; content: string; tokens: number }[]; }

export class LongContextManager extends EventEmitter {
    private static instance: LongContextManager;
    private windows: Map<string, ContextWindow> = new Map();
    private maxTokens = 200000;
    private constructor() { super(); }
    static getInstance(): LongContextManager { if (!LongContextManager.instance) LongContextManager.instance = new LongContextManager(); return LongContextManager.instance; }

    create(maxTokens = 200000): ContextWindow {
        const window: ContextWindow = { id: `ctx_${Date.now()}`, tokens: 0, maxTokens, content: [] };
        this.windows.set(window.id, window);
        return window;
    }

    add(windowId: string, role: string, content: string): boolean {
        const w = this.windows.get(windowId); if (!w) return false;
        const tokens = Math.ceil(content.length / 4);
        if (w.tokens + tokens > w.maxTokens) { this.emit('overflow', w); return false; }
        w.content.push({ role, content, tokens });
        w.tokens += tokens;
        return true;
    }

    getUsage(windowId: string): { used: number; max: number; percentage: number } | null { const w = this.windows.get(windowId); if (!w) return null; return { used: w.tokens, max: w.maxTokens, percentage: (w.tokens / w.maxTokens) * 100 }; }
    truncate(windowId: string, keepLast: number): void { const w = this.windows.get(windowId); if (w) { w.content = w.content.slice(-keepLast); w.tokens = w.content.reduce((s, c) => s + c.tokens, 0); } }
    get(windowId: string): ContextWindow | null { return this.windows.get(windowId) || null; }
}
export function getLongContextManager(): LongContextManager { return LongContextManager.getInstance(); }
