/**
 * Clipboard Manager
 * Clipboard history and operations
 */

import { EventEmitter } from 'events';
import { clipboard } from 'electron';

export interface ClipboardEntry {
    id: string;
    content: string;
    type: 'text' | 'html' | 'image';
    timestamp: number;
}

/**
 * ClipboardManager
 * Manage clipboard history
 */
export class ClipboardManager extends EventEmitter {
    private static instance: ClipboardManager;
    private history: ClipboardEntry[] = [];
    private maxHistory = 50;

    private constructor() {
        super();
    }

    static getInstance(): ClipboardManager {
        if (!ClipboardManager.instance) {
            ClipboardManager.instance = new ClipboardManager();
        }
        return ClipboardManager.instance;
    }

    copy(content: string): void {
        clipboard.writeText(content);
        this.addToHistory(content, 'text');
        this.emit('copied', { content });
    }

    paste(): string {
        return clipboard.readText();
    }

    private addToHistory(content: string, type: ClipboardEntry['type']): void {
        const entry: ClipboardEntry = {
            id: `clip_${Date.now()}`,
            content,
            type,
            timestamp: Date.now(),
        };

        this.history.unshift(entry);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }

    getHistory(limit = 20): ClipboardEntry[] {
        return this.history.slice(0, limit);
    }

    clearHistory(): void {
        this.history = [];
        this.emit('historyCleared');
    }

    getFromHistory(id: string): ClipboardEntry | null {
        return this.history.find(e => e.id === id) || null;
    }

    copyFromHistory(id: string): boolean {
        const entry = this.getFromHistory(id);
        if (!entry) return false;
        clipboard.writeText(entry.content);
        return true;
    }
}

export function getClipboardManager(): ClipboardManager {
    return ClipboardManager.getInstance();
}
