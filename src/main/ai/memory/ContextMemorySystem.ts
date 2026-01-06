/**
 * Context Memory System
 * 
 * Provides persistent, semantic memory for conversations and context
 * across sessions with intelligent retrieval and summarization.
 */

import { EventEmitter } from 'events';

export interface Memory {
    id: string;
    type: MemoryType;
    content: string;
    embedding?: number[];
    metadata: MemoryMetadata;
    importance: number; // 0-1
    accessCount: number;
    lastAccessed: Date;
    createdAt: Date;
    expiresAt?: Date;
}

export type MemoryType =
    | 'conversation'
    | 'fact'
    | 'preference'
    | 'skill'
    | 'project'
    | 'decision'
    | 'error'
    | 'success';

export interface MemoryMetadata {
    source: string;
    tags: string[];
    entities: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence: number;
    projectId?: string;
    sessionId?: string;
}

export interface MemoryQuery {
    text?: string;
    types?: MemoryType[];
    tags?: string[];
    minImportance?: number;
    limit?: number;
    includeExpired?: boolean;
}

export interface MemorySummary {
    totalMemories: number;
    byType: { type: MemoryType; count: number }[];
    recentTopics: string[];
    keyDecisions: Memory[];
    activeProjects: string[];
}

export interface ConversationContext {
    recentMemories: Memory[];
    relevantFacts: Memory[];
    userPreferences: Memory[];
    projectContext?: Memory[];
}

export class ContextMemorySystem extends EventEmitter {
    private static instance: ContextMemorySystem;
    private memories: Map<string, Memory> = new Map();
    private shortTermBuffer: Memory[] = [];
    private consolidationThreshold = 10;

    private constructor() {
        super();
    }

    static getInstance(): ContextMemorySystem {
        if (!ContextMemorySystem.instance) {
            ContextMemorySystem.instance = new ContextMemorySystem();
        }
        return ContextMemorySystem.instance;
    }

    // ========================================================================
    // MEMORY STORAGE
    // ========================================================================

    store(content: string, type: MemoryType, metadata: Partial<MemoryMetadata> = {}): Memory {
        const memory: Memory = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            content,
            metadata: {
                source: 'user',
                tags: [],
                entities: this.extractEntities(content),
                confidence: 1,
                ...metadata,
            },
            importance: this.calculateImportance(content, type),
            accessCount: 0,
            lastAccessed: new Date(),
            createdAt: new Date(),
        };

        // Add to short-term buffer first
        this.shortTermBuffer.push(memory);

        // Consolidate if buffer is full
        if (this.shortTermBuffer.length >= this.consolidationThreshold) {
            this.consolidate();
        }

