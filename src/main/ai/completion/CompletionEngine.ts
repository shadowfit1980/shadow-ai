/**
 * Completion Engine
 * High-performance code completion with AI models, caching, and streaming
 */

import { ContextExtractor } from './ContextExtractor';
import { EditorContext, Position } from './types';
import { getCompletionCache } from './CompletionCache';
import { ModelManager } from '../ModelManager';

export interface CompletionRequest {
    filePath: string;
    content: string;
    cursorPosition: Position;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
}

export interface CompletionResult {
    text: string;
    cached: boolean;
    latency: number;
    model?: string;
    confidence?: number;
}

export interface StreamCompletionCallback {
    onToken: (token: string) => void;
    onComplete: (fullText: string) => void;
    onError: (error: Error) => void;
}

export class CompletionEngine {
    private contextExtractor = new ContextExtractor();
    private cache = getCompletionCache();
    private modelManager = ModelManager.getInstance();

    // Performance tracking
    private totalCompletions = 0;
    private totalLatency = 0;

    /**
     * Get code completion
     */
    async getCompletion(request: CompletionRequest): Promise<CompletionResult> {
        const startTime = Date.now();

        try {
            // Extract context
            const editorContext: EditorContext = {
                filePath: request.filePath,
                content: request.content,
                cursorPosition: request.cursorPosition,
                language: this.detectLanguage(request.filePath),
            };

            const context = await this.contextExtractor.extractContext(editorContext);

            // Get line prefix (text before cursor on current line)
            const linePrefix = this.contextExtractor.getLinePrefix(
                request.content,
                request.cursorPosition
            );

            // Check language context (don't complete in strings/comments unless explicitly asked)
            const languageContext = this.contextExtractor.getCursorLanguageContext(
                request.content,
                request.cursorPosition
            );

            // Generate cache key
            const cacheKey = this.cache.generateKey({
                filePath: request.filePath,
                linePrefix,
                cursorContext: context.cursorContext,
                language: languageContext.language,
            });

            const contextHash = this.hashContext(context);

            // Try cache first
            const cachedCompletion = this.cache.get(cacheKey, contextHash);
            if (cachedCompletion) {
                const latency = Date.now() - startTime;
                console.log(`✅ Cache hit! Latency: ${latency}ms`);
                return {
                    text: cachedCompletion,
                    cached: true,
                    latency,
                };
            }

            // Generate completion using AI model
            const completion = await this.generateCompletion(
                context,
                linePrefix,
                languageContext,
                request
            );

            // Cache the result
            this.cache.set(cacheKey, completion, contextHash);

            const latency = Date.now() - startTime;
            this.totalCompletions++;
            this.totalLatency += latency;

            console.log(`🤖 AI completion generated. Latency: ${latency}ms`);

            return {
                text: completion,
                cached: false,
                latency,
            };
        } catch (error) {
            console.error('Completion error:', error);
            throw error;
        }
    }

    /**
     * Get streaming completion
     */
    async getStreamingCompletion(
        request: CompletionRequest,
        callbacks: StreamCompletionCallback
    ): Promise<void> {
        try {
            // Extract context
            const editorContext: EditorContext = {
                filePath: request.filePath,
                content: request.content,
                cursorPosition: request.cursorPosition,
                language: this.detectLanguage(request.filePath),
            };

            const context = await this.contextExtractor.extractContext(editorContext);
            const linePrefix = this.contextExtractor.getLinePrefix(
                request.content,
                request.cursorPosition
            );

            // Build prompt
            const prompt = this.buildCompletionPrompt(context, linePrefix);

            // Stream from AI model
            let fullText = '';

            try {
                const response = await this.modelManager.chat([
                    {
                        role: 'system',
                        content: 'You are an expert code completion assistant. Provide concise, accurate completions.',
                        timestamp: new Date(),
                    },
                    {
                        role: 'user',
                        content: prompt,
                        timestamp: new Date(),
                    },
                ]);

                // Handle streaming response
                if (typeof response === 'string') {
                    // Non-streaming response (fallback)
                    fullText = response;
                    callbacks.onToken(response);
                    callbacks.onComplete(response);
                } else {
                    // Streaming response
                    for await (const chunk of response as AsyncIterable<string>) {
                        fullText += chunk;
                        callbacks.onToken(chunk);
                    }
                    callbacks.onComplete(fullText);
                }
            } catch (error: any) {
                callbacks.onError(new Error(`AI completion failed: ${error.message}`));
            }
        } catch (error: any) {
            callbacks.onError(error);
        }
    }

