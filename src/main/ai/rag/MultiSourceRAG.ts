/**
 * Multi-Source RAG System
 * 
 * Enhanced Retrieval-Augmented Generation that pulls from
 * web, internal docs, and user-defined knowledge sources.
 */

import { EventEmitter } from 'events';

export interface RAGSource {
    id: string;
    name: string;
    type: SourceType;
    config: SourceConfig;
    enabled: boolean;
    priority: number; // 1-10, higher = more important
    lastSynced?: Date;
}

export type SourceType =
    | 'web'
    | 'local_docs'
    | 'database'
    | 'api'
    | 'dream_journal'  // User's hypothetical ideas
    | 'codebase'
    | 'conversation_history';

export interface SourceConfig {
    url?: string;
    path?: string;
    apiKey?: string;
    indexName?: string;
    refreshInterval?: number;
    maxResults?: number;
}

export interface RetrievalQuery {
    id: string;
    query: string;
    sources: string[]; // Source IDs to search
    filters?: QueryFilter[];
    maxResults: number;
    semanticSearch: boolean;
}

export interface QueryFilter {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in';
    value: any;
}

export interface RetrievalResult {
    id: string;
    queryId: string;
    sourceId: string;
    sourceName: string;
    content: string;
    relevanceScore: number;
    metadata: Record<string, any>;
    timestamp: Date;
}

export interface AugmentedContext {
    query: string;
    results: RetrievalResult[];
    mergedContext: string;
    sources: string[];
    confidence: number;
}

export interface DreamEntry {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: Date;
    relatedTo?: string[];
}

export class MultiSourceRAG extends EventEmitter {
    private static instance: MultiSourceRAG;
    private sources: Map<string, RAGSource> = new Map();
    private index: Map<string, RetrievalResult[]> = new Map(); // Simple in-memory index
    private dreamJournal: DreamEntry[] = [];
    private queryHistory: RetrievalQuery[] = [];

    private constructor() {
        super();
        this.initializeDefaultSources();
    }

    static getInstance(): MultiSourceRAG {
        if (!MultiSourceRAG.instance) {
            MultiSourceRAG.instance = new MultiSourceRAG();
        }
        return MultiSourceRAG.instance;
    }

    // ========================================================================
    // SOURCE MANAGEMENT
    // ========================================================================

    private initializeDefaultSources(): void {
        const defaults: Omit<RAGSource, 'id'>[] = [
            {
                name: 'Web Search',
                type: 'web',
                config: { url: 'https://api.search.com', maxResults: 10 },
                enabled: true,
                priority: 5,
            },
            {
                name: 'Local Documentation',
                type: 'local_docs',
                config: { path: './docs', maxResults: 20 },
                enabled: true,
                priority: 8,
            },
            {
                name: 'Codebase',
                type: 'codebase',
                config: { path: './', maxResults: 15 },
                enabled: true,
                priority: 9,
            },
            {
                name: 'Conversation History',
                type: 'conversation_history',
                config: { maxResults: 10 },
                enabled: true,
                priority: 7,
            },
            {
                name: 'Dream Journal',
                type: 'dream_journal',
                config: { maxResults: 5 },
                enabled: true,
                priority: 3,
            },
        ];

        for (const source of defaults) {
            const id = `source_${source.type}`;
            this.sources.set(id, { ...source, id });
        }
    }

    addSource(source: Omit<RAGSource, 'id'>): RAGSource {
        const id = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSource: RAGSource = { ...source, id };
        this.sources.set(id, newSource);
        this.emit('source:added', newSource);
        return newSource;
    }

    removeSource(sourceId: string): boolean {
        const deleted = this.sources.delete(sourceId);
        if (deleted) {
            this.emit('source:removed', sourceId);
        }
        return deleted;
    }

    updateSource(sourceId: string, updates: Partial<RAGSource>): RAGSource | undefined {
        const source = this.sources.get(sourceId);
        if (!source) return undefined;

        const updated = { ...source, ...updates };
        this.sources.set(sourceId, updated);
        return updated;
    }

    // ========================================================================
    // RETRIEVAL
    // ========================================================================

    /**
     * Retrieve relevant content from all enabled sources
     */
    async retrieve(query: string, options?: Partial<RetrievalQuery>): Promise<AugmentedContext> {
        const queryId = `query_${Date.now()}`;
        const enabledSources = Array.from(this.sources.values())
            .filter(s => s.enabled)
            .sort((a, b) => b.priority - a.priority);

        const results: RetrievalResult[] = [];

        // Query each source
        for (const source of enabledSources) {
            try {
                const sourceResults = await this.querySource(source, query, options?.maxResults || 5);
                results.push(...sourceResults);
            } catch (error) {
                this.emit('source:error', { sourceId: source.id, error });
            }
        }

        // Sort by relevance
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);

        // Merge into context
        const mergedContext = this.mergeResults(results.slice(0, 20));
        const confidence = this.calculateConfidence(results);

        const context: AugmentedContext = {
            query,
            results: results.slice(0, 20),
            mergedContext,
            sources: [...new Set(results.map(r => r.sourceName))],
            confidence,
        };

        // Store query
        this.queryHistory.push({
            id: queryId,
            query,
            sources: enabledSources.map(s => s.id),
            maxResults: options?.maxResults || 10,
            semanticSearch: true,
        });

