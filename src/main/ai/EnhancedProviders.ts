/**
 * Enhanced AI Model Providers
 * DeepSeek, Mistral, and Gemini integrations
 */

import axios from 'axios';

/**
 * DeepSeek AI Provider
 */
export class DeepSeekProvider {
    private apiKey: string;
    private baseURL = 'https://api.deepseek.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[]): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: 'deepseek-chat',
                    messages,
                    temperature: 0.7,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.choices[0].message.content;
        } catch (error: any) {
            throw new Error(`DeepSeek API error: ${error.message}`);
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.baseURL}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
            });
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Mistral AI Provider (Enhanced)
 */
export class MistralProvider {
    private apiKey: string;
    private baseURL = 'https://api.mistral.ai/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'mistral-large-latest'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.choices[0].message.content;
        } catch (error: any) {
            throw new Error(`Mistral API error: ${error.message}`);
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
            });
            return response.data.data.map((m: any) => m.id);
        } catch {
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await this.listModels();
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Google Gemini Provider
 */
export class GeminiProvider {
    private apiKey: string;
    private baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'gemini-pro'): Promise<string> {
        try {
            // Convert messages to Gemini format
            const contents = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

            console.log(`📡 Calling Gemini API with model: ${model}`);

            const response = await axios.post(
                `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
                {
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4000,
                    },
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            return response.data.candidates[0].content.parts[0].text;
        } catch (error: any) {
            console.error(`❌ Gemini API Error:`, {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                url: error.config?.url
            });
            throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async chatWithVision(messages: any[], imageData: string): Promise<string> {
        try {
            const contents = [
                {
                    role: 'user',
                    parts: [
                        { text: messages[messages.length - 1].content },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageData,
                            },
                        },
                    ],
                },
            ];

            const response = await axios.post(
                `${this.baseURL}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
                { contents },
                {
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            return response.data.candidates[0].content.parts[0].text;
        } catch (error: any) {
            throw new Error(`Gemini Vision API error: ${error.message}`);
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.baseURL}/models?key=${this.apiKey}`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Discover all available models from Gemini API
     * Prioritizes: Latest paid models first, then free models
     * Returns sorted array with most powerful models first
     */
    async discoverModels(): Promise<Array<{
        id: string;
        name: string;
        isPaid: boolean;
        tier: 'pro' | 'flash' | 'nano' | 'other';
        version: string;
        capabilities: string[];
    }>> {
        try {
            console.log('🔍 [Gemini] Discovering available models...');

            const response = await axios.get(`${this.baseURL}/models?key=${this.apiKey}`);
            const apiModels = response.data.models || [];

            // Model prioritization based on naming conventions
            const models = apiModels
                .filter((m: any) =>
                    m.name.includes('gemini') &&
                    m.supportedGenerationMethods?.includes('generateContent')
                )
                .map((m: any) => {
                    const fullName = m.name.replace('models/', '');
                    const displayName = m.displayName || fullName;

                    // Determine tier based on model name
                    let tier: 'pro' | 'flash' | 'nano' | 'other' = 'other';
                    if (fullName.includes('pro')) tier = 'pro';
                    else if (fullName.includes('flash')) tier = 'flash';
                    else if (fullName.includes('nano')) tier = 'nano';

                    // Extract version (e.g., "2.0", "1.5", "1.0")
                    const versionMatch = fullName.match(/(\d+\.?\d*)/);
                    const version = versionMatch ? versionMatch[1] : '1.0';

                    // Determine if paid (Pro models are typically paid, Flash/Nano may be free)
                    // In Google AI Studio Pro accounts, all models are accessible
                    // For prioritization: Pro > Flash > Nano
                    const isPaid = tier === 'pro';

                    // Extract capabilities
                    const capabilities: string[] = [];
                    if (m.supportedGenerationMethods?.includes('generateContent')) capabilities.push('text');
                    if (fullName.includes('vision') || m.inputTokenLimit > 100000) capabilities.push('vision');
                    if (fullName.includes('code')) capabilities.push('code');
                    if (m.inputTokenLimit > 500000) capabilities.push('long-context');

                    return {
                        id: fullName,
                        name: displayName,
                        isPaid,
                        tier,
                        version,
                        capabilities,
                    };
                });

            // Sort models: Latest version first, then by tier (Pro > Flash > Nano)
            const tierPriority = { pro: 0, flash: 1, nano: 2, other: 3 };
            models.sort((a: any, b: any) => {
                // First by version (descending)
                const versionDiff = parseFloat(b.version) - parseFloat(a.version);
                if (versionDiff !== 0) return versionDiff;

                // Then by tier
                return tierPriority[a.tier] - tierPriority[b.tier];
            });

            // Separate into paid and free, maintaining order
            const paidModels = models.filter((m: any) => m.isPaid);
            const freeModels = models.filter((m: any) => !m.isPaid);

            // Return paid first, then free
            const sortedModels = [...paidModels, ...freeModels];

            console.log(`✅ [Gemini] Discovered ${sortedModels.length} models (${paidModels.length} paid, ${freeModels.length} free)`);
            console.log(`📊 [Gemini] Top models: ${sortedModels.slice(0, 5).map((m: any) => m.id).join(', ')}`);

            return sortedModels;
        } catch (error: any) {
            console.error('❌ [Gemini] Model discovery failed:', error.message);
            // Return fallback models if discovery fails
            return [
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', isPaid: false, tier: 'flash', version: '2.0', capabilities: ['text'] },
                { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro', isPaid: true, tier: 'pro', version: '1.5', capabilities: ['text', 'vision'] },
                { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash', isPaid: false, tier: 'flash', version: '1.5', capabilities: ['text'] },
            ];
        }
    }
}

/**
 * OpenRouter Provider
 * Unified API for multiple AI models
 */
export class OpenRouterProvider {
    private apiKey: string;
    private baseURL = 'https://openrouter.ai/api/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'openai/gpt-3.5-turbo'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 4000,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://shadow-ai.app', // Optional
                        'X-Title': 'Shadow AI', // Optional
                    },
                }
            );

            return response.data.choices[0].message.content;
        } catch (error: any) {
            throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Test with models list endpoint
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get list of free models from OpenRouter
     */
    async getFreeModels(): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            const models = response.data.data || [];

            // Filter for free models (pricing.prompt = 0 and pricing.completion = 0)
            const freeModels = models
                .filter((model: any) => {
                    const pricing = model.pricing || {};
                    return (
                        parseFloat(pricing.prompt || '0') === 0 &&
                        parseFloat(pricing.completion || '0') === 0
                    );
                })
                .map((model: any) => ({
                    id: model.id,
                    name: model.name || model.id,
                }))
                .slice(0, 10); // Limit to top 10 free models

            console.log(`🆓 Found ${freeModels.length} free OpenRouter models`);
            return freeModels;
        } catch (error: any) {
            console.error('Failed to fetch OpenRouter free models:', error.message);
            return [];
        }
    }
}

/**
 * Ollama Cloud Provider
 * For cloud-hosted Ollama services that require API key authentication
 */
export class OllamaCloudProvider {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string, baseURL: string = 'https://api.ollama.ai') {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    async chat(messages: any[], model: string = 'llama2'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/chat`,
                {
                    model,
                    messages: messages.map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : msg.role,
                        content: msg.content,
                    })),
                    stream: false,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.message?.content || response.data.response || '';
        } catch (error: any) {
            throw new Error(`Ollama Cloud API error: ${error.response?.data?.error || error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            const models = response.data.models || [];
            return models.map((model: any) => ({
                id: model.name,
                name: model.name,
            }));
        } catch (error: any) {
            console.error('Failed to list Ollama Cloud models:', error.message);
            return [];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                timeout: 5000,
            });
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Groq Provider
 * Ultra-fast LLM inference with model discovery
 */
export class GroqProvider {
    private apiKey: string;
    private baseURL = 'https://api.groq.com/openai/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'llama-3.3-70b-versatile'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 4096,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Groq chat error:', error);
            throw error;
        }
    }

    /**
     * Fetch available models from Groq API
     */
    async getAvailableModels(): Promise<Array<{ id: string; name: string; owned_by: string }>> {
        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
            });

            const models = response.data.data || [];

            // Filter for chat/completion models (exclude whisper, guard models)
            const chatModels = models.filter((m: any) =>
                !m.id.includes('whisper') &&
                !m.id.includes('distil') &&
                !m.id.includes('guard')
            );

            console.log(`🆓 Found ${chatModels.length} Groq models`);

            return chatModels.map((m: any) => ({
                id: m.id,
                name: this.formatModelName(m.id),
                owned_by: m.owned_by || 'groq',
            }));
        } catch (error) {
            console.error('Failed to fetch Groq models:', error);
            return [];
        }
    }

    private formatModelName(modelId: string): string {
        const nameMap: Record<string, string> = {
            'llama-3.3-70b-versatile': 'Llama 3.3 70B',
            'llama-3.1-70b-versatile': 'Llama 3.1 70B',
            'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
            'llama3-70b-8192': 'Llama 3 70B',
            'llama3-8b-8192': 'Llama 3 8B',
            'mixtral-8x7b-32768': 'Mixtral 8x7B',
            'gemma2-9b-it': 'Gemma 2 9B',
            'gemma-7b-it': 'Gemma 7B',
        };
        return nameMap[modelId] || modelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                timeout: 5000,
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

/**
 * Model Performance Tracker
 */
export class ModelPerformanceTracker {
    private metrics: Map<string, {
        totalRequests: number;
        totalTokens: number;
        avgResponseTime: number;
        errorRate: number;
    }> = new Map();

    trackRequest(modelId: string, tokens: number, responseTime: number, error: boolean = false): void {
        const current = this.metrics.get(modelId) || {
            totalRequests: 0,
            totalTokens: 0,
            avgResponseTime: 0,
            errorRate: 0,
        };

        current.totalRequests++;
        current.totalTokens += tokens;
        current.avgResponseTime =
            (current.avgResponseTime * (current.totalRequests - 1) + responseTime) / current.totalRequests;

        if (error) {
            current.errorRate =
                (current.errorRate * (current.totalRequests - 1) + 1) / current.totalRequests;
        }

        this.metrics.set(modelId, current);
    }

    getMetrics(modelId: string) {
        return this.metrics.get(modelId) || null;
    }

    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }

    getBestModel(): string | null {
        let best: { id: string; score: number } | null = null;

        for (const [id, metrics] of this.metrics) {
            // Score based on response time and error rate
            const score = (1 / metrics.avgResponseTime) * (1 - metrics.errorRate);

            if (!best || score > best.score) {
                best = { id, score };
            }
        }

        return best?.id || null;
    }
}

/**
 * Anthropic Claude Provider
 * Claude models integration
 */
export class AnthropicProvider {
    private apiKey: string;
    private baseURL = 'https://api.anthropic.com/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'claude-3-sonnet-20240229'): Promise<string> {
        try {
            // Convert to Anthropic format
            const systemMessage = messages.find(m => m.role === 'system')?.content || '';
            const userMessages = messages.filter(m => m.role !== 'system');

            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    model,
                    max_tokens: 4096,
                    system: systemMessage,
                    messages: userMessages.map(m => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content,
                    })),
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                }
            );

            return response.data.content[0]?.text || '';
        } catch (error: any) {
            console.error('Anthropic chat error:', error.response?.data || error.message);
            throw new Error(`Anthropic chat failed: ${error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string; contextWindow: number }>> {
        // Anthropic doesn't have a models endpoint, return known models
        return [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000 },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000 },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextWindow: 200000 },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextWindow: 200000 },
        ];
    }

    async isAvailable(): Promise<boolean> {
        try {
            // Simple check - just verify the API key format
            return this.apiKey && this.apiKey.startsWith('sk-ant-');
        } catch {
            return false;
        }
    }

    async chatWithVision(messages: any[], imageData: string, model: string = 'claude-3-sonnet-20240229'): Promise<string> {
        try {
            const userMessages = messages.map(m => {
                if (m.role === 'user' && m.includeImage) {
                    return {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/png',
                                    data: imageData,
                                },
                            },
                            { type: 'text', text: m.content },
                        ],
                    };
                }
                return { role: m.role, content: m.content };
            });

            const response = await axios.post(
                `${this.baseURL}/messages`,
                {
                    model,
                    max_tokens: 4096,
                    messages: userMessages,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01',
                    },
                }
            );

            return response.data.content[0]?.text || '';
        } catch (error: any) {
            console.error('Anthropic vision error:', error.response?.data || error.message);
            throw new Error(`Anthropic vision failed: ${error.message}`);
        }
    }
}

