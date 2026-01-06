/**
 * Real-time Completion Trigger
 * Handles keystroke debouncing and real-time triggering of code completions
 * Inspired by Cursor's Tab autocomplete experience
 */

import { EventEmitter } from 'events';
import { EditorContext, Position, InlineCompletion, CompletionConfig } from './types';
import { IntelliSenseEngine } from './IntelliSenseEngine';

export interface KeystrokeEvent {
    key: string;
    timestamp: number;
    position: Position;
    content: string;
    filePath: string;
    language: string;
}

export interface CompletionTriggerConfig {
    debounceMs: number;
    minCharsForTrigger: number;
    triggerOnSpace: boolean;
    triggerOnDot: boolean;
    triggerOnOpenBracket: boolean;
    triggerOnNewLine: boolean;
    maxPendingRequests: number;
}

export interface PendingCompletion {
    id: string;
    context: EditorContext;
    timestamp: number;
    abortController: AbortController;
}

/**
 * RealtimeCompletionTrigger
 * Manages real-time keystroke listening and intelligent completion triggering
 */
export class RealtimeCompletionTrigger extends EventEmitter {
    private static instance: RealtimeCompletionTrigger;

    private intelliSense: IntelliSenseEngine;
    private debounceTimer: NodeJS.Timeout | null = null;
    private pendingCompletions: Map<string, PendingCompletion> = new Map();
    private lastKeystroke: KeystrokeEvent | null = null;
    private lastCompletion: InlineCompletion | null = null;
    private completionCounter = 0;

    private config: CompletionTriggerConfig = {
        debounceMs: 150,
        minCharsForTrigger: 1,
        triggerOnSpace: false,
        triggerOnDot: true,
        triggerOnOpenBracket: true,
        triggerOnNewLine: true,
        maxPendingRequests: 3,
    };

    // Metrics
    private metrics = {
        keystrokesProcessed: 0,
        completionsTriggered: 0,
        completionsAborted: 0,
        completionsReturned: 0,
        averageLatency: 0,
    };

    private constructor() {
        super();
        this.intelliSense = IntelliSenseEngine.getInstance();
    }

    static getInstance(): RealtimeCompletionTrigger {
        if (!RealtimeCompletionTrigger.instance) {
            RealtimeCompletionTrigger.instance = new RealtimeCompletionTrigger();
        }
        return RealtimeCompletionTrigger.instance;
    }

    /**
     * Handle keystroke event - the main entry point
     */
    onKeystroke(event: KeystrokeEvent): void {
        this.metrics.keystrokesProcessed++;
        this.lastKeystroke = event;

        // Clear any pending debounce
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Check for immediate triggers (dot, bracket, etc.)
        if (this.shouldTriggerImmediately(event)) {
            this.triggerCompletion(event);
            return;
        }

        // Debounce normal keystrokes
        this.debounceTimer = setTimeout(() => {
            this.triggerCompletion(event);
        }, this.config.debounceMs);
    }

    /**
     * Check if we should trigger completion immediately (no debounce)
     */
    private shouldTriggerImmediately(event: KeystrokeEvent): boolean {
        const { key } = event;

        if (this.config.triggerOnDot && key === '.') return true;
        if (this.config.triggerOnOpenBracket && (key === '(' || key === '[' || key === '{')) return true;
        if (this.config.triggerOnNewLine && key === 'Enter') return true;
        if (this.config.triggerOnSpace && key === ' ') return true;

        return false;
    }

