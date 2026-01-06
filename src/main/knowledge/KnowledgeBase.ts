/**
 * Knowledge Base
 * Enterprise knowledge management with RAG (Retrieval-Augmented Generation)
 * Similar to Cognigy Knowledge AI
 */

import { EventEmitter } from 'events';
import Store from 'electron-store';

export interface KnowledgeDocument {
    id: string;
    title: string;
    content: string;
    source: string;
    category?: string;
    tags: string[];
    embedding?: number[];
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface KnowledgeChunk {
    id: string;
    documentId: string;
    content: string;
    embedding?: number[];
    startIndex: number;
    endIndex: number;
}

export interface SearchResult {
    document: KnowledgeDocument;
    chunk?: KnowledgeChunk;
    score: number;
    highlight?: string;
}

export interface KnowledgeSource {
    id: string;
    type: 'file' | 'url' | 'api' | 'database';
    name: string;
    config: Record<string, any>;
    syncSchedule?: string;
    lastSync?: number;
}

/**
 * KnowledgeBase
 * Enterprise knowledge management system
 */
export class KnowledgeBase extends EventEmitter {
    private static instance: KnowledgeBase;
    private store: Store;
    private documents: Map<string, KnowledgeDocument> = new Map();
    private chunks: Map<string, KnowledgeChunk[]> = new Map();
    private sources: Map<string, KnowledgeSource> = new Map();
    private docCounter = 0;

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-knowledge' });
        this.loadKnowledge();
    }

    static getInstance(): KnowledgeBase {
        if (!KnowledgeBase.instance) {
            KnowledgeBase.instance = new KnowledgeBase();
        }
        return KnowledgeBase.instance;
    }

    /**
     * Add document to knowledge base
     */
    async addDocument(options: {
        title: string;
        content: string;
        source: string;
        category?: string;
        tags?: string[];
        metadata?: Record<string, any>;
    }): Promise<KnowledgeDocument> {
        const id = `doc_${++this.docCounter}_${Date.now()}`;
        const now = Date.now();

        const document: KnowledgeDocument = {
            id,
            title: options.title,
            content: options.content,
            source: options.source,
            category: options.category,
            tags: options.tags || [],
            metadata: options.metadata || {},
            createdAt: now,
            updatedAt: now,
        };

        // Generate chunks for longer documents
        const docChunks = this.chunkDocument(document);
        this.chunks.set(id, docChunks);

        this.documents.set(id, document);
        await this.persist();

        this.emit('documentAdded', document);
        return document;
    }

    /**
     * Get document by ID
     */
    getDocument(id: string): KnowledgeDocument | null {
        return this.documents.get(id) || null;
    }

    /**
     * Update document
     */
    async updateDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument | null> {
        const doc = this.documents.get(id);
        if (!doc) return null;

        Object.assign(doc, updates, { id, updatedAt: Date.now() });

        // Re-chunk if content changed
        if (updates.content) {
            const docChunks = this.chunkDocument(doc);
            this.chunks.set(id, docChunks);
        }

        await this.persist();
        this.emit('documentUpdated', doc);
        return doc;
    }

    /**
     * Delete document
     */
    async deleteDocument(id: string): Promise<boolean> {
        const deleted = this.documents.delete(id);
        this.chunks.delete(id);

        if (deleted) {
            await this.persist();
            this.emit('documentDeleted', { id });
        }
        return deleted;
    }

