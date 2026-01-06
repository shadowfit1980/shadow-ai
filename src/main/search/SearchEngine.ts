/**
 * Search Engine
 * Full-text search across content
 */

import { EventEmitter } from 'events';

export interface SearchResult {
    id: string;
    content: string;
    score: number;
    matches: string[];
    metadata?: Record<string, any>;
}

export interface IndexedDocument {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}

/**
 * SearchEngine
 * Full-text search
 */
export class SearchEngine extends EventEmitter {
    private static instance: SearchEngine;
    private documents: Map<string, IndexedDocument> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): SearchEngine {
        if (!SearchEngine.instance) {
            SearchEngine.instance = new SearchEngine();
        }
        return SearchEngine.instance;
    }

    index(doc: IndexedDocument): void {
        this.documents.set(doc.id, doc);
        this.emit('indexed', { id: doc.id });
    }

    remove(id: string): boolean {
        return this.documents.delete(id);
    }

    search(query: string, limit = 20): SearchResult[] {
        const results: SearchResult[] = [];
        const terms = query.toLowerCase().split(/\s+/);

        for (const doc of this.documents.values()) {
            const content = doc.content.toLowerCase();
            const matches: string[] = [];
            let score = 0;

            for (const term of terms) {
                if (content.includes(term)) {
                    matches.push(term);
                    score += (content.match(new RegExp(term, 'g')) || []).length;
                }
            }

            if (matches.length > 0) {
                results.push({
                    id: doc.id,
                    content: doc.content.slice(0, 200),
                    score,
                    matches,
                    metadata: doc.metadata,
                });
            }
        }

        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    getAll(): IndexedDocument[] {
        return Array.from(this.documents.values());
    }

    clear(): void {
        this.documents.clear();
        this.emit('cleared');
    }

    getStats(): { count: number } {
        return { count: this.documents.size };
    }
}

export function getSearchEngine(): SearchEngine {
    return SearchEngine.getInstance();
}