        this.memories.set(memory.id, memory);
        this.emit('memory:stored', memory);
        return memory;
    }

    private extractEntities(content: string): string[] {
        const entities: string[] = [];

        // Extract capitalized words (potential names)
        const names = content.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || [];
        entities.push(...names.slice(0, 5));

        // Extract file paths
        const paths = content.match(/[\w\/\-\.]+\.(ts|js|tsx|jsx|py|go|rs|java)/g) || [];
        entities.push(...paths.slice(0, 5));

        // Extract URLs
        const urls = content.match(/https?:\/\/[^\s]+/g) || [];
        entities.push(...urls.slice(0, 3));

        // Extract technical terms
        const techTerms = content.match(/\b(API|SDK|CLI|GUI|REST|GraphQL|SQL|NoSQL|Docker|K8s|AWS|GCP|Azure)\b/gi) || [];
        entities.push(...techTerms.slice(0, 5));

        return [...new Set(entities)];
    }

    private calculateImportance(content: string, type: MemoryType): number {
        let importance = 0.5;

        // Type-based importance
        const typeWeights: Record<MemoryType, number> = {
            decision: 0.9,
            error: 0.8,
            success: 0.7,
            skill: 0.7,
            preference: 0.6,
            project: 0.6,
            fact: 0.5,
            conversation: 0.3,
        };
        importance = typeWeights[type] || 0.5;

        // Content-based adjustments
        if (content.length > 500) importance += 0.1;
        if (content.includes('important') || content.includes('critical')) importance += 0.1;
        if (content.includes('remember') || content.includes('note')) importance += 0.1;

        return Math.min(1, importance);
    }

    // ========================================================================
    // MEMORY RETRIEVAL
    // ========================================================================

    retrieve(query: MemoryQuery): Memory[] {
        let results = Array.from(this.memories.values());

        // Filter by type
        if (query.types && query.types.length > 0) {
            results = results.filter(m => query.types!.includes(m.type));
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter(m =>
                query.tags!.some(tag => m.metadata.tags.includes(tag))
            );
        }

        // Filter by importance
        if (query.minImportance !== undefined) {
            results = results.filter(m => m.importance >= query.minImportance!);
        }

        // Filter expired
        if (!query.includeExpired) {
            const now = new Date();
            results = results.filter(m => !m.expiresAt || m.expiresAt > now);
        }

        // Text search (simple)
        if (query.text) {
            const searchTerms = query.text.toLowerCase().split(/\s+/);
            results = results.filter(m => {
                const content = m.content.toLowerCase();
                return searchTerms.some(term => content.includes(term));
            });

            // Sort by relevance
            results.sort((a, b) => {
                const aScore = searchTerms.filter(t => a.content.toLowerCase().includes(t)).length;
                const bScore = searchTerms.filter(t => b.content.toLowerCase().includes(t)).length;
                return bScore - aScore;
            });
        } else {
            // Sort by recency and importance
            results.sort((a, b) => {
                const aScore = a.importance * 0.5 + (1 - (Date.now() - a.lastAccessed.getTime()) / 86400000) * 0.5;
                const bScore = b.importance * 0.5 + (1 - (Date.now() - b.lastAccessed.getTime()) / 86400000) * 0.5;
                return bScore - aScore;
            });
        }

        // Update access counts
        const limit = query.limit || 10;
        const selected = results.slice(0, limit);
        for (const memory of selected) {
            memory.accessCount++;
            memory.lastAccessed = new Date();
        }

        return selected;
    }

    getById(id: string): Memory | undefined {
        const memory = this.memories.get(id);
        if (memory) {
            memory.accessCount++;
            memory.lastAccessed = new Date();
        }
        return memory;
    }

    // ========================================================================
    // CONTEXT BUILDING
    // ========================================================================

    buildContext(currentInput: string, projectId?: string): ConversationContext {
        // Get recent conversation memories
        const recentMemories = this.retrieve({
            types: ['conversation'],
            limit: 5,
        });

        // Get relevant facts based on current input
        const relevantFacts = this.retrieve({
            text: currentInput,
            types: ['fact', 'decision'],
            minImportance: 0.5,
            limit: 5,
        });

        // Get user preferences
        const userPreferences = this.retrieve({
            types: ['preference'],
            minImportance: 0.3,
            limit: 5,
        });

        // Get project-specific context if provided
        let projectContext: Memory[] | undefined;
        if (projectId) {
            projectContext = Array.from(this.memories.values())
                .filter(m => m.metadata.projectId === projectId)
                .slice(-10);
        }

        return {
            recentMemories,
            relevantFacts,
            userPreferences,
            projectContext,
        };
    }

    // ========================================================================
    // MEMORY MANAGEMENT
    // ========================================================================

    private consolidate(): void {
        // Move important memories to long-term storage
        for (const memory of this.shortTermBuffer) {
            if (memory.importance >= 0.5) {
                // Already stored, just tag for consolidation
                memory.metadata.tags.push('consolidated');
            }
        }

        // Clear buffer but keep in main storage
        this.shortTermBuffer = [];
        this.emit('memory:consolidated');
    }

    forget(id: string): boolean {
        const deleted = this.memories.delete(id);
        if (deleted) {
            this.emit('memory:forgotten', id);
        }
        return deleted;
    }

    decay(): void {
        // Reduce importance of old, rarely-accessed memories
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (const memory of this.memories.values()) {
            const ageInDays = (now - memory.createdAt.getTime()) / dayMs;
            const accessRecency = (now - memory.lastAccessed.getTime()) / dayMs;

            // Decay importance for old, unaccessed memories
            if (ageInDays > 7 && accessRecency > 3) {
                memory.importance *= 0.95;
            }

            // Remove very low importance memories
            if (memory.importance < 0.1 && memory.type === 'conversation') {
                this.memories.delete(memory.id);
            }
        }

        this.emit('memory:decayed');
    }

    // ========================================================================
    // SUMMARIZATION
    // ========================================================================

    getSummary(): MemorySummary {
        const memories = Array.from(this.memories.values());

        // Count by type
        const typeCounts = new Map<MemoryType, number>();
        for (const memory of memories) {
            typeCounts.set(memory.type, (typeCounts.get(memory.type) || 0) + 1);
        }

        // Extract recent topics from tags and entities
        const recentTopics = new Set<string>();
        const recentMemories = memories
            .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
            .slice(0, 20);

        for (const memory of recentMemories) {
            memory.metadata.tags.forEach(t => recentTopics.add(t));
            memory.metadata.entities.slice(0, 2).forEach(e => recentTopics.add(e));
        }

        // Get key decisions
        const keyDecisions = memories
            .filter(m => m.type === 'decision')
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5);

        // Get active projects
        const activeProjects = [...new Set(
            memories
                .filter(m => m.metadata.projectId)
                .map(m => m.metadata.projectId!)
        )].slice(0, 5);

        return {
            totalMemories: memories.length,
            byType: Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count })),
            recentTopics: [...recentTopics].slice(0, 10),
            keyDecisions,
            activeProjects,
        };
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    export(): { memories: Memory[] } {
        return {
            memories: Array.from(this.memories.values()),
        };
    }

    import(data: { memories: Memory[] }): void {
        for (const memory of data.memories) {
            memory.createdAt = new Date(memory.createdAt);
            memory.lastAccessed = new Date(memory.lastAccessed);
            if (memory.expiresAt) {
                memory.expiresAt = new Date(memory.expiresAt);
            }
            this.memories.set(memory.id, memory);
        }
        this.emit('memory:imported', data.memories.length);
    }

    clear(): void {
        this.memories.clear();
        this.shortTermBuffer = [];
        this.emit('memory:cleared');
    }

    getStats(): { total: number; byType: Record<string, number>; avgImportance: number } {
        const memories = Array.from(this.memories.values());
        const byType: Record<string, number> = {};
        let totalImportance = 0;

        for (const memory of memories) {
            byType[memory.type] = (byType[memory.type] || 0) + 1;
            totalImportance += memory.importance;
        }

        return {
            total: memories.length,
            byType,
            avgImportance: memories.length > 0 ? totalImportance / memories.length : 0,
        };
    }
}

export const contextMemorySystem = ContextMemorySystem.getInstance();
