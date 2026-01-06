/**
 * UnifiedMemory - Consolidated Memory System Interface
 * 
 * Provides a single facade to all memory subsystems:
 * - Working memory (current session)
 * - Short-term memory (recent sessions)
 * - Long-term memory (persistent)
 * - Episodic memory (past interactions)
 * - Semantic memory (knowledge base)
 * - Procedural memory (learned workflows)
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type MemoryType =
    | 'working'     // Current task context
    | 'shortTerm'   // Recent sessions (hours)
    | 'longTerm'    // Persistent storage (days/weeks)
    | 'episodic'    // Past interactions with outcomes
    | 'semantic'    // Knowledge and facts
    | 'procedural'; // Learned skills and workflows

export interface MemoryEntry {
    id: string;
    type: MemoryType;
    content: string;
    metadata: Record<string, any>;
    embedding?: number[];
    createdAt: Date;
    lastAccessed?: Date;
    accessCount: number;
    relevanceScore: number;
    ttl?: number; // Time to live in ms
}

export interface MemoryQuery {
    type?: MemoryType;
    query?: string;
    limit?: number;
    minRelevance?: number;
    since?: Date;
}

export interface MemoryStats {
    byType: Record<MemoryType, number>;
    totalEntries: number;
    totalSizeBytes: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}

// ============================================================================
// UNIFIED MEMORY SYSTEM
// ============================================================================

export class UnifiedMemory extends EventEmitter {
    private static instance: UnifiedMemory;

    // Memory stores by type
    private workingMemory: Map<string, MemoryEntry> = new Map();
    private shortTermMemory: Map<string, MemoryEntry> = new Map();
    private longTermMemory: Map<string, MemoryEntry> = new Map();
    private episodicMemory: Map<string, MemoryEntry> = new Map();
    private semanticMemory: Map<string, MemoryEntry> = new Map();
    private proceduralMemory: Map<string, MemoryEntry> = new Map();

    // TTL defaults (in milliseconds)
    private readonly TTL_WORKING = 30 * 60 * 1000;        // 30 minutes
    private readonly TTL_SHORT_TERM = 24 * 60 * 60 * 1000; // 24 hours
    private readonly TTL_LONG_TERM = 30 * 24 * 60 * 60 * 1000; // 30 days

    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.startCleanup();
    }

    static getInstance(): UnifiedMemory {
        if (!UnifiedMemory.instance) {
            UnifiedMemory.instance = new UnifiedMemory();
        }
        return UnifiedMemory.instance;
    }

    // ========================================================================
    // STORAGE
    // ========================================================================

    /**
     * Store a memory entry
     */
    store(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessCount'>): string {
        const id = this.generateId();
        const now = new Date();

        const fullEntry: MemoryEntry = {
            ...entry,
            id,
            createdAt: now,
            accessCount: 0,
            ttl: entry.ttl || this.getDefaultTTL(entry.type)
        };

        const store = this.getStore(entry.type);
        store.set(id, fullEntry);

        this.emit('memory:stored', { id, type: entry.type });
        console.log(`🧠 [UnifiedMemory] Stored ${entry.type}: ${id.substring(0, 8)}...`);

        return id;
    }

    /**
     * Store a thought in working memory
     */
    storeThought(content: string, metadata?: Record<string, any>): string {
        return this.store({
            type: 'working',
            content,
            metadata: { ...metadata, category: 'thought' },
            relevanceScore: 1.0
        });
    }

    /**
     * Store a decision with context
     */
    storeDecision(
        decision: string,
        alternatives: string[],
        rationale: string,
        outcome?: 'success' | 'failure' | 'pending'
    ): string {
        return this.store({
            type: 'episodic',
            content: decision,
            metadata: {
                category: 'decision',
                alternatives,
                rationale,
                outcome
            },
            relevanceScore: 0.9
        });
    }

    /**
     * Store a learned pattern
     */
    storePattern(
        pattern: string,
        context: string,
        successRate: number
    ): string {
        return this.store({
            type: 'procedural',
            content: pattern,
            metadata: {
                category: 'pattern',
                context,
                successRate,
                usageCount: 0
            },
            relevanceScore: successRate
        });
    }

    /**
     * Store knowledge/fact
     */
    storeKnowledge(
        fact: string,
        source?: string,
        confidence: number = 1.0
    ): string {
        return this.store({
            type: 'semantic',
            content: fact,
            metadata: {
                category: 'knowledge',
                source,
                confidence
            },
            relevanceScore: confidence
        });
    }

    // ========================================================================
    // RETRIEVAL
    // ========================================================================

    /**
     * Retrieve a specific memory by ID
     */
    get(id: string): MemoryEntry | undefined {
        for (const store of this.getAllStores()) {
            const entry = store.get(id);
            if (entry) {
                entry.accessCount++;
                entry.lastAccessed = new Date();
                return entry;
            }
        }
        return undefined;
    }

    /**
     * Query memories
     */
    query(options: MemoryQuery): MemoryEntry[] {
        let results: MemoryEntry[] = [];

        // Select stores to search
        const stores = options.type
            ? [this.getStore(options.type)]
            : this.getAllStores();

        for (const store of stores) {
            results.push(...Array.from(store.values()));
        }

        // Filter by query string (simple text matching)
        if (options.query) {
            const queryLower = options.query.toLowerCase();
            results = results.filter(e =>
                e.content.toLowerCase().includes(queryLower) ||
                JSON.stringify(e.metadata).toLowerCase().includes(queryLower)
            );
        }

        // Filter by date
        if (options.since) {
            results = results.filter(e => e.createdAt >= options.since!);
        }

        // Filter by relevance
        if (options.minRelevance !== undefined) {
            results = results.filter(e => e.relevanceScore >= options.minRelevance!);
        }

        // Sort by relevance and recency
        results.sort((a, b) => {
            const relevanceDiff = b.relevanceScore - a.relevanceScore;
            if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        // Limit results
        return results.slice(0, options.limit || 50);
    }

    /**
     * Search working memory for current context
     */
    getCurrentContext(limit: number = 10): MemoryEntry[] {
        return this.query({ type: 'working', limit });
    }

    /**
     * Search for similar past experiences
     */
    findSimilarExperiences(query: string, limit: number = 5): MemoryEntry[] {
        return this.query({
            type: 'episodic',
            query,
            limit,
            minRelevance: 0.5
        });
    }

    /**
     * Get learned patterns for a task type
     */
    getLearnedPatterns(context: string, limit: number = 5): MemoryEntry[] {
        return this.query({ type: 'procedural', query: context, limit })
            .filter(e => e.metadata.successRate > 0.7);
    }

    /**
     * Search semantic knowledge
     */
    searchKnowledge(query: string, limit: number = 10): MemoryEntry[] {
        return this.query({ type: 'semantic', query, limit });
    }

    // ========================================================================
    // MAINTENANCE
    // ========================================================================

    /**
     * Forget a specific memory
     */
    forget(id: string): boolean {
        for (const store of this.getAllStores()) {
            if (store.delete(id)) {
                this.emit('memory:forgotten', { id });
                return true;
            }
        }
        return false;
    }

    /**
     * Clear working memory (new session)
     */
    clearWorkingMemory(): void {
        const count = this.workingMemory.size;
        this.workingMemory.clear();
        this.emit('memory:cleared', { type: 'working', count });
    }

    /**
     * Promote important working memories to short-term
     */
    promoteToShortTerm(id: string): boolean {
        const entry = this.workingMemory.get(id);
        if (entry) {
            entry.type = 'shortTerm';
            entry.ttl = this.TTL_SHORT_TERM;
            this.shortTermMemory.set(id, entry);
            this.workingMemory.delete(id);
            this.emit('memory:promoted', { id, from: 'working', to: 'shortTerm' });
            return true;
        }
        return false;
    }

    /**
     * Promote to long-term memory
     */
    promoteToLongTerm(id: string): boolean {
        for (const store of [this.workingMemory, this.shortTermMemory]) {
            const entry = store.get(id);
            if (entry) {
                entry.type = 'longTerm';
                entry.ttl = this.TTL_LONG_TERM;
                this.longTermMemory.set(id, entry);
                store.delete(id);
                this.emit('memory:promoted', { id, to: 'longTerm' });
                return true;
            }
        }
        return false;
    }

    /**
     * Update relevance score based on usage
     */
    updateRelevance(id: string, delta: number): void {
        const entry = this.get(id);
        if (entry) {
            entry.relevanceScore = Math.max(0, Math.min(1, entry.relevanceScore + delta));
        }
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get memory statistics
     */
    getStats(): MemoryStats {
        const byType: Record<MemoryType, number> = {
            working: this.workingMemory.size,
            shortTerm: this.shortTermMemory.size,
            longTerm: this.longTermMemory.size,
            episodic: this.episodicMemory.size,
            semantic: this.semanticMemory.size,
            procedural: this.proceduralMemory.size
        };

        const allEntries = this.query({});
        let totalSize = 0;
        let oldest: Date | undefined;
        let newest: Date | undefined;

        for (const entry of allEntries) {
            totalSize += JSON.stringify(entry).length;
            if (!oldest || entry.createdAt < oldest) oldest = entry.createdAt;
            if (!newest || entry.createdAt > newest) newest = entry.createdAt;
        }

        return {
            byType,
            totalEntries: allEntries.length,
            totalSizeBytes: totalSize,
            oldestEntry: oldest,
            newestEntry: newest
        };
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private getStore(type: MemoryType): Map<string, MemoryEntry> {
        switch (type) {
            case 'working': return this.workingMemory;
            case 'shortTerm': return this.shortTermMemory;
            case 'longTerm': return this.longTermMemory;
            case 'episodic': return this.episodicMemory;
            case 'semantic': return this.semanticMemory;
            case 'procedural': return this.proceduralMemory;
        }
    }

    private getAllStores(): Map<string, MemoryEntry>[] {
        return [
            this.workingMemory,
            this.shortTermMemory,
            this.longTermMemory,
            this.episodicMemory,
            this.semanticMemory,
            this.proceduralMemory
        ];
    }

    private getDefaultTTL(type: MemoryType): number {
        switch (type) {
            case 'working': return this.TTL_WORKING;
            case 'shortTerm': return this.TTL_SHORT_TERM;
            case 'longTerm': return this.TTL_LONG_TERM;
            case 'episodic': return this.TTL_LONG_TERM;
            case 'semantic': return 0; // No expiry
            case 'procedural': return 0; // No expiry
        }
    }

    private generateId(): string {
        return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute
    }

    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const store of this.getAllStores()) {
            for (const [id, entry] of store) {
                if (entry.ttl && now - entry.createdAt.getTime() > entry.ttl) {
                    store.delete(id);
                    cleaned++;
                }
            }
        }

        if (cleaned > 0) {
            console.log(`🧠 [UnifiedMemory] Cleaned up ${cleaned} expired entries`);
        }
    }

    /**
     * Clear all memories (for testing)
     */
    clear(): void {
        for (const store of this.getAllStores()) {
            store.clear();
        }
    }
}

// Export singleton
export const unifiedMemory = UnifiedMemory.getInstance();
