/**
 * VectorStore - In-Memory Vector Store
 * 
 * Simple in-memory implementation of vector storage and similarity search.
 * Replaces LanceDB which has module compatibility issues.
 */

import { MemoryVector, SearchResult } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

interface StoredMemory {
    id: string;
    embedding: number[];
    content: string;
    type: string;
    metadata: Record<string, any>;
    timestamp: number;
}

export class VectorStore {
    private memories: Map<string, StoredMemory> = new Map();
    private dbPath: string = '';
    private persistFile: string = '';
    private initialized: boolean = false;

    /**
     * Initialize the vector store
     */
    async initialize(dbPath: string): Promise<void> {
        this.dbPath = dbPath;
        this.persistFile = path.join(dbPath, 'memories.json');

        // Ensure directory exists
        await fs.mkdir(dbPath, { recursive: true });

        console.log('🗄️  Initializing in-memory vector store at:', dbPath);

        try {
            // Try to load persisted data
            const data = await fs.readFile(this.persistFile, 'utf-8');
            const parsed = JSON.parse(data);
            this.memories = new Map(Object.entries(parsed));
            console.log(`✅ Loaded ${this.memories.size} memories from disk`);
        } catch {
            // No existing file, start fresh
            console.log('📝 Starting with empty memory store');
        }

        this.initialized = true;
    }

    /**
     * Persist memories to disk
     */
    private async persist(): Promise<void> {
        if (!this.initialized) return;

        try {
            const data = Object.fromEntries(this.memories);
            await fs.writeFile(this.persistFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to persist memories:', (error as Error).message);
        }
    }

    /**
     * Insert memories into the vector store
     */
    async insert(memories: MemoryVector[]): Promise<void> {
        if (!this.initialized) {
            throw new Error('Vector store not initialized');
        }

        if (memories.length === 0) {
            return;
        }

        for (const m of memories) {
            this.memories.set(m.id, {
                id: m.id,
                embedding: m.embedding,
                content: m.content,
                type: m.type,
                metadata: m.metadata,
                timestamp: Date.now()
            });
        }

        await this.persist();
        console.log(`💾 Stored ${memories.length} memories`);
    }

    /**
     * Cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Search for similar memories
     */
    async search(queryVector: number[], k: number = 5, filters?: any): Promise<SearchResult[]> {
        if (!this.initialized) {
            throw new Error('Vector store not initialized');
        }

        try {
            // Calculate similarity scores
            const scored: { memory: StoredMemory; score: number }[] = [];

            for (const memory of this.memories.values()) {
                // Apply type filter if provided
                if (filters?.type && memory.type !== filters.type) {
                    continue;
                }

                const score = this.cosineSimilarity(queryVector, memory.embedding);
                scored.push({ memory, score });
            }

            // Sort by score (higher is better for cosine similarity)
            scored.sort((a, b) => b.score - a.score);

            // Return top k results
            return scored.slice(0, k).map(({ memory, score }) => ({
                id: memory.id,
                content: memory.content,
                type: memory.type,
                metadata: memory.metadata,
                score: 1 - score, // Convert to distance (lower is better)
                timestamp: new Date(memory.timestamp)
            }));
        } catch (error: any) {
            console.error('❌ Search error:', error.message);
            return [];
        }
    }

    /**
     * Delete memories by IDs
     */
    async delete(ids: string[]): Promise<void> {
        if (!this.initialized) {
            throw new Error('Vector store not initialized');
        }

        if (ids.length === 0) {
            return;
        }

        try {
            for (const id of ids) {
                this.memories.delete(id);
            }
            await this.persist();
            console.log(`🗑️  Deleted ${ids.length} memories`);
        } catch (error: any) {
            console.error('❌ Delete error:', error.message);
            throw error;
        }
    }

    /**
     * Get total count of memories
     */
    async count(): Promise<number> {
        return this.memories.size;
    }

    /**
     * Clear all memories
     */
    async clear(): Promise<void> {
        this.memories.clear();
        await this.persist();
        console.log('🧹 Cleared all memories');
    }

    /**
     * Get stats about the vector store
     */
    async getStats(): Promise<{
        totalMemories: number;
        dbPath: string;
        tableName: string;
    }> {
        return {
            totalMemories: await this.count(),
            dbPath: this.dbPath,
            tableName: 'in-memory'
        };
    }
}

