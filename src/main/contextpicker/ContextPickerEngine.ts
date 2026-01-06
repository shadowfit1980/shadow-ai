/**
 * Context Picker - Select relevant context
 */
import { EventEmitter } from 'events';

export interface ContextItem { id: string; type: 'file' | 'folder' | 'symbol' | 'snippet' | 'url' | 'docs'; path: string; content?: string; relevance: number; }
export interface ContextSelection { id: string; items: ContextItem[]; totalTokens: number; }

export class ContextPickerEngine extends EventEmitter {
    private static instance: ContextPickerEngine;
    private selections: Map<string, ContextSelection> = new Map();
    private maxTokens = 100000;
    private constructor() { super(); }
    static getInstance(): ContextPickerEngine { if (!ContextPickerEngine.instance) ContextPickerEngine.instance = new ContextPickerEngine(); return ContextPickerEngine.instance; }

    createSelection(): ContextSelection { const sel: ContextSelection = { id: `ctx_${Date.now()}`, items: [], totalTokens: 0 }; this.selections.set(sel.id, sel); return sel; }

    addItem(selectionId: string, item: Omit<ContextItem, 'id' | 'relevance'>): ContextItem | null {
        const sel = this.selections.get(selectionId); if (!sel) return null;
        const tokens = (item.content?.length || 0) / 4;
        if (sel.totalTokens + tokens > this.maxTokens) return null;
        const ctxItem: ContextItem = { id: `item_${Date.now()}`, ...item, relevance: 1 - sel.items.length * 0.1 };
        sel.items.push(ctxItem); sel.totalTokens += tokens;
        this.emit('added', { selectionId, item: ctxItem }); return ctxItem;
    }

    removeItem(selectionId: string, itemId: string): boolean { const sel = this.selections.get(selectionId); if (!sel) return false; const idx = sel.items.findIndex(i => i.id === itemId); if (idx === -1) return false; const removed = sel.items.splice(idx, 1)[0]; sel.totalTokens -= (removed.content?.length || 0) / 4; return true; }
    autoSelect(query: string, available: Omit<ContextItem, 'id' | 'relevance'>[]): ContextItem[] { return available.slice(0, 5).map((a, i) => ({ id: `auto_${i}`, ...a, relevance: 1 - i * 0.15 })); }
    get(selectionId: string): ContextSelection | null { return this.selections.get(selectionId) || null; }
}
export function getContextPickerEngine(): ContextPickerEngine { return ContextPickerEngine.getInstance(); }
