/**
 * Snippet Manager - Code snippets library
 */
import { EventEmitter } from 'events';

export interface Snippet { id: string; name: string; language: string; code: string; description?: string; tags: string[]; createdAt: number; }

export class SnippetManager extends EventEmitter {
    private static instance: SnippetManager;
    private snippets: Map<string, Snippet> = new Map();
    private constructor() { super(); }
    static getInstance(): SnippetManager { if (!SnippetManager.instance) SnippetManager.instance = new SnippetManager(); return SnippetManager.instance; }

    add(name: string, language: string, code: string, tags: string[] = []): Snippet {
        const snippet: Snippet = { id: `snip_${Date.now()}`, name, language, code, tags, createdAt: Date.now() };
        this.snippets.set(snippet.id, snippet);
        this.emit('added', snippet);
        return snippet;
    }

    get(id: string): Snippet | null { return this.snippets.get(id) || null; }
    delete(id: string): boolean { return this.snippets.delete(id); }
    getAll(): Snippet[] { return Array.from(this.snippets.values()); }
    getByLanguage(lang: string): Snippet[] { return this.getAll().filter(s => s.language === lang); }
    search(query: string): Snippet[] { const q = query.toLowerCase(); return this.getAll().filter(s => s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q))); }
}

export function getSnippetManager(): SnippetManager { return SnippetManager.getInstance(); }
