/**
 * Persistent Memory System
 * 
 * Long-term memory across sessions with:
 * - User preferences storage
 * - Project history and learnings
 * - Successful solution patterns
 * - Context optimization
 * - Memory consolidation
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface MemoryEntry {
    id: string;
    type: MemoryType;
    key: string;
    value: any;
    metadata: MemoryMetadata;
    createdAt: Date;
    updatedAt: Date;
    accessCount: number;
    lastAccessedAt: Date;
}

export type MemoryType =
    | 'preference'      // User preferences
    | 'project'         // Project-specific data
    | 'pattern'         // Successful patterns
    | 'solution'        // Problem solutions
    | 'context'         // Conversation context
    | 'learning'        // Learned behaviors
    | 'shortcut';       // User shortcuts/aliases

export interface MemoryMetadata {
    source: string;
    projectId?: string;
    confidence: number;
    tags: string[];
    expires?: Date;
}

export interface MemoryQuery {
    type?: MemoryType;
    key?: string;
    tags?: string[];
    projectId?: string;
    limit?: number;
}

export interface MemoryStats {
    totalEntries: number;
    byType: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    totalSize: number;
}

/**
 * PersistentMemory manages long-term storage
 */
export class PersistentMemory extends EventEmitter {
    private static instance: PersistentMemory;
    private entries: Map<string, MemoryEntry> = new Map();
    private storagePath: string;
    private saveDebounce: NodeJS.Timeout | null = null;
    private isDirty: boolean = false;

    private constructor() {
        super();
        this.storagePath = path.join(process.cwd(), '.shadow-memory');
        this.initialize();
    }

    static getInstance(): PersistentMemory {
        if (!PersistentMemory.instance) {
            PersistentMemory.instance = new PersistentMemory();
        }
        return PersistentMemory.instance;
    }

    /**
     * Initialize memory system
     */
    private async initialize(): Promise<void> {
        await this.loadFromDisk();
        console.log(`🧠 [PersistentMemory] Initialized with ${this.entries.size} entries`);
    }

    /**
     * Load memory from disk
     */
    private async loadFromDisk(): Promise<void> {
        try {
            const filePath = path.join(this.storagePath, 'memory.json');
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            for (const entry of data.entries || []) {
                entry.createdAt = new Date(entry.createdAt);
                entry.updatedAt = new Date(entry.updatedAt);
                entry.lastAccessedAt = new Date(entry.lastAccessedAt);
                if (entry.metadata.expires) {
                    entry.metadata.expires = new Date(entry.metadata.expires);
                }
                this.entries.set(entry.id, entry);
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                console.warn('Failed to load memory:', error.message);
            }
        }
    }

    /**
     * Save memory to disk (debounced)
     */
    private scheduleSave(): void {
        this.isDirty = true;

        if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
        }

