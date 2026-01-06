/**
 * Context Window - Token management
 */
import { EventEmitter } from 'events';

export interface ContextMessage { role: 'system' | 'user' | 'assistant'; content: string; tokens: number; }
export interface ContextWindow { id: string; maxTokens: number; messages: ContextMessage[]; usedTokens: number; }

export class ContextWindowManager extends EventEmitter {
    private static instance: ContextWindowManager;
    private windows: Map<string, ContextWindow> = new Map();
    private constructor() { super(); }
    static getInstance(): ContextWindowManager { if (!ContextWindowManager.instance) ContextWindowManager.instance = new ContextWindowManager(); return ContextWindowManager.instance; }

    create(maxTokens = 4096): ContextWindow { const win: ContextWindow = { id: `ctx_${Date.now()}`, maxTokens, messages: [], usedTokens: 0 }; this.windows.set(win.id, win); return win; }

    addMessage(windowId: string, role: ContextMessage['role'], content: string): boolean {
        const win = this.windows.get(windowId); if (!win) return false;
        const tokens = Math.ceil(content.length / 4); // Approximate
        if (win.usedTokens + tokens > win.maxTokens) this.truncate(windowId, tokens);
        win.messages.push({ role, content, tokens }); win.usedTokens += tokens;
        this.emit('messageAdded', { windowId, role, tokens }); return true;
    }

    truncate(windowId: string, neededTokens: number): number {
        const win = this.windows.get(windowId); if (!win) return 0;
        let freed = 0;
        while (win.usedTokens + neededTokens > win.maxTokens && win.messages.length > 1) { const removed = win.messages.shift()!; win.usedTokens -= removed.tokens; freed += removed.tokens; }
        return freed;
    }

    getRemaining(windowId: string): number { const win = this.windows.get(windowId); return win ? win.maxTokens - win.usedTokens : 0; }
    get(windowId: string): ContextWindow | null { return this.windows.get(windowId) || null; }
}
export function getContextWindowManager(): ContextWindowManager { return ContextWindowManager.getInstance(); }
