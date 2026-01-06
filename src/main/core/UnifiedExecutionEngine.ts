/**
 * ⚡ UnifiedExecutionEngine - Single AI Dispatcher
 * 
 * Claude's Recommendation: One unified abstraction layer
 * Replaces 1,348 fragmented AI provider files
 */

import { EventEmitter } from 'events';

// Types
export interface ExecutionRequest {
    id: string;
    prompt: string;
    systemPrompt?: string;
    context?: ExecutionContext;
    model?: ModelPreference;
    options?: ExecutionOptions;
}

export interface ExecutionContext {
    files?: FileContext[];
    codebase?: string;
    history?: Message[];
    tools?: string[];
}

export interface FileContext {
    path: string;
    content: string;
    language: string;
}

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface ModelPreference {
    provider?: 'auto' | 'openai' | 'anthropic' | 'google' | 'ollama' | 'groq' | 'fireworks';
    model?: string;
    fallback?: boolean;
    local?: boolean;
}

export interface ExecutionOptions {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    timeout?: number;
    retries?: number;
    cacheKey?: string;
}

export interface ExecutionResult {
    id: string;
    content: string;
    model: string;
    provider: string;
    usage: TokenUsage;
    duration: number;
    cached: boolean;
    confidence?: number;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
}

export interface StreamChunk {
    type: 'content' | 'tool_call' | 'error' | 'done';
    content?: string;
    toolCall?: ToolCall;
    error?: string;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

interface ProviderAdapter {
    name: string;
    isAvailable: () => Promise<boolean>;
    execute: (request: ExecutionRequest) => Promise<ExecutionResult>;
    stream: (request: ExecutionRequest) => AsyncGenerator<StreamChunk>;
}

export class UnifiedExecutionEngine extends EventEmitter {
    private static instance: UnifiedExecutionEngine;
    private adapters: Map<string, ProviderAdapter> = new Map();
    private cache: Map<string, ExecutionResult> = new Map();
    private defaultProvider = 'auto';

    private constructor() {
        super();
        this.initializeAdapters();
    }

    static getInstance(): UnifiedExecutionEngine {
        if (!UnifiedExecutionEngine.instance) {
            UnifiedExecutionEngine.instance = new UnifiedExecutionEngine();
        }
        return UnifiedExecutionEngine.instance;
    }

    private initializeAdapters(): void {
        // OpenAI Adapter
        this.adapters.set('openai', {
            name: 'openai',
            isAvailable: async () => !!process.env.OPENAI_API_KEY,
            execute: this.executeOpenAI.bind(this),
            stream: this.streamOpenAI.bind(this)
        });

        // Anthropic Adapter
        this.adapters.set('anthropic', {
            name: 'anthropic',
            isAvailable: async () => !!process.env.ANTHROPIC_API_KEY,
            execute: this.executeAnthropic.bind(this),
            stream: this.streamAnthropic.bind(this)
        });

        // Google Adapter
        this.adapters.set('google', {
            name: 'google',
            isAvailable: async () => !!process.env.GOOGLE_API_KEY,
            execute: this.executeGoogle.bind(this),
            stream: this.streamGoogle.bind(this)
        });

        // Ollama (Local) Adapter
        this.adapters.set('ollama', {
            name: 'ollama',
            isAvailable: this.checkOllama.bind(this),
            execute: this.executeOllama.bind(this),
            stream: this.streamOllama.bind(this)
        });

        // Groq Adapter (fast inference)
        this.adapters.set('groq', {
            name: 'groq',
            isAvailable: async () => !!process.env.GROQ_API_KEY,
            execute: this.executeGroq.bind(this),
            stream: this.streamGroq.bind(this)
        });
    }

    /**
     * Main execution method - single entry point for all AI calls
     */
    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        const startTime = Date.now();
        this.emit('execution:start', { id: request.id });

        // Check cache
        if (request.options?.cacheKey) {
            const cached = this.cache.get(request.options.cacheKey);
            if (cached) {
                this.emit('execution:cached', { id: request.id });
                return { ...cached, cached: true };
            }
        }

