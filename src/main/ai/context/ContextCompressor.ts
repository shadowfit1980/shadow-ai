/**
 * Context Compressor
 * 
 * Smart context window management for long-running agent tasks.
 * Implements sliding window, semantic compression, and priority-based retention.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type ContentPriority = 'critical' | 'high' | 'medium' | 'low' | 'background';

export interface ContextItem {
    id: string;
    content: string;
    type: 'code' | 'error' | 'decision' | 'log' | 'result' | 'instruction' | 'other';
    priority: ContentPriority;
    tokens: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface CompressionResult {
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
    itemsRemoved: number;
    itemsSummarized: number;
}

export interface ContextWindow {
    items: ContextItem[];
    totalTokens: number;
    maxTokens: number;
    lastCompressed?: Date;
}

export interface CompressionConfig {
    maxTokens: number;
    targetTokens: number;
    priorityWeights: Record<ContentPriority, number>;
    minItemsToKeep: number;
    summaryEnabled: boolean;
    decayRate: number; // 0-1, how fast old items lose priority
}

// ============================================================================
// CONTEXT COMPRESSOR
// ============================================================================

export class ContextCompressor extends EventEmitter {
    private static instance: ContextCompressor;
    private windows: Map<string, ContextWindow> = new Map();

    private config: CompressionConfig = {
        maxTokens: 8000,
        targetTokens: 6000,
        priorityWeights: {
            critical: 100,
            high: 75,
            medium: 50,
            low: 25,
            background: 10,
        },
        minItemsToKeep: 5,
        summaryEnabled: true,
        decayRate: 0.1,
    };

    private constructor() {
        super();
    }

    static getInstance(): ContextCompressor {
        if (!ContextCompressor.instance) {
            ContextCompressor.instance = new ContextCompressor();
        }
        return ContextCompressor.instance;
    }

    // -------------------------------------------------------------------------
    // Window Management
    // -------------------------------------------------------------------------

    /**
     * Create or get a context window
     */
    getWindow(windowId: string): ContextWindow {
        if (!this.windows.has(windowId)) {
            this.windows.set(windowId, {
                items: [],
                totalTokens: 0,
                maxTokens: this.config.maxTokens,
            });
        }
        return this.windows.get(windowId)!;
    }

    /**
     * Add content to context window
     */
    addToContext(
        windowId: string,
        content: string,
        options?: {
            type?: ContextItem['type'];
            priority?: ContentPriority;
            metadata?: Record<string, any>;
        }
    ): ContextItem {
        const window = this.getWindow(windowId);
        const tokens = this.estimateTokens(content);

        const item: ContextItem = {
            id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            type: options?.type || 'other',
            priority: options?.priority || this.inferPriority(content, options?.type),
            tokens,
            timestamp: new Date(),
            metadata: options?.metadata,
        };

        window.items.push(item);
        window.totalTokens += tokens;

        // Auto-compress if over limit
        if (window.totalTokens > this.config.maxTokens) {
            this.compress(windowId);
        }

        this.emit('itemAdded', { windowId, item });
        return item;
    }

    /**
     * Remove item from context
     */
    removeFromContext(windowId: string, itemId: string): boolean {
        const window = this.windows.get(windowId);
        if (!window) return false;

        const index = window.items.findIndex(i => i.id === itemId);
        if (index >= 0) {
            const removed = window.items.splice(index, 1)[0];
            window.totalTokens -= removed.tokens;
            this.emit('itemRemoved', { windowId, item: removed });
            return true;
        }
        return false;
    }

    /**
     * Clear a context window
     */
    clearWindow(windowId: string): void {
        this.windows.delete(windowId);
        this.emit('windowCleared', windowId);
    }

    // -------------------------------------------------------------------------
    // Compression Strategies
    // -------------------------------------------------------------------------

    /**
     * Compress context window to fit within limits
     */
    compress(windowId: string): CompressionResult {
        const window = this.getWindow(windowId);
        const originalTokens = window.totalTokens;
        let itemsRemoved = 0;
        let itemsSummarized = 0;

        // Apply decay to priorities based on age
        this.applyPriorityDecay(window);

        // Sort items by effective priority (weighted by type importance)
        const sortedItems = this.sortByPriority(window.items);

        // Phase 1: Remove low-priority items until under target
        while (window.totalTokens > this.config.targetTokens &&
            window.items.length > this.config.minItemsToKeep) {
            const lowestPriority = sortedItems.pop();
            if (lowestPriority) {
                this.removeFromContext(windowId, lowestPriority.id);
                itemsRemoved++;
            } else {
                break;
            }
        }

        // Phase 2: Summarize remaining items if still over limit
        if (window.totalTokens > this.config.targetTokens && this.config.summaryEnabled) {
            const summarized = this.summarizeContext(window);
            if (summarized) {
                itemsSummarized = window.items.length - 1;
                window.items = [summarized];
                window.totalTokens = summarized.tokens;
            }
        }

        window.lastCompressed = new Date();

        const result: CompressionResult = {
            originalTokens,
            compressedTokens: window.totalTokens,
            compressionRatio: window.totalTokens / originalTokens,
            itemsRemoved,
            itemsSummarized,
        };

        this.emit('compressed', { windowId, result });
        return result;
    }

    /**
     * Sliding window compression - keeps most recent N items
     */
    slidingWindowCompress(windowId: string, maxItems: number): CompressionResult {
        const window = this.getWindow(windowId);
        const originalTokens = window.totalTokens;
        let itemsRemoved = 0;

        // Keep only the most recent items, preserving critical ones
        const critical = window.items.filter(i => i.priority === 'critical');
        const others = window.items.filter(i => i.priority !== 'critical');

        // Sort others by timestamp (newest first)
        others.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Keep critical + newest others up to limit
        const toKeep = new Set<string>(critical.map(i => i.id));
        let remainingSlots = Math.max(0, maxItems - critical.length);

        for (const item of others) {
            if (remainingSlots > 0) {
                toKeep.add(item.id);
                remainingSlots--;
            }
        }

        // Remove items not in keep set
        const toRemove = window.items.filter(i => !toKeep.has(i.id));
        for (const item of toRemove) {
            this.removeFromContext(windowId, item.id);
            itemsRemoved++;
        }

        return {
            originalTokens,
            compressedTokens: window.totalTokens,
            compressionRatio: window.totalTokens / originalTokens,
            itemsRemoved,
            itemsSummarized: 0,
        };
    }

    /**
     * Semantic compression - group similar items and summarize
     */
    semanticCompress(windowId: string): CompressionResult {
        const window = this.getWindow(windowId);
        const originalTokens = window.totalTokens;

        // Group items by type
        const byType = new Map<string, ContextItem[]>();
        for (const item of window.items) {
            if (!byType.has(item.type)) {
                byType.set(item.type, []);
            }
            byType.get(item.type)!.push(item);
        }

        const newItems: ContextItem[] = [];
        let itemsSummarized = 0;

        // For each type, summarize if there are many items
        byType.forEach((items, type) => {
            if (items.length > 3) {
                // Summarize into one item
                const summary = this.createSummary(items);
                newItems.push({
                    id: `summary_${Date.now()}`,
                    content: summary,
                    type: type as ContextItem['type'],
                    priority: this.getHighestPriority(items),
                    tokens: this.estimateTokens(summary),
                    timestamp: new Date(),
                    metadata: { summarizedFrom: items.length },
                });
                itemsSummarized += items.length;
            } else {
                newItems.push(...items);
            }
        });

        window.items = newItems;
        window.totalTokens = newItems.reduce((sum, i) => sum + i.tokens, 0);

        return {
            originalTokens,
            compressedTokens: window.totalTokens,
            compressionRatio: window.totalTokens / originalTokens,
            itemsRemoved: 0,
            itemsSummarized,
        };
    }

    // -------------------------------------------------------------------------
    // Hierarchy & Checkpoints
    // -------------------------------------------------------------------------

    /**
     * Create a hierarchical summary of the context
     */
    createHierarchicalSummary(windowId: string): string {
        const window = this.getWindow(windowId);

        const sections: string[] = [];

        // Group by type
        const byType = new Map<string, ContextItem[]>();
        for (const item of window.items) {
            if (!byType.has(item.type)) {
                byType.set(item.type, []);
            }
            byType.get(item.type)!.push(item);
        }

        // Create section for each type
        byType.forEach((items, type) => {
            const criticalItems = items.filter(i => i.priority === 'critical' || i.priority === 'high');
            const otherCount = items.length - criticalItems.length;

            let section = `## ${type.toUpperCase()} (${items.length} items)\n`;

            for (const item of criticalItems) {
                section += `- [${item.priority}] ${item.content.substring(0, 200)}...\n`;
            }

            if (otherCount > 0) {
                section += `- ... and ${otherCount} more ${type} items\n`;
            }

            sections.push(section);
        });

        return sections.join('\n');
    }

    /**
     * Create a checkpoint of current context
     */
    createCheckpoint(windowId: string): ContextItem[] {
        const window = this.getWindow(windowId);
        return JSON.parse(JSON.stringify(window.items));
    }

    /**
     * Restore from checkpoint
     */
    restoreCheckpoint(windowId: string, checkpoint: ContextItem[]): void {
        const window = this.getWindow(windowId);
        window.items = JSON.parse(JSON.stringify(checkpoint));
        window.totalTokens = window.items.reduce((sum, i) => sum + i.tokens, 0);
        this.emit('checkpointRestored', windowId);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    /**
     * Estimate token count for text
     */
    private estimateTokens(text: string): number {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Infer priority based on content and type
     */
    private inferPriority(content: string, type?: string): ContentPriority {
        const lowerContent = content.toLowerCase();

        // Check for error indicators
        if (/error|exception|failed|crash|critical/i.test(content)) {
            return 'critical';
        }

        // Check for important decisions
        if (/decided|decision|chose|important|must/i.test(content)) {
            return 'high';
        }

        // Type-based defaults
        if (type === 'error') return 'critical';
        if (type === 'decision') return 'high';
        if (type === 'code') return 'medium';
        if (type === 'log') return 'low';

        return 'medium';
    }

    /**
     * Apply priority decay based on age
     */
    private applyPriorityDecay(window: ContextWindow): void {
        const now = Date.now();
        const hourInMs = 3600000;

        for (const item of window.items) {
            if (item.priority === 'critical') continue; // Critical never decays

            const ageHours = (now - item.timestamp.getTime()) / hourInMs;
            const decayFactor = Math.pow(1 - this.config.decayRate, ageHours);

            // Store original priority in metadata
            if (!item.metadata) item.metadata = {};
            if (!item.metadata.originalPriority) {
                item.metadata.originalPriority = item.priority;
            }

            // Apply decay (but don't go below 'background')
            const priorities: ContentPriority[] = ['critical', 'high', 'medium', 'low', 'background'];
            const currentIndex = priorities.indexOf(item.priority);
            const decayedIndex = Math.min(
                priorities.length - 1,
                currentIndex + Math.floor((1 - decayFactor) * 2)
            );
            item.priority = priorities[decayedIndex];
        }
    }

    /**
     * Sort items by effective priority
     */
    private sortByPriority(items: ContextItem[]): ContextItem[] {
        return [...items].sort((a, b) => {
            const weightA = this.config.priorityWeights[a.priority];
            const weightB = this.config.priorityWeights[b.priority];
            return weightB - weightA; // Higher weight first
        });
    }

    /**
     * Create a summary from multiple items
     */
    private createSummary(items: ContextItem[]): string {
        const summaryParts: string[] = [];

        for (const item of items) {
            // Take first 100 chars of each
            const snippet = item.content.substring(0, 100).replace(/\n/g, ' ');
            summaryParts.push(`- ${snippet}...`);
        }

        return `[Summary of ${items.length} items]:\n${summaryParts.slice(0, 5).join('\n')}`;
    }

    /**
     * Summarize entire context
     */
    private summarizeContext(window: ContextWindow): ContextItem | null {
        if (window.items.length === 0) return null;

        const summary = this.createHierarchicalSummary('temp');
        return {
            id: `summary_${Date.now()}`,
            content: summary,
            type: 'other',
            priority: 'high',
            tokens: this.estimateTokens(summary),
            timestamp: new Date(),
            metadata: { isSummary: true, originalItemCount: window.items.length },
        };
    }

    /**
     * Get highest priority from a list of items
     */
    private getHighestPriority(items: ContextItem[]): ContentPriority {
        const priorities: ContentPriority[] = ['critical', 'high', 'medium', 'low', 'background'];
        let highestIndex = priorities.length - 1;

        for (const item of items) {
            const index = priorities.indexOf(item.priority);
            if (index < highestIndex) {
                highestIndex = index;
            }
        }

        return priorities[highestIndex];
    }

    // -------------------------------------------------------------------------
    // Configuration & Stats
    // -------------------------------------------------------------------------

    /**
     * Update configuration
     */
    setConfig(config: Partial<CompressionConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): CompressionConfig {
        return { ...this.config };
    }

    /**
     * Get statistics for all windows
     */
    getStats(): {
        windowCount: number;
        totalItems: number;
        totalTokens: number;
        byPriority: Record<ContentPriority, number>;
    } {
        let totalItems = 0;
        let totalTokens = 0;
        const byPriority: Record<ContentPriority, number> = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            background: 0,
        };

        this.windows.forEach(window => {
            totalItems += window.items.length;
            totalTokens += window.totalTokens;
            for (const item of window.items) {
                byPriority[item.priority]++;
            }
        });

        return {
            windowCount: this.windows.size,
            totalItems,
            totalTokens,
            byPriority,
        };
    }
}

// Export singleton
export const contextCompressor = ContextCompressor.getInstance();