    /**
     * Search knowledge base
     */
    async search(query: string, options?: {
        category?: string;
        tags?: string[];
        limit?: number;
        threshold?: number;
    }): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        const limit = options?.limit || 10;
        const threshold = options?.threshold || 0.3;
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);

        for (const doc of this.documents.values()) {
            // Filter by category
            if (options?.category && doc.category !== options.category) continue;

            // Filter by tags
            if (options?.tags && options.tags.length > 0) {
                if (!options.tags.some(tag => doc.tags.includes(tag))) continue;
            }

            // Calculate relevance score
            const score = this.calculateRelevance(doc, queryWords);

            if (score >= threshold) {
                // Find best matching chunk for highlight
                const docChunks = this.chunks.get(doc.id) || [];
                let bestChunk: KnowledgeChunk | undefined;
                let bestChunkScore = 0;

                for (const chunk of docChunks) {
                    const chunkScore = this.calculateChunkRelevance(chunk, queryWords);
                    if (chunkScore > bestChunkScore) {
                        bestChunkScore = chunkScore;
                        bestChunk = chunk;
                    }
                }

                results.push({
                    document: doc,
                    chunk: bestChunk,
                    score: score + bestChunkScore * 0.5,
                    highlight: bestChunk?.content.substring(0, 200),
                });
            }
        }

        // Sort by score and limit
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Get answer for question (RAG style)
     */
    async getAnswer(question: string): Promise<{
        answer: string;
        sources: SearchResult[];
        confidence: number;
    }> {
        const results = await this.search(question, { limit: 5 });

        if (results.length === 0) {
            return {
                answer: "I couldn't find relevant information in the knowledge base to answer this question.",
                sources: [],
                confidence: 0,
            };
        }

        // Compile answer from top results
        const context = results
            .slice(0, 3)
            .map(r => r.chunk?.content || r.document.content.substring(0, 500))
            .join('\n\n');

        // Simple extractive answer (in production, would use LLM)
        const answer = this.extractAnswer(question, context);
        const confidence = results[0].score;

        return {
            answer,
            sources: results,
            confidence,
        };
    }

    /**
     * Add knowledge source
     */
    addSource(source: KnowledgeSource): void {
        this.sources.set(source.id, source);
        this.emit('sourceAdded', source);
    }

    /**
     * Sync from source
     */
    async syncSource(sourceId: string): Promise<number> {
        const source = this.sources.get(sourceId);
        if (!source) return 0;

        let added = 0;

        switch (source.type) {
            case 'url':
                // In production: fetch and parse URL content
                console.log(`[KnowledgeBase] Syncing from URL: ${source.config.url}`);
                break;
            case 'file':
                // In production: read file contents
                console.log(`[KnowledgeBase] Syncing from file: ${source.config.path}`);
                break;
            case 'api':
                // In production: call API and parse response
                console.log(`[KnowledgeBase] Syncing from API: ${source.config.endpoint}`);
                break;
        }

        source.lastSync = Date.now();
        return added;
    }

    /**
     * Get all documents
     */
    getAllDocuments(): KnowledgeDocument[] {
        return Array.from(this.documents.values());
    }

    /**
     * Get documents by category
     */
    getByCategory(category: string): KnowledgeDocument[] {
        return Array.from(this.documents.values())
            .filter(d => d.category === category);
    }

    /**
     * Get all categories
     */
    getAllCategories(): string[] {
        const categories = new Set<string>();
        for (const doc of this.documents.values()) {
            if (doc.category) categories.add(doc.category);
        }
        return Array.from(categories).sort();
    }

    /**
     * Get all tags
     */
    getAllTags(): string[] {
        const tags = new Set<string>();
        for (const doc of this.documents.values()) {
            for (const tag of doc.tags) {
                tags.add(tag);
            }
        }
        return Array.from(tags).sort();
    }

    /**
     * Get statistics
     */
    getStats(): {
        documentCount: number;
        chunkCount: number;
        categoryCount: number;
        tagCount: number;
    } {
        let chunkCount = 0;
        for (const chunks of this.chunks.values()) {
            chunkCount += chunks.length;
        }

        return {
            documentCount: this.documents.size,
            chunkCount,
            categoryCount: this.getAllCategories().length,
            tagCount: this.getAllTags().length,
        };
    }

    // Private methods

    private chunkDocument(doc: KnowledgeDocument): KnowledgeChunk[] {
        const chunks: KnowledgeChunk[] = [];
        const chunkSize = 500;
        const overlap = 50;
        const content = doc.content;

        let start = 0;
        let chunkIndex = 0;

        while (start < content.length) {
            const end = Math.min(start + chunkSize, content.length);

            chunks.push({
                id: `chunk_${doc.id}_${chunkIndex++}`,
                documentId: doc.id,
                content: content.substring(start, end),
                startIndex: start,
                endIndex: end,
            });

            start = end - overlap;
            if (start >= content.length - overlap) break;
        }

        return chunks;
    }

    private calculateRelevance(doc: KnowledgeDocument, queryWords: string[]): number {
        const text = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
        let matches = 0;

        for (const word of queryWords) {
            if (text.includes(word)) matches++;
        }

        return queryWords.length > 0 ? matches / queryWords.length : 0;
    }

    private calculateChunkRelevance(chunk: KnowledgeChunk, queryWords: string[]): number {
        const text = chunk.content.toLowerCase();
        let matches = 0;

        for (const word of queryWords) {
            if (text.includes(word)) matches++;
        }

        return queryWords.length > 0 ? matches / queryWords.length : 0;
    }

    private extractAnswer(question: string, context: string): string {
        // Simple extractive answer - find most relevant sentence
        const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const questionWords = question.toLowerCase().split(/\s+/);

        let bestSentence = sentences[0] || context.substring(0, 200);
        let bestScore = 0;

        for (const sentence of sentences) {
            let score = 0;
            const sentenceLower = sentence.toLowerCase();
            for (const word of questionWords) {
                if (sentenceLower.includes(word)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestSentence = sentence.trim();
            }
        }

        return bestSentence + '.';
    }

    private async persist(): Promise<void> {
        try {
            this.store.set('documents', Array.from(this.documents.entries()));
        } catch (error) {
            console.error('Failed to persist knowledge:', error);
        }
    }

    private loadKnowledge(): void {
        try {
            const data = this.store.get('documents') as Array<[string, KnowledgeDocument]>;
            if (data) {
                this.documents = new Map(data);
                // Regenerate chunks
                for (const [id, doc] of this.documents) {
                    this.chunks.set(id, this.chunkDocument(doc));
                }
            }
        } catch (error) {
            console.error('Failed to load knowledge:', error);
        }
    }
}

// Singleton getter
export function getKnowledgeBase(): KnowledgeBase {
    return KnowledgeBase.getInstance();
}
