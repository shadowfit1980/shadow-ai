/**
 * Bookmark Manager
 * Save and manage bookmarks
 */

import { EventEmitter } from 'events';

export interface Bookmark {
    id: string;
    title: string;
    path: string;
    type: 'file' | 'url' | 'folder';
    tags: string[];
    createdAt: number;
}

export class BookmarkManager extends EventEmitter {
    private static instance: BookmarkManager;
    private bookmarks: Map<string, Bookmark> = new Map();

    private constructor() { super(); }

    static getInstance(): BookmarkManager {
        if (!BookmarkManager.instance) BookmarkManager.instance = new BookmarkManager();
        return BookmarkManager.instance;
    }

    add(title: string, path: string, type: Bookmark['type'] = 'file', tags: string[] = []): Bookmark {
        const bookmark: Bookmark = { id: `bm_${Date.now()}`, title, path, type, tags, createdAt: Date.now() };
        this.bookmarks.set(bookmark.id, bookmark);
        this.emit('added', bookmark);
        return bookmark;
    }

    remove(id: string): boolean {
        const deleted = this.bookmarks.delete(id);
        if (deleted) this.emit('removed', { id });
        return deleted;
    }

    getAll(): Bookmark[] { return Array.from(this.bookmarks.values()); }

    getByTag(tag: string): Bookmark[] { return this.getAll().filter(b => b.tags.includes(tag)); }

    search(query: string): Bookmark[] {
        const q = query.toLowerCase();
        return this.getAll().filter(b => b.title.toLowerCase().includes(q) || b.path.toLowerCase().includes(q));
    }

    addTag(id: string, tag: string): boolean {
        const bm = this.bookmarks.get(id);
        if (!bm || bm.tags.includes(tag)) return false;
        bm.tags.push(tag);
        return true;
    }
}

export function getBookmarkManager(): BookmarkManager { return BookmarkManager.getInstance(); }