        // Select provider
        const provider = await this.selectProvider(request.model);
        if (!provider) {
            throw new Error('No AI provider available');
        }

        this.emit('execution:provider', { id: request.id, provider: provider.name });

        // Execute with retries
        const retries = request.options?.retries ?? 2;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await provider.execute(request);
                result.duration = Date.now() - startTime;

                // Cache result
                if (request.options?.cacheKey) {
                    this.cache.set(request.options.cacheKey, result);
                }

                this.emit('execution:complete', { id: request.id, result });
                return result;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                this.emit('execution:retry', { id: request.id, attempt, error: lastError.message });

                // Try fallback provider
                if (request.model?.fallback && attempt < retries) {
                    const fallbackProvider = await this.getFallbackProvider(provider.name);
                    if (fallbackProvider) {
                        this.emit('execution:fallback', {
                            id: request.id,
                            from: provider.name,
                            to: fallbackProvider.name
                        });
                        try {
                            const result = await fallbackProvider.execute(request);
                            result.duration = Date.now() - startTime;
                            this.emit('execution:complete', { id: request.id, result });
                            return result;
                        } catch {
                            // Continue to next retry
                        }
                    }
                }
            }
        }

        this.emit('execution:failed', { id: request.id, error: lastError?.message });
        throw lastError || new Error('Execution failed');
    }

    /**
     * Streaming execution
     */
    async *stream(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const provider = await this.selectProvider(request.model);
        if (!provider) {
            yield { type: 'error', error: 'No AI provider available' };
            return;
        }

        this.emit('stream:start', { id: request.id, provider: provider.name });

        try {
            for await (const chunk of provider.stream(request)) {
                yield chunk;
            }
        } catch (error) {
            yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }

        this.emit('stream:complete', { id: request.id });
    }

    /**
     * Select best provider based on preferences and availability
     */
    private async selectProvider(preference?: ModelPreference): Promise<ProviderAdapter | null> {
        // Specific provider requested
        if (preference?.provider && preference.provider !== 'auto') {
            const adapter = this.adapters.get(preference.provider);
            if (adapter && await adapter.isAvailable()) {
                return adapter;
            }
        }

        // Local preference
        if (preference?.local) {
            const ollama = this.adapters.get('ollama');
            if (ollama && await ollama.isAvailable()) {
                return ollama;
            }
        }

        // Auto-select based on availability and speed
        const priorityOrder = ['groq', 'anthropic', 'openai', 'google', 'ollama'];
        for (const name of priorityOrder) {
            const adapter = this.adapters.get(name);
            if (adapter && await adapter.isAvailable()) {
                return adapter;
            }
        }

        return null;
    }

    /**
     * Get fallback provider
     */
    private async getFallbackProvider(currentProvider: string): Promise<ProviderAdapter | null> {
        const fallbackOrder = ['anthropic', 'openai', 'google', 'groq', 'ollama'];
        for (const name of fallbackOrder) {
            if (name === currentProvider) continue;
            const adapter = this.adapters.get(name);
            if (adapter && await adapter.isAvailable()) {
                return adapter;
            }
        }
        return null;
    }

    // Provider implementations
    private async executeOpenAI(request: ExecutionRequest): Promise<ExecutionResult> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: request.model?.model || 'gpt-4o',
                messages: this.buildMessages(request),
                temperature: request.options?.temperature ?? 0.7,
                max_tokens: request.options?.maxTokens ?? 4096
            })
        });

        const data = await response.json();

        return {
            id: request.id,
            content: data.choices[0].message.content,
            model: data.model,
            provider: 'openai',
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            },
            duration: 0,
            cached: false
        };
    }

    private async executeAnthropic(request: ExecutionRequest): Promise<ExecutionResult> {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: request.model?.model || 'claude-3-5-sonnet-20241022',
                max_tokens: request.options?.maxTokens ?? 4096,
                system: request.systemPrompt,
                messages: this.buildAnthropicMessages(request)
            })
        });

        const data = await response.json();

        return {
            id: request.id,
            content: data.content[0].text,
            model: data.model,
            provider: 'anthropic',
            usage: {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens
            },
            duration: 0,
            cached: false
        };
    }

    private async executeGoogle(request: ExecutionRequest): Promise<ExecutionResult> {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${request.model?.model || 'gemini-1.5-pro'}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: request.prompt }] }]
                })
            }
        );

        const data = await response.json();

        return {
            id: request.id,
            content: data.candidates[0].content.parts[0].text,
            model: request.model?.model || 'gemini-1.5-pro',
            provider: 'google',
            usage: {
                promptTokens: 0,
                completionTokens: 0,
                totalTokens: 0
            },
            duration: 0,
            cached: false
        };
    }

    private async executeOllama(request: ExecutionRequest): Promise<ExecutionResult> {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: request.model?.model || 'llama3.1',
                prompt: request.prompt,
                system: request.systemPrompt,
                stream: false
            })
        });

        const data = await response.json();

        return {
            id: request.id,
            content: data.response,
            model: data.model,
            provider: 'ollama',
            usage: {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            },
            duration: 0,
            cached: false
        };
    }

    private async executeGroq(request: ExecutionRequest): Promise<ExecutionResult> {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: request.model?.model || 'llama-3.1-70b-versatile',
                messages: this.buildMessages(request),
                temperature: request.options?.temperature ?? 0.7,
                max_tokens: request.options?.maxTokens ?? 4096
            })
        });

        const data = await response.json();

        return {
            id: request.id,
            content: data.choices[0].message.content,
            model: data.model,
            provider: 'groq',
            usage: {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            },
            duration: 0,
            cached: false
        };
    }

    // Streaming implementations (simplified)
    private async *streamOpenAI(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const result = await this.executeOpenAI(request);
        yield { type: 'content', content: result.content };
        yield { type: 'done' };
    }

    private async *streamAnthropic(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const result = await this.executeAnthropic(request);
        yield { type: 'content', content: result.content };
        yield { type: 'done' };
    }

    private async *streamGoogle(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const result = await this.executeGoogle(request);
        yield { type: 'content', content: result.content };
        yield { type: 'done' };
    }

    private async *streamOllama(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const result = await this.executeOllama(request);
        yield { type: 'content', content: result.content };
        yield { type: 'done' };
    }

    private async *streamGroq(request: ExecutionRequest): AsyncGenerator<StreamChunk> {
        const result = await this.executeGroq(request);
        yield { type: 'content', content: result.content };
        yield { type: 'done' };
    }

    // Helper methods
    private buildMessages(request: ExecutionRequest): { role: string; content: string }[] {
        const messages: { role: string; content: string }[] = [];

        if (request.systemPrompt) {
            messages.push({ role: 'system', content: request.systemPrompt });
        }

        if (request.context?.history) {
            messages.push(...request.context.history.map(m => ({
                role: m.role,
                content: m.content
            })));
        }

        messages.push({ role: 'user', content: request.prompt });

        return messages;
    }

    private buildAnthropicMessages(request: ExecutionRequest): { role: string; content: string }[] {
        const messages: { role: string; content: string }[] = [];

        if (request.context?.history) {
            messages.push(...request.context.history.map(m => ({
                role: m.role === 'system' ? 'user' : m.role,
                content: m.content
            })));
        }

        messages.push({ role: 'user', content: request.prompt });

        return messages;
    }

    private async checkOllama(): Promise<boolean> {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Get available providers
     */
    async getAvailableProviders(): Promise<string[]> {
        const available: string[] = [];
        for (const [name, adapter] of this.adapters) {
            if (await adapter.isAvailable()) {
                available.push(name);
            }
        }
        return available;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}

export const unifiedExecutionEngine = UnifiedExecutionEngine.getInstance();
