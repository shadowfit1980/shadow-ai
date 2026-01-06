/**
 * Context Window Manager
 * 
 * Intelligent context management for optimizing
 * token usage and maintaining relevant context.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextItem {
    id: string;
    type: 'message' | 'file' | 'code' | 'system' | 'tool_result';
    content: string;
    tokens: number;
    timestamp: Date;
    relevanceScore: number;
    metadata: Record<string, any>;
    pinned: boolean;
}

export interface ContextWindow {
    id: string;
    maxTokens: number;
    currentTokens: number;
    items: ContextItem[];
    systemPrompt?: ContextItem;
}

export interface ContextConfig {
    maxTokens: number;
    reservedTokens: number;      // For system prompt and response
    recencyWeight: number;       // 0-1, higher = prefer recent
    relevanceWeight: number;     // 0-1, higher = prefer relevant
    compressionEnabled: boolean;
    autoSummarize: boolean;
}

export interface ContextStats {
    totalItems: number;
    totalTokens: number;
    utilizationPercent: number;
    oldestItem: Date;
    newestItem: Date;
    byType: Record<string, { count: number; tokens: number }>;
}

// ============================================================================
// CONTEXT WINDOW MANAGER
// ============================================================================

export class ContextWindowManager extends EventEmitter {
    private static instance: ContextWindowManager;
    private windows: Map<string, ContextWindow> = new Map();
    private config: ContextConfig;

    private constructor() {
        super();
        this.config = {
            maxTokens: 128000,
            reservedTokens: 4000,
            recencyWeight: 0.4,
            relevanceWeight: 0.6,
            compressionEnabled: true,
            autoSummarize: true,
        };
    }

    static getInstance(): ContextWindowManager {
        if (!ContextWindowManager.instance) {
            ContextWindowManager.instance = new ContextWindowManager();
        }
        return ContextWindowManager.instance;
    }

    // ========================================================================
    // WINDOW MANAGEMENT
    // ========================================================================

    createWindow(maxTokens?: number): ContextWindow {
        const window: ContextWindow = {
            id: `ctx_${Date.now()}`,
            maxTokens: maxTokens || this.config.maxTokens,
            currentTokens: 0,
            items: [],
        };

        this.windows.set(window.id, window);
        this.emit('windowCreated', window);
        return window;
    }

    getWindow(id: string): ContextWindow | undefined {
        return this.windows.get(id);
    }

    deleteWindow(id: string): boolean {
        return this.windows.delete(id);
    }

    // ========================================================================
    // CONTEXT OPERATIONS
    // ========================================================================

    addItem(
        windowId: string,
        item: Omit<ContextItem, 'id' | 'timestamp' | 'relevanceScore'>
    ): ContextItem | null {
        const window = this.windows.get(windowId);
        if (!window) return null;

        const newItem: ContextItem = {
            ...item,
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            relevanceScore: 1.0, // Initial score
        };

        // Check if we need to make room
        const availableTokens = window.maxTokens - this.config.reservedTokens - window.currentTokens;
        if (newItem.tokens > availableTokens) {
            this.makeRoom(window, newItem.tokens);
        }

        window.items.push(newItem);
        window.currentTokens += newItem.tokens;

        this.emit('itemAdded', { windowId, item: newItem });
        return newItem;
    }

    removeItem(windowId: string, itemId: string): boolean {
        const window = this.windows.get(windowId);
        if (!window) return false;

        const index = window.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        const item = window.items[index];
        window.items.splice(index, 1);
        window.currentTokens -= item.tokens;

        this.emit('itemRemoved', { windowId, itemId });
        return true;
    }

    pinItem(windowId: string, itemId: string): boolean {
        const window = this.windows.get(windowId);
        if (!window) return false;

        const item = window.items.find(i => i.id === itemId);
        if (!item) return false;

        item.pinned = true;
        return true;
    }

    unpinItem(windowId: string, itemId: string): boolean {
        const window = this.windows.get(windowId);
        if (!window) return false;

        const item = window.items.find(i => i.id === itemId);
        if (!item) return false;

        item.pinned = false;
        return true;
    }

    setSystemPrompt(windowId: string, content: string, tokens: number): void {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Remove old system prompt tokens
        if (window.systemPrompt) {
            window.currentTokens -= window.systemPrompt.tokens;
        }

        window.systemPrompt = {
            id: 'system',
            type: 'system',
            content,
            tokens,
            timestamp: new Date(),
            relevanceScore: 1.0,
            metadata: {},
            pinned: true,
        };

        window.currentTokens += tokens;
        this.emit('systemPromptSet', { windowId, tokens });
    }

    // ========================================================================
    // CONTEXT OPTIMIZATION
    // ========================================================================

    private makeRoom(window: ContextWindow, neededTokens: number): void {
        // Sort items by priority (lower = remove first)
        const sortedItems = window.items
            .filter(item => !item.pinned)
            .map(item => ({
                item,
                priority: this.calculatePriority(item),
            }))
            .sort((a, b) => a.priority - b.priority);

        let freedTokens = 0;
        const toRemove: string[] = [];

        for (const { item } of sortedItems) {
            if (freedTokens >= neededTokens) break;

            toRemove.push(item.id);
            freedTokens += item.tokens;
        }

        // Remove items
        for (const id of toRemove) {
            this.removeItem(window.id, id);
        }

        this.emit('contextTrimmed', { windowId: window.id, freedTokens, removedCount: toRemove.length });
    }

    private calculatePriority(item: ContextItem): number {
        const now = Date.now();
        const age = now - item.timestamp.getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Normalize age to 0-1 (older = lower score)
        const recencyScore = 1 - Math.min(age / maxAge, 1);

        // Combine with relevance
        return (
            recencyScore * this.config.recencyWeight +
            item.relevanceScore * this.config.relevanceWeight
        );
    }

    updateRelevance(windowId: string, itemId: string, relevanceScore: number): void {
        const window = this.windows.get(windowId);
        if (!window) return;

        const item = window.items.find(i => i.id === itemId);
        if (item) {
            item.relevanceScore = Math.max(0, Math.min(1, relevanceScore));
        }
    }

    // ========================================================================
    // SUMMARIZATION
    // ========================================================================

    async summarizeOldItems(
        windowId: string,
        summarizer: (content: string) => Promise<string>,
        maxItemsToSummarize = 10
    ): Promise<ContextItem | null> {
        const window = this.windows.get(windowId);
        if (!window) return null;

        // Get oldest non-pinned items
        const oldItems = window.items
            .filter(i => !i.pinned && i.type !== 'system')
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .slice(0, maxItemsToSummarize);

        if (oldItems.length < 3) return null;

        // Combine and summarize
        const combined = oldItems.map(i => i.content).join('\n\n');
        const summary = await summarizer(combined);
        const summaryTokens = this.estimateTokens(summary);

        // Calculate token savings
        const oldTokens = oldItems.reduce((acc, i) => acc + i.tokens, 0);

        if (summaryTokens >= oldTokens * 0.8) {
            // Not worth summarizing
            return null;
        }

        // Remove old items
        for (const item of oldItems) {
            this.removeItem(windowId, item.id);
        }

        // Add summary
        return this.addItem(windowId, {
            type: 'message',
            content: `[Summary of ${oldItems.length} previous items]\n${summary}`,
            tokens: summaryTokens,
            metadata: { summarized: true, originalCount: oldItems.length },
            pinned: false,
        });
    }

    // ========================================================================
    // RETRIEVAL
    // ========================================================================

    getItems(windowId: string, options?: {
        type?: ContextItem['type'];
        limit?: number;
        minRelevance?: number;
    }): ContextItem[] {
        const window = this.windows.get(windowId);
        if (!window) return [];

        let items = [...window.items];

        if (options?.type) {
            items = items.filter(i => i.type === options.type);
        }

        if (options?.minRelevance !== undefined) {
            items = items.filter(i => i.relevanceScore >= options.minRelevance);
        }

        // Sort by timestamp (newest first)
        items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        if (options?.limit) {
            items = items.slice(0, options.limit);
        }

        return items;
    }

    buildContext(windowId: string): string {
        const window = this.windows.get(windowId);
        if (!window) return '';

        const parts: string[] = [];

        // Add system prompt first
        if (window.systemPrompt) {
            parts.push(window.systemPrompt.content);
        }

        // Add pinned items
        const pinned = window.items.filter(i => i.pinned);
        for (const item of pinned) {
            parts.push(item.content);
        }

        // Add remaining items by priority
        const remaining = window.items
            .filter(i => !i.pinned)
            .map(item => ({ item, priority: this.calculatePriority(item) }))
            .sort((a, b) => b.priority - a.priority);

        for (const { item } of remaining) {
            parts.push(item.content);
        }

        return parts.join('\n\n');
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    estimateTokens(text: string): number {
        // Rough estimate: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    getStats(windowId: string): ContextStats | null {
        const window = this.windows.get(windowId);
        if (!window) return null;

        const byType: Record<string, { count: number; tokens: number }> = {};
        let oldestItem = new Date();
        let newestItem = new Date(0);

        for (const item of window.items) {
            if (!byType[item.type]) {
                byType[item.type] = { count: 0, tokens: 0 };
            }
            byType[item.type].count++;
            byType[item.type].tokens += item.tokens;

            if (item.timestamp < oldestItem) oldestItem = item.timestamp;
            if (item.timestamp > newestItem) newestItem = item.timestamp;
        }

        return {
            totalItems: window.items.length,
            totalTokens: window.currentTokens,
            utilizationPercent: (window.currentTokens / window.maxTokens) * 100,
            oldestItem,
            newestItem,
            byType,
        };
    }

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    updateConfig(config: Partial<ContextConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('configUpdated', this.config);
    }

    getConfig(): ContextConfig {
        return { ...this.config };
    }
}

export const contextWindowManager = ContextWindowManager.getInstance();
