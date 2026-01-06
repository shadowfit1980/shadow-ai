/**
 * Notepads Manager - Context notepads
 */
import { EventEmitter } from 'events';

export interface Notepad { id: string; name: string; content: string; tags: string[]; createdAt: number; updatedAt: number; }

export class NotepadsManager extends EventEmitter {
    private static instance: NotepadsManager;
    private notepads: Map<string, Notepad> = new Map();
    private constructor() { super(); }
    static getInstance(): NotepadsManager { if (!NotepadsManager.instance) NotepadsManager.instance = new NotepadsManager(); return NotepadsManager.instance; }

    create(name: string, content = ''): Notepad {
        const notepad: Notepad = { id: `np_${Date.now()}`, name, content, tags: [], createdAt: Date.now(), updatedAt: Date.now() };
        this.notepads.set(notepad.id, notepad); this.emit('created', notepad); return notepad;
    }

    update(id: string, content: string): boolean { const n = this.notepads.get(id); if (!n) return false; n.content = content; n.updatedAt = Date.now(); return true; }
    addTag(id: string, tag: string): boolean { const n = this.notepads.get(id); if (!n) return false; if (!n.tags.includes(tag)) n.tags.push(tag); return true; }
    search(query: string): Notepad[] { const q = query.toLowerCase(); return Array.from(this.notepads.values()).filter(n => n.name.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)); }
    getByTag(tag: string): Notepad[] { return Array.from(this.notepads.values()).filter(n => n.tags.includes(tag)); }
    delete(id: string): boolean { return this.notepads.delete(id); }
    getAll(): Notepad[] { return Array.from(this.notepads.values()); }
}
export function getNotepadsManager(): NotepadsManager { return NotepadsManager.getInstance(); }