    /**
     * Get multi-line completion (for larger code blocks)
     */
    async getMultiLineCompletion(request: CompletionRequest): Promise<CompletionResult> {
        // Use higher max tokens for multi-line
        const multiLineRequest = {
            ...request,
            maxTokens: request.maxTokens || 300,
            temperature: request.temperature || 0.5,
        };

        return this.getCompletion(multiLineRequest);
    }

    /**
     * Get diff completion (suggest changes to existing code)
     */
    async getDiffCompletion(
        filePath: string,
        content: string,
        selection: { start: Position; end: Position },
        instruction: string
    ): Promise<CompletionResult> {
        const startTime = Date.now();

        try {
            // Extract selected code
            const lines = content.split('\n');
            const selectedLines = lines.slice(selection.start.line, selection.end.line + 1);
            const selectedCode = selectedLines.join('\n');

            // Build prompt for code transformation
            const prompt = `
You are an expert code refactoring assistant. 

Current code:
\`\`\`
${selectedCode}
\`\`\`

Instruction: ${instruction}

Provide the refactored code as a complete replacement. Output ONLY the code, no explanations.
`;

            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert code refactoring assistant.',
                    timestamp: new Date(),
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date(),
                },
            ]);

            const completion = typeof response === 'string' ? response : '';
            const latency = Date.now() - startTime;

            return {
                text: completion,
                cached: false,
                latency,
            };
        } catch (error) {
            console.error('Diff completion error:', error);
            throw error;
        }
    }

    /**
     * Invalidate cache for a file (when file is edited)
     */
    invalidateFileCache(filePath: string): void {
        this.cache.invalidateFile(filePath);
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const cacheStats = this.cache.getStats();
        const avgLatency = this.totalCompletions > 0
            ? this.totalLatency / this.totalCompletions
            : 0;

        return {
            totalCompletions: this.totalCompletions,
            avgLatency,
            cache: cacheStats,
        };
    }

    // ============ Private Helper Methods ============

    private async generateCompletion(
        context: any,
        linePrefix: string,
        languageContext: any,
        request: CompletionRequest
    ): Promise<string> {
        const prompt = this.buildCompletionPrompt(context, linePrefix);

        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert code completion assistant. Provide concise, accurate completions that follow best practices.',
                    timestamp: new Date(),
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date(),
                },
            ]);

            // Extract code from response (remove markdown formatting if present)
            let completion = typeof response === 'string' ? response : '';
            completion = this.cleanCompletionText(completion);

            return completion;
        } catch (error) {
            console.error('AI model error:', error);
            throw new Error('Failed to generate completion');
        }
    }

    private buildCompletionPrompt(context: any, linePrefix: string): string {
        const { currentFile, cursorContext, relevantSymbols, typeInformation } = context;

        let prompt = `Complete the following code:\n\n`;

        // Add file context
        if (currentFile.functions.length > 0) {
            prompt += `Available functions: ${currentFile.functions.join(', ')}\n`;
        }
        if (currentFile.classes.length > 0) {
            prompt += `Available classes: ${currentFile.classes.join(', ')}\n`;
        }
        if (currentFile.types.length > 0) {
            prompt += `Available types: ${currentFile.types.join(', ')}\n`;
        }

        // Add type information if available
        if (typeInformation) {
            prompt += `\nContext: Currently in ${typeInformation.kindName} "${typeInformation.name}"\n`;
        }

        prompt += `\nCode:\n\`\`\`\n${cursorContext}\n${linePrefix}<CURSOR>\n\`\`\`\n\n`;
        prompt += `Complete the code after <CURSOR>. Provide ONLY the completion text, no explanations.`;

        return prompt;
    }

    private cleanCompletionText(text: string): string {
        // Remove markdown code blocks
        text = text.replace(/```[a-z]*\n?/g, '');
        text = text.replace(/```/g, '');

        // Remove common AI response prefixes
        text = text.replace(/^(Here's|Here is|The completion is).*?\n/i, '');

        // Trim whitespace
        text = text.trim();

        return text;
    }

    private hashContext(context: any): string {
        const contextStr = JSON.stringify({
            imports: context.currentFile.imports,
            symbols: context.relevantSymbols.map((s: any) => s.name),
            cursorContext: context.cursorContext.slice(0, 100), // Only hash first 100 chars
        });

        let hash = 0;
        for (let i = 0; i < contextStr.length; i++) {
            const char = contextStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    private detectLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'py':
                return 'python';
            case 'go':
                return 'go';
            case 'rs':
                return 'rust';
            default:
                return 'javascript';
        }
    }
}

// Singleton instance
let instance: CompletionEngine | null = null;

export function getCompletionEngine(): CompletionEngine {
    if (!instance) {
        instance = new CompletionEngine();
    }
    return instance;
}
