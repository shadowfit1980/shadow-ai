/**
 * Local History - File version history
 */
import { EventEmitter } from 'events';

export interface HistoryEntry { id: string; file: string; content: string; timestamp: number; label?: string; }

export class LocalHistory extends EventEmitter {
    private static instance: LocalHistory;
    private history: Map<string, HistoryEntry[]> = new Map();
    private maxEntries = 50;
    private constructor() { super(); }
    static getInstance(): LocalHistory { if (!LocalHistory.instance) LocalHistory.instance = new LocalHistory(); return LocalHistory.instance; }

    save(file: string, content: string, label?: string): HistoryEntry {
        const entry: HistoryEntry = { id: `hist_${Date.now()}`, file, content, timestamp: Date.now(), label };
        const entries = this.history.get(file) || [];
        entries.unshift(entry);
        if (entries.length > this.maxEntries) entries.pop();
        this.history.set(file, entries); this.emit('saved', entry); return entry;
    }

    getHistory(file: string): HistoryEntry[] { return this.history.get(file) || []; }
    restore(file: string, entryId: string): string | null { const entries = this.history.get(file); const entry = entries?.find(e => e.id === entryId); return entry?.content || null; }
    diff(file: string, entryId1: string, entryId2: string): { added: number; removed: number } { const e1 = this.history.get(file)?.find(e => e.id === entryId1); const e2 = this.history.get(file)?.find(e => e.id === entryId2); if (!e1 || !e2) return { added: 0, removed: 0 }; return { added: e2.content.length - e1.content.length, removed: e1.content.length - e2.content.length }; }
    clear(file: string): void { this.history.delete(file); }
}
export function getLocalHistory(): LocalHistory { return LocalHistory.getInstance(); }