    /**
     * Trigger the completion request
     */
    async triggerCompletion(event: KeystrokeEvent): Promise<InlineCompletion | null> {
        const startTime = Date.now();
        this.metrics.completionsTriggered++;

        // Cancel old pending requests if we have too many
        this.pruneOldRequests();

        // Create abort controller for this request
        const abortController = new AbortController();
        const requestId = `completion_${++this.completionCounter}`;

        // Build editor context
        const context: EditorContext = {
            filePath: event.filePath,
            content: event.content,
            language: event.language,
            cursorPosition: event.position,
        };

        // Store pending completion
        this.pendingCompletions.set(requestId, {
            id: requestId,
            context,
            timestamp: startTime,
            abortController,
        });

        try {
            // Get inline completion from IntelliSense engine
            const completion = await this.intelliSense.getInlineCompletion(context);

            // Check if request was aborted
            if (abortController.signal.aborted) {
                this.metrics.completionsAborted++;
                return null;
            }

            // Remove from pending
            this.pendingCompletions.delete(requestId);

            if (completion) {
                this.lastCompletion = completion;
                this.metrics.completionsReturned++;

                // Update average latency
                const latency = Date.now() - startTime;
                this.updateAverageLatency(latency);

                // Emit completion event
                this.emit('completion', completion);

                return completion;
            }

            return null;
        } catch (error) {
            this.pendingCompletions.delete(requestId);
            this.emit('error', error);
            return null;
        }
    }

    /**
     * Cancel pending completion and clear current suggestion
     */
    cancelCompletion(): void {
        // Clear debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        // Abort all pending requests
        for (const [id, pending] of this.pendingCompletions) {
            pending.abortController.abort();
            this.pendingCompletions.delete(id);
            this.metrics.completionsAborted++;
        }

        // Clear last completion
        this.lastCompletion = null;

        this.emit('cancel');
    }

    /**
     * Accept the current completion (user pressed Tab)
     */
    acceptCompletion(): InlineCompletion | null {
        const completion = this.lastCompletion;
        if (completion) {
            this.lastCompletion = null;
            this.intelliSense.acceptSuggestion({
                text: completion.text,
                range: completion.range,
                kind: 'text' as any,
                score: 1,
                source: 'ai',
            });
            this.emit('accept', completion);
        }
        return completion;
    }

    /**
     * Reject the current completion (user pressed Escape or typed something else)
     */
    rejectCompletion(): void {
        if (this.lastCompletion) {
            this.intelliSense.rejectSuggestion();
            this.lastCompletion = null;
            this.emit('reject');
        }
    }

    /**
     * Get the current pending completion if any
     */
    getCurrentCompletion(): InlineCompletion | null {
        return this.lastCompletion;
    }

    /**
     * Check if there's an active completion being shown
     */
    hasActiveCompletion(): boolean {
        return this.lastCompletion !== null;
    }

    /**
     * Navigate to next predicted edit location (Tab-Tab-Tab mode)
     */
    async navigateToNextPrediction(): Promise<Position | null> {
        // This will be enhanced with EditPredictionEngine
        // For now, emit an event that the editor can use
        this.emit('navigateNext');
        return null;
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<CompletionTriggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): CompletionTriggerConfig {
        return { ...this.config };
    }

    /**
     * Set debounce delay in milliseconds
     */
    setDebounceMs(ms: number): void {
        this.config.debounceMs = ms;
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            pendingRequests: this.pendingCompletions.size,
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics(): void {
        this.metrics = {
            keystrokesProcessed: 0,
            completionsTriggered: 0,
            completionsAborted: 0,
            completionsReturned: 0,
            averageLatency: 0,
        };
    }

    // Private helpers

    private pruneOldRequests(): void {
        // Cancel oldest requests if we have too many pending
        while (this.pendingCompletions.size >= this.config.maxPendingRequests) {
            const oldest = [...this.pendingCompletions.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];

            if (oldest) {
                oldest[1].abortController.abort();
                this.pendingCompletions.delete(oldest[0]);
                this.metrics.completionsAborted++;
            }
        }
    }

    private updateAverageLatency(latency: number): void {
        const total = this.metrics.completionsReturned;
        const currentAvg = this.metrics.averageLatency;
        this.metrics.averageLatency = (currentAvg * (total - 1) + latency) / total;
    }
}

// Singleton getter
export function getRealtimeCompletionTrigger(): RealtimeCompletionTrigger {
    return RealtimeCompletionTrigger.getInstance();
}
