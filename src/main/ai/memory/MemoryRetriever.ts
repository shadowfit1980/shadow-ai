/**
 * MemoryRetriever - Smart Memory Retrieval
 * 
 * Provides intelligent retrieval and filtering of memories
 */

import { VectorStore } from './VectorStore';
import { EmbeddingService } from './EmbeddingService';
import {
    Memory,
    ProjectContext,
    CodeMatch,
    SearchOptions,
    MemoryType
} from './types';

export class MemoryRetriever {
    constructor(
        private vectorStore: VectorStore,
        private embedder: EmbeddingService
    ) { }

    /**
     * Get relevant context for a task
     */
    async getRelevantContext(
        task: string,
        options?: SearchOptions
    ): Promise<ProjectContext> {
        const limit = options?.limit || 20;
        const memories = await this.recall(task, limit, options);

        // Organize by type
        const context: ProjectContext = {
            code: [],
            decisions: [],
            styles: [],
            architecture: [],
            conversations: []
        };

        for (const memory of memories) {
            switch (memory.type) {
                case 'code':
                    context.code.push(memory);
                    break;
                case 'decision':
                    context.decisions.push(memory);
                    break;
                case 'style':
                    context.styles.push(memory);
                    break;
                case 'architecture':
                    context.architecture.push(memory);
                    break;
                case 'conversation':
                    context.conversations!.push(memory);
                    break;
            }
        }

        return context;
    }

    /**
     * Find similar code snippets
     */
    async findSimilarCode(codeSnippet: string, limit: number = 5): Promise<CodeMatch[]> {
        const embedding = await this.embedder.embed(codeSnippet);
        const results = await this.vectorStore.search(embedding, limit * 2, {
            type: 'code'
        });

        return results
            .filter(r => r.type === 'code')
            .slice(0, limit)
            .map(r => ({
                code: r.content,
                file: r.metadata.file || 'unknown',
                similarity: 1 - r.score, // Convert distance to similarity
                language: r.metadata.language || 'unknown'
            }));
    }

    /**
     * Recall memories by query
     */
    async recall(
        query: string,
        k: number = 10,
        options?: SearchOptions
    ): Promise<Memory[]> {
        const embedding = await this.embedder.embed(query);
        const results = await this.vectorStore.search(
            embedding,
            k,
            options?.filters
        );

        // Filter by relevance threshold if specified
        const minRelevance = options?.filters?.minRelevance || 0;

        return results
            .filter(r => (1 - r.score) >= minRelevance)
            .map(r => ({
                id: r.id,
                type: r.type as MemoryType,
                content: r.content,
                metadata: r.metadata,
                timestamp: r.timestamp,
                relevance: 1 - r.score
            }));
    }

    /**
     * Get recent memories of a specific type
     */
    async getRecent(type: MemoryType, limit: number = 10): Promise<Memory[]> {
        // For recent, we search with a generic query and filter by type
        const embedding = await this.embedder.embed(`recent ${type} memories`);
        const results = await this.vectorStore.search(embedding, limit * 2, {
            type
        });

        return results
            .slice(0, limit)
            .map(r => ({
                id: r.id,
                type: r.type as MemoryType,
                content: r.content,
                metadata: r.metadata,
                timestamp: r.timestamp,
                relevance: 1 - r.score
            }))
            .sort((a, b) => {
                const timeA = a.timestamp?.getTime() || 0;
                const timeB = b.timestamp?.getTime() || 0;
                return timeB - timeA; // Most recent first
            });
    }

    /**
     * Search for decisions related to a topic
     */
    async searchDecisions(topic: string, limit: number = 5): Promise<Memory[]> {
        return this.recall(topic, limit, {
            filters: { type: 'decision' }
        });
    }

    /**
     * Get coding style examples
     */
    async getStyleExamples(limit: number = 5): Promise<Memory[]> {
        return this.getRecent('style', limit);
    }

    /**
     * Search architecture memories
     */
    async searchArchitecture(component: string, limit: number = 5): Promise<Memory[]> {
        return this.recall(component, limit, {
            filters: { type: 'architecture' }
        });
    }

    /**
     * Find conversations about a topic
     */
    async searchConversations(topic: string, limit: number = 5): Promise<Memory[]> {
        return this.recall(topic, limit, {
            filters: { type: 'conversation' }
        });
    }
}
