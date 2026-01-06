import { ModelManager } from '../ModelManager';
import { ContextExtractor } from './ContextExtractor';
import {
    EditorContext,
    Completion,
    CompletionKind,
    InlineCompletion,
    CompletionConfig,
    CompletionMetrics,
    Position,
    Range,
} from './types';

/**
 * IntelliSense Engine
 * Provides intelligent code completions using AI models
 */
export class IntelliSenseEngine {
    private static instance: IntelliSenseEngine;
    private contextExtractor: ContextExtractor;
    private modelManager: ModelManager;
    private config: CompletionConfig;
    private metrics: CompletionMetrics;
    private cache: Map<string, { completions: Completion[]; timestamp: number }> = new Map();

    private constructor() {
        this.contextExtractor = new ContextExtractor();
        this.modelManager = ModelManager.getInstance();
        this.config = this.getDefaultConfig();
        this.metrics = this.initMetrics();
    }

    static getInstance(): IntelliSenseEngine {
        if (!IntelliSenseEngine.instance) {
            IntelliSenseEngine.instance = new IntelliSenseEngine();
        }
        return IntelliSenseEngine.instance;
    }

    /**
     * Get inline completion (ghost text)
     */
    async getInlineCompletion(editorContext: EditorContext): Promise<InlineCompletion | null> {
        if (!this.config.enabled) return null;

        const startTime = Date.now();
        this.metrics.totalRequests++;

        try {
            // Extract context
            const context = await this.contextExtractor.extractContext(editorContext);

            // Check if in comment or string (different completion strategy)
            const languageContext = this.contextExtractor.getCursorLanguageContext(
                editorContext.content,
                editorContext.cursorPosition
            );

            // Build prompt for AI
            const prompt = this.buildInlineCompletionPrompt(
                editorContext,
                context,
                languageContext
            );

            // Get completion from AI
            let completion: string;

            if (this.config.streamingEnabled) {
                // Streaming for faster perceived response
                completion = await this.getStreamingCompletion(prompt);
            } else {
                completion = await this.getCompletion(prompt);
            }

            // Post-process completion
            completion = this.postProcessCompletion(completion, editorContext);

            if (!completion || completion.trim() === '') {
                return null;
            }

            // Calculate insertion range
            const range = this.getInsertionRange(editorContext);

            // Update metrics
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);

            return {
                text: completion,
                range,
            };
        } catch (error) {
            console.error('Error getting inline completion:', error);
            return null;
        }
    }

    /**
     * Get multiple completion suggestions
     */
    async getCompletions(editorContext: EditorContext): Promise<Completion[]> {
        if (!this.config.enabled) return [];

        const startTime = Date.now();
        this.metrics.totalRequests++;

        // Check cache
        const cacheKey = this.getCacheKey(editorContext);
        if (this.config.cacheEnabled) {
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
                this.metrics.cacheHits++;
                return cached.completions;
            }
            this.metrics.cacheMisses++;
        }

        try {
            // Extract context
            const context = await this.contextExtractor.extractContext(editorContext);

            // Build prompt
            const prompt = this.buildCompletionPrompt(editorContext, context);

            // Get completions from AI
            const aiResponse = await this.getCompletion(prompt);

            // Parse and rank completions
            const completions = this.parseCompletions(aiResponse, editorContext);
            const rankedCompletions = this.rankSuggestions(completions);

            // Limit results
            const limitedCompletions = rankedCompletions.slice(0, this.config.maxSuggestions);

            // Cache results
            if (this.config.cacheEnabled) {
                this.cache.set(cacheKey, {
                    completions: limitedCompletions,
                    timestamp: Date.now(),
                });
            }

            // Update metrics
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);

            return limitedCompletions;
        } catch (error) {
            console.error('Error getting completions:', error);
            return [];
        }
    }

    /**
     * Build prompt for inline completion
     */
    private buildInlineCompletionPrompt(
        editorContext: EditorContext,
        context: any,
        languageContext: any
    ): string {
        const { filePath, content, cursorPosition } = editorContext;
        const prefix = this.contextExtractor.getLinePrefix(content, cursorPosition);

        let prompt = `You are an expert ${editorContext.language} programmer. Complete the code at the cursor position.\n\n`;

        // Add file context
        prompt += `File: ${filePath}\n`;
        prompt += `Language: ${editorContext.language}\n\n`;

        // Add imports for context
        if (context.currentFile.imports.length > 0) {
            prompt += `Imports:\n${context.currentFile.imports.slice(0, 5).join('\n')}\n\n`;
        }

        // Add cursor context
        prompt += `Code context:\n\`\`\`${editorContext.language}\n${context.cursorContext}\n\`\`\`\n\n`;

        // Add completion instruction
        if (languageContext.inComment || languageContext.inJSDoc) {
            prompt += `Complete the comment or documentation. Be concise and clear.\n`;
        } else if (languageContext.inString) {
            prompt += `Complete the string value appropriately.\n`;
        } else {
            prompt += `Complete the code logically. Provide only the completion text, no explanations.\n`;
        }

        prompt += `\nCurrent line cursor position: "${prefix}|"\n`;
        prompt += `\nCompletion (code only, no markdown):`;

        return prompt;
    }

    /**
     * Build prompt for multiple completions
     */
    private buildCompletionPrompt(editorContext: EditorContext, context: any): string {
        let prompt = `Generate ${this.config.maxSuggestions} code completion suggestions.\n\n`;
        prompt += `File: ${editorContext.filePath}\n`;
        prompt += `Language: ${editorContext.language}\n\n`;
        prompt += `Context:\n\`\`\`${editorContext.language}\n${context.cursorContext}\n\`\`\`\n\n`;
        prompt += `Provide ${this.config.maxSuggestions} different valid completions as JSON array:\n`;
        prompt += `[{\"text\": \"...\", \"kind\": \"function|variable|...\", \"detail\": \"...\"}]\n`;

        return prompt;
    }

    /**
     * Get completion from AI model
     */
    private async getCompletion(prompt: string): Promise<string> {
        try {
            const response: any = await this.modelManager.chat([
                { role: 'user', content: prompt, timestamp: new Date() },
            ]);
            return (typeof response === 'string' ? response : response.content) || '';
        } catch (error) {
            console.error('AI completion error:', error);
            return '';
        }
    }

    /**
     * Get streaming completion
     */
    private async getStreamingCompletion(prompt: string): Promise<string> {
        // For now, use regular completion
        // TODO: Implement actual streaming when ModelManager supports it
        return this.getCompletion(prompt);
    }

    /**
     * Post-process completion text
     */
    private postProcessCompletion(completion: string, editorContext: EditorContext): string {
        // Remove markdown code blocks if present
        completion = completion.replace(/```[\w]*\n?/g, '');
        completion = completion.trim();

        // Remove duplicate text that's already in the file
        const linePrefix = this.contextExtractor.getLinePrefix(
            editorContext.content,
            editorContext.cursorPosition
        );

        if (completion.startsWith(linePrefix)) {
            completion = completion.substring(linePrefix.length);
        }

        return completion;
    }

    /**
     * Parse completions from AI response
     */
    private parseCompletions(response: string, editorContext: EditorContext): Completion[] {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
                return parsed.map((item, index) => ({
                    text: item.text || '',
                    kind: item.kind || CompletionKind.Text,
                    detail: item.detail || '',
                    score: 1.0 - (index * 0.1),
                    source: 'ai' as const,
                    range: this.getInsertionRange(editorContext),
                }));
            }
        } catch {
            // Not JSON, treat as plain text
        }

        // Single completion
        return [{
            text: response,
            kind: CompletionKind.Text,
            score: 1.0,
            source: 'ai' as const,
            range: this.getInsertionRange(editorContext),
        }];
    }

    /**
     * Rank completion suggestions by relevance
     */
    rankSuggestions(completions: Completion[]): Completion[] {
        return completions.sort((a, b) => b.score - a.score);
    }

    /**
     * Get insertion range for completion
     */
    private getInsertionRange(editorContext: EditorContext): Range {
        const { cursorPosition } = editorContext;
        return {
            start: cursorPosition,
            end: cursorPosition,
        };
    }

    /**
     * Generate cache key
     */
    private getCacheKey(editorContext: EditorContext): string {
        const { filePath, cursorPosition } = editorContext;
        return `${filePath}:${cursorPosition.line}:${cursorPosition.character}`;
    }

    /**
     * Record completion acceptance
     */
    acceptSuggestion(completion: Completion, partial: boolean = false): void {
        if (partial) {
            this.metrics.partialAccepts++;
        } else {
            this.metrics.acceptedSuggestions++;
        }
    }

    /**
     * Record completion rejection
     */
    rejectSuggestion(): void {
        this.metrics.rejectedSuggestions++;
    }

    /**
     * Get completion metrics
     */
    getMetrics(): CompletionMetrics {
        const acceptRate = this.metrics.totalRequests > 0
            ? (this.metrics.acceptedSuggestions + this.metrics.partialAccepts) / this.metrics.totalRequests
            : 0;

        return {
            ...this.metrics,
            acceptRate,
        } as any;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<CompletionConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): CompletionConfig {
        return { ...this.config };
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
        this.contextExtractor.clearCache();
    }

    /**
     * Default configuration
     */
    private getDefaultConfig(): CompletionConfig {
        return {
            enabled: true,
            debounceMs: 150,
            maxSuggestions: 5,
            minChars: 2,
            cacheEnabled: true,
            cacheTTL: 5000, // 5 seconds
            streamingEnabled: false,
            multiLine: true,
            contextLines: 10,
        };
    }

    /**
     * Initialize metrics
     */
    private initMetrics(): CompletionMetrics {
        return {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageLatency: 0,
            acceptedSuggestions: 0,
            rejectedSuggestions: 0,
            partialAccepts: 0,
        };
    }

    /**
     * Update latency metrics
     */
    private updateLatencyMetrics(latency: number): void {
        const total = this.metrics.totalRequests;
        this.metrics.averageLatency =
            (this.metrics.averageLatency * (total - 1) + latency) / total;
    }
}

// Export singleton getter
export function getIntelliSense(): IntelliSenseEngine {
    return IntelliSenseEngine.getInstance();
}
