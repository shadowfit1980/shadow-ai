/**
 * Transcription History - History tracking
 */
import { EventEmitter } from 'events';

export interface TranscriptEntry { id: string; text: string; timestamp: number; duration: number; app?: string; edited?: string; }

export class TranscriptionHistoryManager extends EventEmitter {
    private static instance: TranscriptionHistoryManager;
    private history: TranscriptEntry[] = [];
    private maxEntries = 1000;
    private constructor() { super(); }
    static getInstance(): TranscriptionHistoryManager { if (!TranscriptionHistoryManager.instance) TranscriptionHistoryManager.instance = new TranscriptionHistoryManager(); return TranscriptionHistoryManager.instance; }

    add(text: string, duration: number, app?: string): TranscriptEntry { const entry: TranscriptEntry = { id: `tr_${Date.now()}`, text, timestamp: Date.now(), duration, app }; this.history.push(entry); if (this.history.length > this.maxEntries) this.history.shift(); this.emit('added', entry); return entry; }
    edit(entryId: string, newText: string): boolean { const e = this.history.find(h => h.id === entryId); if (!e) return false; e.edited = newText; return true; }
    search(query: string): TranscriptEntry[] { const q = query.toLowerCase(); return this.history.filter(e => e.text.toLowerCase().includes(q) || e.edited?.toLowerCase().includes(q)); }
    getByDateRange(start: number, end: number): TranscriptEntry[] { return this.history.filter(e => e.timestamp >= start && e.timestamp <= end); }
    getRecent(limit = 50): TranscriptEntry[] { return this.history.slice(-limit).reverse(); }
    getStats(): { total: number; totalDuration: number; avgLength: number } { return { total: this.history.length, totalDuration: this.history.reduce((s, e) => s + e.duration, 0), avgLength: this.history.reduce((s, e) => s + e.text.length, 0) / (this.history.length || 1) }; }
}
export function getTranscriptionHistoryManager(): TranscriptionHistoryManager { return TranscriptionHistoryManager.getInstance(); }