        this.emit('retrieval:complete', context);
        return context;
    }

    /**
     * Query a specific source
     */
    private async querySource(source: RAGSource, query: string, maxResults: number): Promise<RetrievalResult[]> {
        const results: RetrievalResult[] = [];

        switch (source.type) {
            case 'local_docs':
                return this.queryLocalDocs(source, query, maxResults);

            case 'codebase':
                return this.queryCodebase(source, query, maxResults);

            case 'conversation_history':
                return this.queryConversationHistory(query, maxResults);

            case 'dream_journal':
                return this.queryDreamJournal(query, maxResults);

            case 'web':
                return this.queryWeb(source, query, maxResults);

            default:
                return [];
        }
    }

    private async queryLocalDocs(source: RAGSource, query: string, maxResults: number): Promise<RetrievalResult[]> {
        // Simulated local docs search - in real implementation would search actual files
        const mockDocs = [
            { title: 'Getting Started', content: 'Welcome to Shadow AI. This guide covers installation and setup.' },
            { title: 'API Reference', content: 'Complete API documentation for all endpoints.' },
            { title: 'Configuration', content: 'How to configure settings and environment variables.' },
        ];

        return mockDocs
            .filter(doc =>
                doc.title.toLowerCase().includes(query.toLowerCase()) ||
                doc.content.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, maxResults)
            .map((doc, i) => ({
                id: `result_${Date.now()}_${i}`,
                queryId: '',
                sourceId: source.id,
                sourceName: source.name,
                content: doc.content,
                relevanceScore: 0.8 - i * 0.1,
                metadata: { title: doc.title },
                timestamp: new Date(),
            }));
    }

    private async queryCodebase(source: RAGSource, query: string, maxResults: number): Promise<RetrievalResult[]> {
        // Simulated codebase search
        const cached = this.index.get(`codebase:${query}`);
        if (cached) return cached.slice(0, maxResults);

        // In real implementation, would use actual code search
        return [{
            id: `result_codebase_${Date.now()}`,
            queryId: '',
            sourceId: source.id,
            sourceName: source.name,
            content: `Relevant code snippet for "${query}"`,
            relevanceScore: 0.75,
            metadata: { type: 'codebase_search' },
            timestamp: new Date(),
        }];
    }

    private async queryConversationHistory(query: string, maxResults: number): Promise<RetrievalResult[]> {
        // In real implementation, would search actual conversation history
        return [];
    }

    private async queryDreamJournal(query: string, maxResults: number): Promise<RetrievalResult[]> {
        const queryLower = query.toLowerCase();

        return this.dreamJournal
            .filter(entry =>
                entry.title.toLowerCase().includes(queryLower) ||
                entry.content.toLowerCase().includes(queryLower) ||
                entry.tags.some(t => t.toLowerCase().includes(queryLower))
            )
            .slice(0, maxResults)
            .map((entry, i) => ({
                id: `result_dream_${entry.id}`,
                queryId: '',
                sourceId: 'source_dream_journal',
                sourceName: 'Dream Journal',
                content: `${entry.title}\n\n${entry.content}`,
                relevanceScore: 0.6 - i * 0.1,
                metadata: { tags: entry.tags, createdAt: entry.createdAt },
                timestamp: new Date(),
            }));
    }

    private async queryWeb(source: RAGSource, query: string, maxResults: number): Promise<RetrievalResult[]> {
        // In real implementation, would call external search API
        return [{
            id: `result_web_${Date.now()}`,
            queryId: '',
            sourceId: source.id,
            sourceName: source.name,
            content: `Web search results for "${query}" would appear here`,
            relevanceScore: 0.5,
            metadata: { type: 'web_search' },
            timestamp: new Date(),
        }];
    }

    // ========================================================================
    // DREAM JOURNAL
    // ========================================================================

    /**
     * Add a hypothetical idea to the dream journal
     */
    addDream(title: string, content: string, tags: string[] = []): DreamEntry {
        const entry: DreamEntry = {
            id: `dream_${Date.now()}`,
            title,
            content,
            tags,
            createdAt: new Date(),
        };

        this.dreamJournal.push(entry);
        this.emit('dream:added', entry);
        return entry;
    }

    /**
     * Get all dream journal entries
     */
    getDreams(): DreamEntry[] {
        return [...this.dreamJournal];
    }

    /**
     * Remove a dream entry
     */
    removeDream(dreamId: string): boolean {
        const index = this.dreamJournal.findIndex(d => d.id === dreamId);
        if (index >= 0) {
            this.dreamJournal.splice(index, 1);
            return true;
        }
        return false;
    }

    // ========================================================================
    // CONTEXT MERGING
    // ========================================================================

    private mergeResults(results: RetrievalResult[]): string {
        if (results.length === 0) return '';

        const sections: string[] = [];

        // Group by source
        const bySource = new Map<string, RetrievalResult[]>();
        for (const result of results) {
            const existing = bySource.get(result.sourceName) || [];
            existing.push(result);
            bySource.set(result.sourceName, existing);
        }

        // Build merged context
        for (const [sourceName, sourceResults] of bySource) {
            sections.push(`## From ${sourceName}\n`);
            for (const result of sourceResults) {
                sections.push(`- ${result.content.slice(0, 200)}${result.content.length > 200 ? '...' : ''}\n`);
            }
        }

        return sections.join('\n');
    }

    private calculateConfidence(results: RetrievalResult[]): number {
        if (results.length === 0) return 0;

        const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
        const sourceCount = new Set(results.map(r => r.sourceId)).size;
        const sourceDiversity = Math.min(1, sourceCount / 3);

        return (avgRelevance * 0.7) + (sourceDiversity * 0.3);
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getSources(): RAGSource[] {
        return Array.from(this.sources.values());
    }

    getSource(sourceId: string): RAGSource | undefined {
        return this.sources.get(sourceId);
    }

    getQueryHistory(limit: number = 20): RetrievalQuery[] {
        return this.queryHistory.slice(-limit);
    }
}

export const multiSourceRAG = MultiSourceRAG.getInstance();
