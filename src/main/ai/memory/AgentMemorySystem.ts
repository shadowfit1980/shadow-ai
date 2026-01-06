/**
 * Agent Memory System
 * 
 * Implements long-term memory, episodic memory, semantic memory,
 * and working memory for intelligent agents.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

interface MemoryEntry {
    id: string;
    content: string;
    embedding?: number[];
    metadata: {
        timestamp: number;
        importance: number;
        accessCount: number;
        lastAccessed: number;
        type: 'episodic' | 'semantic' | 'procedural';
        tags: string[];
    };
}

interface SearchResult {
    entry: MemoryEntry;
    similarity: number;
}

// ============================================================================
// AGENT MEMORY SYSTEM
// ============================================================================

export class AgentMemorySystem extends EventEmitter {
    private static instance: AgentMemorySystem;
    private memories: Map<string, MemoryEntry> = new Map();
    private workingMemory: MemoryEntry[] = [];
    private readonly maxWorkingMemory = 7; // Miller's Law

    private constructor() {
        super();
    }

    static getInstance(): AgentMemorySystem {
        if (!AgentMemorySystem.instance) {
            AgentMemorySystem.instance = new AgentMemorySystem();
        }
        return AgentMemorySystem.instance;
    }

    // ========================================================================
    // LONG-TERM MEMORY
    // ========================================================================

    async store(
        content: string,
        type: 'episodic' | 'semantic' | 'procedural',
        options: { importance?: number; tags?: string[] } = {}
    ): Promise<string> {
        const id = this.generateId();
        const embedding = await this.generateEmbedding(content);

        const entry: MemoryEntry = {
            id,
            content,
            embedding,
            metadata: {
                timestamp: Date.now(),
                importance: options.importance || 0.5,
                accessCount: 0,
                lastAccessed: Date.now(),
                type,
                tags: options.tags || [],
            },
        };

        this.memories.set(id, entry);
        this.emit('memory:stored', { id, type });

        // Consolidate if needed
        await this.consolidateMemories();

        return id;
    }

    async retrieve(id: string): Promise<MemoryEntry | null> {
        const entry = this.memories.get(id);
        if (entry) {
            entry.metadata.accessCount++;
            entry.metadata.lastAccessed = Date.now();
            this.emit('memory:accessed', { id });
        }
        return entry || null;
    }

    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        const queryEmbedding = await this.generateEmbedding(query);

        const results: SearchResult[] = [];

        for (const entry of this.memories.values()) {
            if (entry.embedding) {
                const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
                results.push({ entry, similarity });
            }
        }

        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    async searchByTag(tag: string): Promise<MemoryEntry[]> {
        const results: MemoryEntry[] = [];

        for (const entry of this.memories.values()) {
            if (entry.metadata.tags.includes(tag)) {
                results.push(entry);
            }
        }

        return results;
    }

    // ========================================================================
    // WORKING MEMORY
    // ========================================================================

    pushToWorkingMemory(content: string): void {
        const entry: MemoryEntry = {
            id: this.generateId(),
            content,
            metadata: {
                timestamp: Date.now(),
                importance: 1.0,
                accessCount: 1,
                lastAccessed: Date.now(),
                type: 'episodic',
                tags: ['working'],
            },
        };

        this.workingMemory.push(entry);

        // Maintain capacity limit
        while (this.workingMemory.length > this.maxWorkingMemory) {
            const removed = this.workingMemory.shift();
            if (removed && removed.metadata.importance > 0.7) {
                // Move important items to long-term memory
                this.store(removed.content, 'episodic', {
                    importance: removed.metadata.importance,
                });
            }
        }

        this.emit('working-memory:updated', { size: this.workingMemory.length });
    }

    getWorkingMemory(): string[] {
        return this.workingMemory.map(e => e.content);
    }

    clearWorkingMemory(): void {
        this.workingMemory = [];
        this.emit('working-memory:cleared');
    }

    // ========================================================================
    // EPISODIC MEMORY
    // ========================================================================

    async storeEpisode(
        episode: { action: string; context: string; outcome: string; success: boolean }
    ): Promise<string> {
        const content = JSON.stringify(episode);
        return this.store(content, 'episodic', {
            importance: episode.success ? 0.8 : 0.6,
            tags: ['episode', episode.success ? 'success' : 'failure'],
        });
    }

    async recallSimilarEpisodes(currentContext: string): Promise<MemoryEntry[]> {
        const results = await this.search(currentContext, 3);
        return results
            .filter(r => r.entry.metadata.type === 'episodic')
            .map(r => r.entry);
    }

    // ========================================================================
    // SEMANTIC MEMORY
    // ========================================================================

    async storeKnowledge(
        fact: string,
        category: string
    ): Promise<string> {
        return this.store(fact, 'semantic', {
            importance: 0.7,
            tags: ['knowledge', category],
        });
    }

    async queryKnowledge(question: string): Promise<string[]> {
        const results = await this.search(question, 5);
        return results
            .filter(r => r.entry.metadata.type === 'semantic')
            .map(r => r.entry.content);
    }

    // ========================================================================
    // MEMORY CONSOLIDATION
    // ========================================================================

    private async consolidateMemories(): Promise<void> {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        // Remove old, unimportant, rarely accessed memories
        for (const [id, entry] of this.memories.entries()) {
            const age = now - entry.metadata.timestamp;
            const recency = now - entry.metadata.lastAccessed;

            const shouldForget =
                age > 7 * oneDay &&
                entry.metadata.importance < 0.3 &&
                entry.metadata.accessCount < 2 &&
                recency > 3 * oneDay;

            if (shouldForget) {
                this.memories.delete(id);
                this.emit('memory:forgotten', { id });
            }
        }

        // Strengthen frequently accessed memories
        for (const entry of this.memories.values()) {
            if (entry.metadata.accessCount > 5) {
                entry.metadata.importance = Math.min(1.0, entry.metadata.importance * 1.1);
            }
        }
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async generateEmbedding(text: string): Promise<number[]> {
        // In production, use actual embedding model
        // This is a simple hash-based pseudo-embedding
        const embedding: number[] = new Array(384).fill(0);
        for (let i = 0; i < text.length; i++) {
            embedding[i % 384] += text.charCodeAt(i) / 1000;
        }
        return embedding;
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private generateId(): string {
        return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getStats(): { total: number; byType: Record<string, number> } {
        const byType: Record<string, number> = {};

        for (const entry of this.memories.values()) {
            byType[entry.metadata.type] = (byType[entry.metadata.type] || 0) + 1;
        }

        return { total: this.memories.size, byType };
    }
}

export const agentMemorySystem = AgentMemorySystem.getInstance();
