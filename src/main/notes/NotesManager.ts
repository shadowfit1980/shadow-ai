/**
 * Notes Manager - Note-taking
 */
import { EventEmitter } from 'events';

export interface Note { id: string; title: string; content: string; tags: string[]; pinned: boolean; createdAt: number; updatedAt: number; }

export class NotesManager extends EventEmitter {
    private static instance: NotesManager;
    private notes: Map<string, Note> = new Map();
    private constructor() { super(); }
    static getInstance(): NotesManager { if (!NotesManager.instance) NotesManager.instance = new NotesManager(); return NotesManager.instance; }

    create(title: string, content: string, tags: string[] = []): Note {
        const note: Note = { id: `note_${Date.now()}`, title, content, tags, pinned: false, createdAt: Date.now(), updatedAt: Date.now() };
        this.notes.set(note.id, note);
        return note;
    }

    update(id: string, updates: Partial<Note>): Note | null { const n = this.notes.get(id); if (!n) return null; Object.assign(n, updates, { updatedAt: Date.now() }); return n; }
    pin(id: string): boolean { const n = this.notes.get(id); if (!n) return false; n.pinned = true; return true; }
    search(query: string): Note[] { const q = query.toLowerCase(); return Array.from(this.notes.values()).filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)); }
    getAll(): Note[] { return Array.from(this.notes.values()); }
    delete(id: string): boolean { return this.notes.delete(id); }
}
export function getNotesManager(): NotesManager { return NotesManager.getInstance(); }
