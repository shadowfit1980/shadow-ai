/**
 * Code Snippet Library
 * 
 * Save, organize, and reuse code snippets.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface Snippet {
    id: string;
    name: string;
    language: string;
    code: string;
    description?: string;
    tags: string[];
    usageCount: number;
    createdAt: number;
    updatedAt: number;
}

export class CodeSnippetLibrary extends EventEmitter {
    private static instance: CodeSnippetLibrary;
    private snippets: Map<string, Snippet> = new Map();
    private storagePath: string;

    private constructor() {
        super();
        this.storagePath = path.join(homedir(), '.shadow-ai', 'snippets.json');
        this.loadSnippets();
    }

    static getInstance(): CodeSnippetLibrary {
        if (!CodeSnippetLibrary.instance) {
            CodeSnippetLibrary.instance = new CodeSnippetLibrary();
        }
        return CodeSnippetLibrary.instance;
    }

    private loadSnippets(): void {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
                for (const s of data) this.snippets.set(s.id, s);
            }
        } catch (e) { /* ignore */ }
    }

    private saveSnippets(): void {
        try {
            fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
            fs.writeFileSync(this.storagePath, JSON.stringify(Array.from(this.snippets.values()), null, 2));
        } catch (e) { /* ignore */ }
    }

    add(name: string, language: string, code: string, tags: string[] = [], description?: string): Snippet {
        const id = `snip-${Date.now()}`;
        const snippet: Snippet = { id, name, language, code, description, tags, usageCount: 0, createdAt: Date.now(), updatedAt: Date.now() };
        this.snippets.set(id, snippet);
        this.saveSnippets();
        this.emit('snippet:added', snippet);
        return snippet;
    }

    get(id: string): Snippet | undefined {
        const snippet = this.snippets.get(id);
        if (snippet) {
            snippet.usageCount++;
            snippet.updatedAt = Date.now();
            this.saveSnippets();
        }
        return snippet;
    }

    search(query: string): Snippet[] {
        const q = query.toLowerCase();
        return Array.from(this.snippets.values()).filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.tags.some(t => t.toLowerCase().includes(q)) ||
            s.code.toLowerCase().includes(q)
        );
    }

    getByLanguage(language: string): Snippet[] {
        return Array.from(this.snippets.values()).filter(s => s.language === language);
    }

    getByTags(tags: string[]): Snippet[] {
        return Array.from(this.snippets.values()).filter(s => tags.some(t => s.tags.includes(t)));
    }

    getMostUsed(limit = 10): Snippet[] {
        return Array.from(this.snippets.values()).sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
    }

    update(id: string, updates: Partial<Omit<Snippet, 'id' | 'createdAt'>>): Snippet | null {
        const snippet = this.snippets.get(id);
        if (!snippet) return null;
        Object.assign(snippet, updates, { updatedAt: Date.now() });
        this.saveSnippets();
        return snippet;
    }

    delete(id: string): boolean {
        const deleted = this.snippets.delete(id);
        if (deleted) this.saveSnippets();
        return deleted;
    }

    getAll(): Snippet[] {
        return Array.from(this.snippets.values());
    }
}

export const codeSnippetLibrary = CodeSnippetLibrary.getInstance();
