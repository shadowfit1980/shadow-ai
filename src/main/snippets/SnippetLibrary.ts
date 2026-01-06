/**
 * Snippet Library
 * Voice and text shortcuts for common phrases
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Snippet {
    id: string;
    trigger: string;
    content: string;
    description?: string;
    category: string;
    variables: SnippetVariable[];
    usageCount: number;
    createdAt: number;
    updatedAt: number;
}

export interface SnippetVariable {
    name: string;
    defaultValue?: string;
    description?: string;
}

/**
 * SnippetLibrary
 * Manage reusable text snippets
 */
export class SnippetLibrary extends EventEmitter {
    private static instance: SnippetLibrary;
    private snippets: Map<string, Snippet> = new Map();
    private dataPath: string;

    private constructor() {
        super();
        this.dataPath = path.join(process.cwd(), 'snippets.json');
        this.initDefaultSnippets();
    }

    static getInstance(): SnippetLibrary {
        if (!SnippetLibrary.instance) {
            SnippetLibrary.instance = new SnippetLibrary();
        }
        return SnippetLibrary.instance;
    }

    /**
     * Initialize default snippets
     */
    private initDefaultSnippets(): void {
        const defaults: Omit<Snippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
            {
                trigger: '/thanks',
                content: 'Thank you for your time and consideration. Please let me know if you have any questions.',
                category: 'email',
                variables: [],
            },
            {
                trigger: '/meeting',
                content: 'Meeting scheduled for {{date}} at {{time}}. Agenda: {{agenda}}',
                category: 'email',
                variables: [
                    { name: 'date', defaultValue: 'Monday' },
                    { name: 'time', defaultValue: '10:00 AM' },
                    { name: 'agenda', defaultValue: 'TBD' },
                ],
            },
            {
                trigger: '/signoff',
                content: 'Best regards,\n{{name}}',
                category: 'email',
                variables: [{ name: 'name', defaultValue: 'Your Name' }],
            },
            {
                trigger: '/todo',
                content: '// TODO: {{description}}',
                category: 'code',
                variables: [{ name: 'description' }],
            },
            {
                trigger: '/fixme',
                content: '// FIXME: {{issue}}',
                category: 'code',
                variables: [{ name: 'issue' }],
            },
            {
                trigger: '/console',
                content: 'console.log("{{message}}", {{variable}});',
                category: 'code',
                variables: [
                    { name: 'message', defaultValue: 'Debug' },
                    { name: 'variable', defaultValue: 'data' },
                ],
            },
            {
                trigger: '/func',
                content: 'function {{name}}({{params}}) {\n  {{body}}\n}',
                category: 'code',
                variables: [
                    { name: 'name', defaultValue: 'myFunction' },
                    { name: 'params', defaultValue: '' },
                    { name: 'body', defaultValue: '// TODO' },
                ],
            },
            {
                trigger: '/async',
                content: 'async function {{name}}({{params}}) {\n  try {\n    {{body}}\n  } catch (error) {\n    console.error(error);\n  }\n}',
                category: 'code',
                variables: [
                    { name: 'name', defaultValue: 'myAsyncFunction' },
                    { name: 'params', defaultValue: '' },
                    { name: 'body', defaultValue: '// TODO' },
                ],
            },
        ];

        for (const snippet of defaults) {
            this.create(snippet);
        }
    }

    /**
     * Load snippets from disk
     */
    async load(): Promise<void> {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            const json = JSON.parse(data);
            this.snippets = new Map(json.snippets || []);
            this.emit('loaded', { count: this.snippets.size });
        } catch {
            // File doesn't exist
        }
    }

    /**
     * Save snippets to disk
     */
    async save(): Promise<void> {
        const data = {
            snippets: Array.from(this.snippets.entries()),
            savedAt: Date.now(),
        };
        await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        this.emit('saved');
    }

    /**
     * Create a snippet
     */
    create(data: Omit<Snippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Snippet {
        const id = `snippet_${Date.now()}`;
        const snippet: Snippet = {
            ...data,
            id,
            usageCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.snippets.set(id, snippet);
        this.emit('created', snippet);
        return snippet;
    }

    /**
     * Get snippet by ID
     */
    get(id: string): Snippet | null {
        return this.snippets.get(id) || null;
    }

    /**
     * Get snippet by trigger
     */
    getByTrigger(trigger: string): Snippet | null {
        for (const snippet of this.snippets.values()) {
            if (snippet.trigger === trigger) {
                return snippet;
            }
        }
        return null;
    }

    /**
     * Expand snippet with variables
     */
    expand(snippetId: string, variables: Record<string, string> = {}): string {
        const snippet = this.snippets.get(snippetId);
        if (!snippet) return '';

        let content = snippet.content;

        for (const variable of snippet.variables) {
            const value = variables[variable.name] || variable.defaultValue || '';
            content = content.replace(new RegExp(`{{${variable.name}}}`, 'g'), value);
        }

        // Update usage count
        snippet.usageCount++;
        snippet.updatedAt = Date.now();

        this.emit('expanded', { snippetId, content });
        return content;
    }

    /**
     * Expand trigger in text
     */
    expandTrigger(text: string, variables: Record<string, string> = {}): string {
        for (const snippet of this.snippets.values()) {
            if (text.includes(snippet.trigger)) {
                const expanded = this.expand(snippet.id, variables);
                text = text.replace(snippet.trigger, expanded);
            }
        }
        return text;
    }

    /**
     * Update snippet
     */
    update(id: string, data: Partial<Omit<Snippet, 'id' | 'createdAt'>>): Snippet | null {
        const snippet = this.snippets.get(id);
        if (!snippet) return null;

        Object.assign(snippet, data, { updatedAt: Date.now() });
        this.emit('updated', snippet);
        return snippet;
    }

    /**
     * Delete snippet
     */
    delete(id: string): boolean {
        const deleted = this.snippets.delete(id);
        if (deleted) {
            this.emit('deleted', { id });
        }
        return deleted;
    }

    /**
     * Get all snippets
     */
    getAll(): Snippet[] {
        return Array.from(this.snippets.values());
    }

    /**
     * Get by category
     */
    getByCategory(category: string): Snippet[] {
        return Array.from(this.snippets.values())
            .filter(s => s.category === category);
    }

    /**
     * Search snippets
     */
    search(query: string): Snippet[] {
        const lower = query.toLowerCase();
        return Array.from(this.snippets.values())
            .filter(s =>
                s.trigger.toLowerCase().includes(lower) ||
                s.content.toLowerCase().includes(lower) ||
                s.description?.toLowerCase().includes(lower)
            );
    }

    /**
     * Get categories
     */
    getCategories(): string[] {
        const categories = new Set<string>();
        for (const snippet of this.snippets.values()) {
            categories.add(snippet.category);
        }
        return Array.from(categories);
    }

    /**
     * Get top used snippets
     */
    getTopUsed(limit = 10): Snippet[] {
        return Array.from(this.snippets.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    /**
     * Import snippets
     */
    import(snippets: Snippet[]): number {
        let imported = 0;
        for (const snippet of snippets) {
            this.snippets.set(snippet.id, snippet);
            imported++;
        }
        this.emit('imported', { count: imported });
        return imported;
    }

    /**
     * Export snippets
     */
    export(): Snippet[] {
        return this.getAll();
    }
}

// Singleton getter
export function getSnippetLibrary(): SnippetLibrary {
    return SnippetLibrary.getInstance();
}
