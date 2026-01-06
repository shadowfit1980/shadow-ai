import { IntelliSenseEngine } from './IntelliSenseEngine';
import { EditorContext, Completion, InlineCompletion } from './types';

/**
 * Completion Provider
 * Manages completion requests with debouncing and request management
 */
export class CompletionProvider {
    private static instance: CompletionProvider;
    private intelliSense: IntelliSenseEngine;
    private pendingRequests: Map<string, NodeJS.Timeout> = new Map();
    private activeRequests: Set<string> = new Set();

    private constructor() {
        this.intelliSense = IntelliSenseEngine.getInstance();
    }

    static getInstance(): CompletionProvider {
        if (!CompletionProvider.instance) {
            CompletionProvider.instance = new CompletionProvider();
        }
        return CompletionProvider.instance;
    }

    /**
     * Request inline completion with debouncing
     */
    async requestInlineCompletion(
        editorContext: EditorContext,
        debounceMs?: number
    ): Promise<InlineCompletion | null> {
        const config = this.intelliSense.getConfig();
        const delay = debounceMs ?? config.debounceMs;
        const requestKey = this.getRequestKey(editorContext);

        // Cancel any pending request for this context
        this.cancelPendingRequest(requestKey);

        // Return immediately if no debounce
        if (delay === 0) {
            return this.executeInlineCompletion(editorContext, requestKey);
        }

        // Debounced request
        return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
                this.pendingRequests.delete(requestKey);
                const result = await this.executeInlineCompletion(editorContext, requestKey);
                resolve(result);
            }, delay);

            this.pendingRequests.set(requestKey, timeout);
        });
    }

    /**
     * Request completion suggestions with debouncing
     */
    async requestCompletions(
        editorContext: EditorContext,
        debounceMs?: number
    ): Promise<Completion[]> {
        const config = this.intelliSense.getConfig();
        const delay = debounceMs ?? config.debounceMs;
        const requestKey = this.getRequestKey(editorContext);

        // Cancel any pending request for this context
        this.cancelPendingRequest(requestKey);

        // Return immediately if no debounce
        if (delay === 0) {
            return this.executeCompletions(editorContext, requestKey);
        }

        // Debounced request
        return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
                this.pendingRequests.delete(requestKey);
                const result = await this.executeCompletions(editorContext, requestKey);
                resolve(result);
            }, delay);

            this.pendingRequests.set(requestKey, timeout);
        });
    }

    /**
     * Cancel all pending requests
     */
    cancelAllRequests(): void {
        this.pendingRequests.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.pendingRequests.clear();
        this.activeRequests.clear();
    }

    /**
     * Cancel specific request
     */
    cancelRequest(requestKey: string): void {
        this.cancelPendingRequest(requestKey);
        this.activeRequests.delete(requestKey);
    }

    /**
     * Check if request is active
     */
    isRequestActive(requestKey: string): boolean {
        return this.activeRequests.has(requestKey) || this.pendingRequests.has(requestKey);
    }

    /**
     * Get active request count
     */
    getActiveRequestCount(): number {
        return this.activeRequests.size + this.pendingRequests.size;
    }

    /**
     * Execute inline completion
     */
    private async executeInlineCompletion(
        editorContext: EditorContext,
        requestKey: string
    ): Promise<InlineCompletion | null> {
        if (this.activeRequests.has(requestKey)) {
            console.warn('Request already active:', requestKey);
            return null;
        }

        this.activeRequests.add(requestKey);

        try {
            const result = await this.intelliSense.getInlineCompletion(editorContext);
            return result;
        } finally {
            this.activeRequests.delete(requestKey);
        }
    }

    /**
     * Execute completions
     */
    private async executeCompletions(
        editorContext: EditorContext,
        requestKey: string
    ): Promise<Completion[]> {
        if (this.activeRequests.has(requestKey)) {
            console.warn('Request already active:', requestKey);
            return [];
        }

        this.activeRequests.add(requestKey);

        try {
            const result = await this.intelliSense.getCompletions(editorContext);
            return result;
        } finally {
            this.activeRequests.delete(requestKey);
        }
    }

    /**
     * Generate request key
     */
    private getRequestKey(editorContext: EditorContext): string {
        const { filePath, cursorPosition } = editorContext;
        return `${filePath}:${cursorPosition.line}:${cursorPosition.character}`;
    }

    /**
     * Cancel pending request
     */
    private cancelPendingRequest(requestKey: string): void {
        const timeout = this.pendingRequests.get(requestKey);
        if (timeout) {
            clearTimeout(timeout);
            this.pendingRequests.delete(requestKey);
        }
    }

    /**
     * Accept suggestion
     */
    acceptSuggestion(completion: Completion, partial: boolean = false): void {
        this.intelliSense.acceptSuggestion(completion, partial);
    }

    /**
     * Reject suggestion
     */
    rejectSuggestion(): void {
        this.intelliSense.rejectSuggestion();
    }

    /**
     * Get completion metrics
     */
    getMetrics() {
        return {
            ...this.intelliSense.getMetrics(),
            pendingRequests: this.pendingRequests.size,
            activeRequests: this.activeRequests.size,
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: any): void {
        this.intelliSense.updateConfig(config);
    }

    /**
     * Get configuration
     */
    getConfig() {
        return this.intelliSense.getConfig();
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.intelliSense.clearCache();
    }
}

// Export singleton getter
export function getCompletionProvider(): CompletionProvider {
    return CompletionProvider.getInstance();
}