        this.saveDebounce = setTimeout(() => {
            this.saveToDisk();
        }, 2000);
    }

    /**
     * Save to disk immediately
     */
    private async saveToDisk(): Promise<void> {
        if (!this.isDirty) return;

        try {
            await fs.mkdir(this.storagePath, { recursive: true });

            const data = {
                version: 1,
                savedAt: new Date().toISOString(),
                entries: [...this.entries.values()],
            };

            const filePath = path.join(this.storagePath, 'memory.json');
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));

            this.isDirty = false;
            console.log(`💾 [PersistentMemory] Saved ${this.entries.size} entries`);
        } catch (error: any) {
            console.error('Failed to save memory:', error.message);
        }
    }

    /**
     * Store a memory entry
     */
    async store(params: {
        type: MemoryType;
        key: string;
        value: any;
        metadata?: Partial<MemoryMetadata>;
    }): Promise<MemoryEntry> {
        const id = `mem-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const now = new Date();

        const entry: MemoryEntry = {
            id,
            type: params.type,
            key: params.key,
            value: params.value,
            metadata: {
                source: 'user',
                confidence: 1.0,
                tags: [],
                ...params.metadata,
            },
            createdAt: now,
            updatedAt: now,
            accessCount: 0,
            lastAccessedAt: now,
        };

        this.entries.set(id, entry);
        this.scheduleSave();
        this.emit('memory:stored', entry);

        return entry;
    }

    /**
     * Retrieve a memory entry by key
     */
    async retrieve(key: string): Promise<MemoryEntry | undefined> {
        for (const entry of this.entries.values()) {
            if (entry.key === key) {
                entry.accessCount++;
                entry.lastAccessedAt = new Date();
                this.scheduleSave();
                return entry;
            }
        }
        return undefined;
    }

    /**
     * Query memories
     */
    async query(query: MemoryQuery): Promise<MemoryEntry[]> {
        let results = [...this.entries.values()];

        // Filter by type
        if (query.type) {
            results = results.filter(e => e.type === query.type);
        }

        // Filter by key (partial match)
        if (query.key) {
            const keyLower = query.key.toLowerCase();
            results = results.filter(e => e.key.toLowerCase().includes(keyLower));
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter(e =>
                query.tags!.some(tag => e.metadata.tags.includes(tag))
            );
        }

        // Filter by project
        if (query.projectId) {
            results = results.filter(e => e.metadata.projectId === query.projectId);
        }

        // Remove expired entries
        const now = new Date();
        results = results.filter(e =>
            !e.metadata.expires || e.metadata.expires > now
        );

        // Sort by relevance (access count + recency)
        results.sort((a, b) => {
            const recencyA = a.lastAccessedAt.getTime();
            const recencyB = b.lastAccessedAt.getTime();
            const scoreA = a.accessCount * 1000 + recencyA / 1000000;
            const scoreB = b.accessCount * 1000 + recencyB / 1000000;
            return scoreB - scoreA;
        });

        // Apply limit
        if (query.limit) {
            results = results.slice(0, query.limit);
        }

        // Update access tracking
        for (const entry of results) {
            entry.accessCount++;
            entry.lastAccessedAt = new Date();
        }
        this.scheduleSave();

        return results;
    }

    /**
     * Update a memory entry
     */
    async update(id: string, value: any, metadata?: Partial<MemoryMetadata>): Promise<boolean> {
        const entry = this.entries.get(id);
        if (!entry) return false;

        entry.value = value;
        entry.updatedAt = new Date();

        if (metadata) {
            entry.metadata = { ...entry.metadata, ...metadata };
        }

        this.scheduleSave();
        this.emit('memory:updated', entry);

        return true;
    }

    /**
     * Delete a memory entry
     */
    async delete(id: string): Promise<boolean> {
        const deleted = this.entries.delete(id);
        if (deleted) {
            this.scheduleSave();
            this.emit('memory:deleted', { id });
        }
        return deleted;
    }

    /**
     * Store user preference
     */
    async setPreference(key: string, value: any): Promise<void> {
        // Check if preference already exists
        const existing = await this.retrieve(`pref:${key}`);
        if (existing) {
            await this.update(existing.id, value);
        } else {
            await this.store({
                type: 'preference',
                key: `pref:${key}`,
                value,
                metadata: { source: 'user', confidence: 1.0, tags: ['preference'] },
            });
        }
    }

    /**
     * Get user preference
     */
    async getPreference<T = any>(key: string, defaultValue?: T): Promise<T | undefined> {
        const entry = await this.retrieve(`pref:${key}`);
        return entry ? entry.value : defaultValue;
    }

    /**
     * Remember a successful solution
     */
    async rememberSolution(params: {
        problem: string;
        solution: string;
        context: string;
        projectId?: string;
        tags?: string[];
    }): Promise<MemoryEntry> {
        return this.store({
            type: 'solution',
            key: params.problem,
            value: {
                solution: params.solution,
                context: params.context,
            },
            metadata: {
                source: 'agent',
                projectId: params.projectId,
                confidence: 1.0,
                tags: ['solution', ...(params.tags || [])],
            },
        });
    }

    /**
     * Find similar solutions
     */
    async findSimilarSolutions(problem: string): Promise<MemoryEntry[]> {
        const keywords = problem.toLowerCase().split(/\s+/);
        const solutions = await this.query({ type: 'solution', limit: 20 });

        return solutions.filter(entry => {
            const entryKeywords = entry.key.toLowerCase();
            return keywords.some(kw => entryKeywords.includes(kw));
        }).slice(0, 5);
    }

    /**
     * Store a learned pattern
     */
    async learnPattern(params: {
        name: string;
        pattern: any;
        successRate: number;
        projectId?: string;
    }): Promise<MemoryEntry> {
        return this.store({
            type: 'learning',
            key: `pattern:${params.name}`,
            value: {
                pattern: params.pattern,
                successRate: params.successRate,
            },
            metadata: {
                source: 'agent',
                projectId: params.projectId,
                confidence: params.successRate,
                tags: ['pattern', 'learned'],
            },
        });
    }

    /**
     * Get memory statistics
     */
    getStats(): MemoryStats {
        const entries = [...this.entries.values()];
        const byType: Record<string, number> = {};

        let oldest: Date | null = null;
        let newest: Date | null = null;

        for (const entry of entries) {
            byType[entry.type] = (byType[entry.type] || 0) + 1;

            if (!oldest || entry.createdAt < oldest) {
                oldest = entry.createdAt;
            }
            if (!newest || entry.createdAt > newest) {
                newest = entry.createdAt;
            }
        }

        // Estimate size
        const totalSize = JSON.stringify([...this.entries.values()]).length;

        return {
            totalEntries: entries.length,
            byType,
            oldestEntry: oldest,
            newestEntry: newest,
            totalSize,
        };
    }

    /**
     * Consolidate memories - merge similar entries
     */
    async consolidate(): Promise<{ merged: number; deleted: number }> {
        let merged = 0;
        let deleted = 0;

        // Remove expired entries
        const now = new Date();
        for (const [id, entry] of this.entries) {
            if (entry.metadata.expires && entry.metadata.expires < now) {
                this.entries.delete(id);
                deleted++;
            }
        }

        // Remove low-confidence entries that haven't been accessed
        for (const [id, entry] of this.entries) {
            if (entry.metadata.confidence < 0.3 && entry.accessCount === 0) {
                this.entries.delete(id);
                deleted++;
            }
        }

        this.scheduleSave();
        this.emit('memory:consolidated', { merged, deleted });

        return { merged, deleted };
    }

    /**
     * Clear all memories of a type
     */
    async clearType(type: MemoryType): Promise<number> {
        let count = 0;
        for (const [id, entry] of this.entries) {
            if (entry.type === type) {
                this.entries.delete(id);
                count++;
            }
        }
        this.scheduleSave();
        return count;
    }

    /**
     * Export memories
     */
    async exportMemories(): Promise<MemoryEntry[]> {
        return [...this.entries.values()];
    }

    /**
     * Import memories
     */
    async importMemories(entries: MemoryEntry[]): Promise<number> {
        let imported = 0;
        for (const entry of entries) {
            if (!this.entries.has(entry.id)) {
                this.entries.set(entry.id, entry);
                imported++;
            }
        }
        this.scheduleSave();
        return imported;
    }

    /**
     * Force save
     */
    async forceSave(): Promise<void> {
        this.isDirty = true;
        await this.saveToDisk();
    }
}

export default PersistentMemory;
