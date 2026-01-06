/**
 * Agent Memory
 * 
 * Persistent memory system for learning from codebase patterns,
 * user preferences, and review feedback.
 * Inspired by Windsurf and Manus AI.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryEntry {
    id: string;
    type: 'pattern' | 'preference' | 'feedback' | 'context' | 'fact';
    content: string;
    metadata: Record<string, any>;
    importance: number; // 0-1 score
    timestamp: Date;
    accessCount: number;
    lastAccessed?: Date;
    source?: string;
    tags: string[];
}

export interface CodingPattern {
    name: string;
    pattern: string;
    language: string;
    frequency: number;
    examples: string[];
    lastSeen: Date;
}

export interface UserPreference {
    key: string;
    value: any;
    source: 'explicit' | 'inferred';
    confidence: number;
}

export interface LearningEntry {
    input: string;
    output: string;
    feedback: 'positive' | 'negative' | 'neutral';
    correction?: string;
    timestamp: Date;
}

// ============================================================================
// AGENT MEMORY
// ============================================================================

export class AgentMemory extends EventEmitter {
    private static instance: AgentMemory;
    private memories: Map<string, MemoryEntry> = new Map();
    private patterns: Map<string, CodingPattern> = new Map();
    private preferences: Map<string, UserPreference> = new Map();
    private learnings: LearningEntry[] = [];
    private maxMemories = 10000;
    private persistPath: string = '';

    private constructor() {
        super();
    }

    static getInstance(): AgentMemory {
        if (!AgentMemory.instance) {
            AgentMemory.instance = new AgentMemory();
        }
        return AgentMemory.instance;
    }

    /**
     * Set persistence path
     */
    setPersistPath(dir: string): void {
        this.persistPath = dir;
    }

    // ========================================================================
    // MEMORY OPERATIONS
    // ========================================================================

    /**
     * Store a memory
     */
    remember(entry: Omit<MemoryEntry, 'id' | 'accessCount' | 'timestamp'>): string {
        const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const memory: MemoryEntry = {
            ...entry,
            id,
            timestamp: new Date(),
            accessCount: 0,
        };

        // Prune if at capacity
        if (this.memories.size >= this.maxMemories) {
            this.pruneMemories();
        }

        this.memories.set(id, memory);
        this.emit('memory:stored', memory);

        return id;
    }

    /**
     * Recall memories by query
     */
    recall(query: string, options: {
        limit?: number;
        type?: MemoryEntry['type'];
        tags?: string[];
        minImportance?: number;
    } = {}): MemoryEntry[] {
        const { limit = 10, type, tags, minImportance = 0 } = options;
        const queryTerms = query.toLowerCase().split(/\s+/);

        const results: Array<{ memory: MemoryEntry; score: number }> = [];

        for (const memory of this.memories.values()) {
            // Filter by type
            if (type && memory.type !== type) continue;

            // Filter by importance
            if (memory.importance < minImportance) continue;

            // Filter by tags
            if (tags && tags.length > 0) {
                if (!tags.some(t => memory.tags.includes(t))) continue;
            }

            // Score by query match
            let score = 0;
            const content = memory.content.toLowerCase();
            for (const term of queryTerms) {
                if (content.includes(term)) score += 1;
            }

            // Boost by importance and recency
            score *= memory.importance;
            const age = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
            score *= Math.exp(-age / 30); // Decay over 30 days

            if (score > 0) {
                results.push({ memory, score });
            }
        }

        // Sort by score and return top N
        const topResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(r => {
                // Update access tracking
                r.memory.accessCount++;
                r.memory.lastAccessed = new Date();
                return r.memory;
            });

        this.emit('memory:recalled', { query, count: topResults.length });
        return topResults;
    }

    /**
     * Forget a memory
     */
    forget(id: string): boolean {
        const deleted = this.memories.delete(id);
        if (deleted) this.emit('memory:forgotten', { id });
        return deleted;
    }

    /**
     * Prune low-importance, rarely-accessed memories
     */
    private pruneMemories(): void {
        const entries = Array.from(this.memories.entries());

        // Score each memory
        const scored = entries.map(([id, mem]) => ({
            id,
            score: mem.importance * Math.log(mem.accessCount + 1),
        }));

        // Remove lowest 10%
        const toRemove = scored
            .sort((a, b) => a.score - b.score)
            .slice(0, Math.floor(entries.length * 0.1))
            .map(s => s.id);

        toRemove.forEach(id => this.memories.delete(id));
        this.emit('memory:pruned', { count: toRemove.length });
    }

    // ========================================================================
    // PATTERN LEARNING
    // ========================================================================

    /**
     * Learn a coding pattern
     */
    learnPattern(pattern: Omit<CodingPattern, 'frequency' | 'lastSeen'>): void {
        const existing = this.patterns.get(pattern.name);

        if (existing) {
            existing.frequency++;
            existing.lastSeen = new Date();
            existing.examples = [...new Set([...existing.examples, ...pattern.examples])].slice(0, 5);
        } else {
            this.patterns.set(pattern.name, {
                ...pattern,
                frequency: 1,
                lastSeen: new Date(),
            });
        }

        this.emit('pattern:learned', { name: pattern.name });
    }

    /**
     * Get patterns by language
     */
    getPatterns(language?: string): CodingPattern[] {
        const patterns = Array.from(this.patterns.values());
        if (language) {
            return patterns.filter(p => p.language === language);
        }
        return patterns;
    }

    // ========================================================================
    // USER PREFERENCES
    // ========================================================================

    /**
     * Set a preference
     */
    setPreference(key: string, value: any, inferred = false): void {
        const existing = this.preferences.get(key);

        // Explicit preferences override inferred
        if (existing && existing.source === 'explicit' && inferred) {
            return;
        }

        this.preferences.set(key, {
            key,
            value,
            source: inferred ? 'inferred' : 'explicit',
            confidence: inferred ? 0.7 : 1.0,
        });

        this.emit('preference:set', { key, value });
    }

    /**
     * Get a preference
     */
    getPreference<T = any>(key: string, defaultValue?: T): T | undefined {
        const pref = this.preferences.get(key);
        return pref ? pref.value : defaultValue;
    }

    /**
     * Get all preferences
     */
    getAllPreferences(): UserPreference[] {
        return Array.from(this.preferences.values());
    }

    // ========================================================================
    // LEARNING FROM FEEDBACK
    // ========================================================================

    /**
     * Record learning from user feedback
     */
    recordLearning(learning: Omit<LearningEntry, 'timestamp'>): void {
        this.learnings.push({
            ...learning,
            timestamp: new Date(),
        });

        // Store as memory
        if (learning.feedback === 'negative' && learning.correction) {
            this.remember({
                type: 'feedback',
                content: `When user asked "${learning.input}", preferred "${learning.correction}" over "${learning.output}"`,
                importance: 0.8,
                metadata: { learning },
                tags: ['feedback', 'correction'],
            });
        }

        this.emit('learning:recorded', { feedback: learning.feedback });
    }

    /**
     * Get learnings for improving responses
     */
    getRelevantLearnings(context: string): LearningEntry[] {
        const contextTerms = context.toLowerCase().split(/\s+/);

        return this.learnings
            .filter(l => {
                const inputTerms = l.input.toLowerCase();
                return contextTerms.some(t => inputTerms.includes(t));
            })
            .slice(-20); // Last 20 relevant learnings
    }

    // ========================================================================
    // PERSISTENCE
    // ========================================================================

    /**
     * Save memory to disk
     */
    async save(): Promise<void> {
        if (!this.persistPath) return;

        const data = {
            memories: Array.from(this.memories.entries()),
            patterns: Array.from(this.patterns.entries()),
            preferences: Array.from(this.preferences.entries()),
            learnings: this.learnings.slice(-1000), // Keep last 1000
        };

        await fs.mkdir(this.persistPath, { recursive: true });
        await fs.writeFile(
            path.join(this.persistPath, 'agent-memory.json'),
            JSON.stringify(data, null, 2)
        );

        this.emit('memory:saved');
    }

    /**
     * Load memory from disk
     */
    async load(): Promise<void> {
        if (!this.persistPath) return;

        try {
            const filePath = path.join(this.persistPath, 'agent-memory.json');
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            this.memories = new Map(data.memories);
            this.patterns = new Map(data.patterns);
            this.preferences = new Map(data.preferences);
            this.learnings = data.learnings || [];

            // Convert dates
            for (const memory of this.memories.values()) {
                memory.timestamp = new Date(memory.timestamp);
                if (memory.lastAccessed) {
                    memory.lastAccessed = new Date(memory.lastAccessed);
                }
            }

            this.emit('memory:loaded');
        } catch {
            // No saved memory, start fresh
        }
    }

    // ========================================================================
    // CONTEXT GENERATION
    // ========================================================================

    /**
     * Generate context prompt from memories
     */
    generateContextPrompt(): string {
        const sections: string[] = [];

        // Add key preferences
        const prefs = this.getAllPreferences();
        if (prefs.length > 0) {
            sections.push('USER PREFERENCES:\n' +
                prefs.map(p => `- ${p.key}: ${p.value}`).join('\n'));
        }

        // Add common patterns
        const topPatterns = Array.from(this.patterns.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
        if (topPatterns.length > 0) {
            sections.push('COMMON PATTERNS:\n' +
                topPatterns.map(p => `- ${p.name} (${p.language})`).join('\n'));
        }

        // Add recent learnings
        const recentLearnings = this.learnings.slice(-5);
        if (recentLearnings.length > 0) {
            sections.push('RECENT FEEDBACK:\n' +
                recentLearnings.map(l =>
                    `- ${l.feedback}: ${l.correction || l.input}`
                ).join('\n'));
        }

        return sections.join('\n\n');
    }

    /**
     * Get memory statistics
     */
    getStats(): {
        memories: number;
        patterns: number;
        preferences: number;
        learnings: number;
    } {
        return {
            memories: this.memories.size,
            patterns: this.patterns.size,
            preferences: this.preferences.size,
            learnings: this.learnings.length,
        };
    }
}

// Export singleton
export const agentMemory = AgentMemory.getInstance();