/**
 * Cohere Provider
 * Cohere models integration
 */
export class CohereProvider {
    private apiKey: string;
    private baseURL = 'https://api.cohere.ai/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'command-r-plus'): Promise<string> {
        try {
            // Convert messages to Cohere format
            const chatHistory = messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
                message: m.content,
            }));
            const lastMessage = messages[messages.length - 1].content;

            const response = await axios.post(
                `${this.baseURL}/chat`,
                {
                    model,
                    message: lastMessage,
                    chat_history: chatHistory.length > 0 ? chatHistory : undefined,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.text || '';
        } catch (error: any) {
            console.error('Cohere chat error:', error.response?.data || error.message);
            throw new Error(`Cohere chat failed: ${error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        return [
            { id: 'command-r-plus', name: 'Command R+' },
            { id: 'command-r', name: 'Command R' },
            { id: 'command', name: 'Command' },
            { id: 'command-light', name: 'Command Light' },
        ];
    }

    async embed(texts: string[], model: string = 'embed-english-v3.0'): Promise<number[][]> {
        try {
            const response = await axios.post(
                `${this.baseURL}/embed`,
                {
                    model,
                    texts,
                    input_type: 'search_document',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.embeddings || [];
        } catch (error: any) {
            console.error('Cohere embed error:', error.response?.data || error.message);
            throw new Error(`Cohere embed failed: ${error.message}`);
        }
    }

    async rerank(query: string, documents: string[], model: string = 'rerank-english-v3.0'): Promise<Array<{ index: number; relevance_score: number }>> {
        try {
            const response = await axios.post(
                `${this.baseURL}/rerank`,
                {
                    model,
                    query,
                    documents,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.results || [];
        } catch (error: any) {
            console.error('Cohere rerank error:', error.response?.data || error.message);
            throw new Error(`Cohere rerank failed: ${error.message}`);
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            return this.apiKey && this.apiKey.length > 10;
        } catch {
            return false;
        }
    }
}


/**
 * Together AI Provider (Many open-source models)
 */
export class TogetherProvider {
    private apiKey: string;
    private baseURL = 'https://api.together.xyz/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'meta-llama/Llama-3-70b-chat-hf'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    max_tokens: 4096,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            return response.data.choices[0]?.message?.content || '';
        } catch (error: any) {
            console.error('Together chat error:', error.response?.data || error.message);
            throw new Error(`Together chat failed: ${error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await axios.get(`${this.baseURL}/models`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });

            return response.data.filter((m: any) => m.type === 'chat')
                .slice(0, 20)
                .map((m: any) => ({ id: m.id, name: m.display_name || m.id }));
        } catch {
            return [
                { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B' },
                { id: 'mistralai/Mixtral-8x22B-Instruct-v0.1', name: 'Mixtral 8x22B' },
                { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen2 72B' },
            ];
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            return this.apiKey && this.apiKey.length > 10;
        } catch {
            return false;
        }
    }
}

/**
 * Perplexity AI Provider
 * Search-augmented AI with internet access
 */
export class PerplexityProvider {
    private apiKey: string;
    private baseURL = 'https://api.perplexity.ai';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], options: {
        model?: string;
        searchDomains?: string[];
        returnCitations?: boolean;
    } = {}): Promise<{ content: string; citations?: string[] }> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: options.model || 'llama-3.1-sonar-large-128k-online',
                    messages: messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    temperature: 0.7,
                    max_tokens: 4096,
                    return_citations: options.returnCitations ?? true,
                    search_domain_filter: options.searchDomains,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );

            const choice = response.data.choices[0];
            return {
                content: choice.message.content,
                citations: response.data.citations,
            };
        } catch (error: any) {
            console.error('Perplexity error:', error.response?.data || error.message);
            throw new Error(`Perplexity chat failed: ${error.message}`);
        }
    }

    async search(query: string): Promise<{ answer: string; sources: string[] }> {
        const result = await this.chat([
            { role: 'user', content: query }
        ], { returnCitations: true });

        return {
            answer: result.content,
            sources: result.citations || [],
        };
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        return [
            { id: 'llama-3.1-sonar-small-128k-online', name: 'Sonar Small (Online)' },
            { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large (Online)' },
            { id: 'llama-3.1-sonar-huge-128k-online', name: 'Sonar Huge (Online)' },
        ];
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey && this.apiKey.length > 10;
    }
}

/**
 * xAI Provider (Grok)
 */
export class XAIProvider {
    private apiKey: string;
    private baseURL = 'https://api.x.ai/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'grok-beta'): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    temperature: 0.7,
                    max_tokens: 4096,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                }
            );
            return response.data.choices[0]?.message?.content || '';
        } catch (error: any) {
            throw new Error(`xAI chat failed: ${error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        return [
            { id: 'grok-beta', name: 'Grok Beta' },
            { id: 'grok-vision-beta', name: 'Grok Vision Beta' },
        ];
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey && this.apiKey.length > 10;
    }
}

/**
 * HuggingFace Provider
 */
export class HuggingFaceProvider {
    private apiKey: string;
    private baseURL = 'https://api-inference.huggingface.co/models';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async chat(messages: any[], model: string = 'meta-llama/Llama-3.2-3B-Instruct'): Promise<string> {
        try {
            const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

            const response = await axios.post(
                `${this.baseURL}/${model}`,
                { inputs: prompt, parameters: { max_new_tokens: 2048, temperature: 0.7 } },
                { headers: { Authorization: `Bearer ${this.apiKey}` } }
            );

            return response.data[0]?.generated_text || response.data?.generated_text || '';
        } catch (error: any) {
            throw new Error(`HuggingFace chat failed: ${error.message}`);
        }
    }

    async listModels(): Promise<Array<{ id: string; name: string }>> {
        return [
            { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B' },
            { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B' },
            { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini' },
            { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B' },
        ];
    }

    async isAvailable(): Promise<boolean> {
        return this.apiKey && this.apiKey.length > 10;
    }
}
