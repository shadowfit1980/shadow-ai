import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { AIModel, ModelPerformance, AgentMessage } from '../types';
import { ConfigManager } from '../config/ConfigManager';

/**
 * Unified AI Model Manager
 * Handles all AI model interactions (cloud and local)
 */
export class ModelManager {
    private static instance: ModelManager;
    private models: Map<string, AIModel> = new Map();
    private currentModel: AIModel | null = null;
    private openai: OpenAI | null = null;
    private anthropic: Anthropic | null = null;

    private constructor() {
        this.loadApiKeysFromConfig();
        this.initializeModels();
    }

    static getInstance(): ModelManager {
        if (!ModelManager.instance) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    /**
     * Load API keys from ConfigManager into environment
     */
    private loadApiKeysFromConfig(): void {
        const config = ConfigManager.getInstance();
        const apiKeys = config.getAllApiKeys();

        console.log('🔑 Loading API keys from config...');

        if (apiKeys.openai) {
            process.env.OPENAI_API_KEY = apiKeys.openai;
            console.log('✓ Loaded OpenAI key from config');
        }
        if (apiKeys.anthropic) {
            process.env.ANTHROPIC_API_KEY = apiKeys.anthropic;
            console.log('✓ Loaded Anthropic key from config');
        }
        if (apiKeys.mistral) {
            process.env.MISTRAL_API_KEY = apiKeys.mistral;
            console.log('✓ Loaded Mistral key from config');
        }
        if (apiKeys.deepseek) {
            process.env.DEEPSEEK_API_KEY = apiKeys.deepseek;
            console.log('✓ Loaded DeepSeek key from config');
        }
        if (apiKeys.gemini) {
            process.env.GEMINI_API_KEY = apiKeys.gemini;
            console.log('✓ Loaded Gemini key from config');
        }
        if (apiKeys.openrouter) {
            process.env.OPENROUTER_API_KEY = apiKeys.openrouter;
            console.log('✓ Loaded OpenRouter key from config');
        }
        if (apiKeys.ollama) {
            process.env.OLLAMA_API_KEY = apiKeys.ollama;
            console.log('✓ Loaded Ollama API key from config');
        }
        if (apiKeys.groq) {
            process.env.GROQ_API_KEY = apiKeys.groq;
            console.log('✓ Loaded Groq API key from config');
        }
    }

    /**
     * Initialize available AI models
     */
    private async initializeModels(): Promise<void> {
        console.log('🔧 Initializing models. Env keys:', {
            openai: !!process.env.OPENAI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
            mistral: !!process.env.MISTRAL_API_KEY,
            deepseek: !!process.env.DEEPSEEK_API_KEY,
            gemini: !!process.env.GEMINI_API_KEY,
        });
        // Cloud models
        if (process.env.OPENAI_API_KEY) {
            console.log('🔑 OpenAI API key detected');
            this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            this.addModel({
                id: 'gpt-4o',
                name: 'GPT-4o',
                provider: 'openai',
                type: 'cloud',
                available: true,
            });
            this.addModel({
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                provider: 'openai',
                type: 'cloud',
                available: true,
            });
            this.addModel({
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                type: 'cloud',
                available: true,
            });
        }

        if (process.env.ANTHROPIC_API_KEY) {
            console.log('🔑 Anthropic API key detected');
            this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            this.addModel({
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                type: 'cloud',
                available: true,
            });
            this.addModel({
                id: 'claude-3-sonnet',
                name: 'Claude 3 Sonnet',
                provider: 'anthropic',
                type: 'cloud',
                available: true,
            });
        }

        // Enhanced providers
        if (process.env.MISTRAL_API_KEY) {
            console.log('🔑 Mistral API key detected');
            const { MistralProvider } = await import('./EnhancedProviders');
            const mistral = new MistralProvider(process.env.MISTRAL_API_KEY);
            if (await mistral.isAvailable()) {
                this.addModel({
                    id: 'mistral-large-latest',
                    name: 'Mistral Large',
                    provider: 'mistral',
                    type: 'cloud',
                    available: true,
                });
                this.addModel({
                    id: 'mistral-medium-latest',
                    name: 'Mistral Medium',
                    provider: 'mistral',
                    type: 'cloud',
                    available: true,
                });
            }
        }

        if (process.env.DEEPSEEK_API_KEY) {
            console.log('🔑 DeepSeek API key detected');
            const { DeepSeekProvider } = await import('./EnhancedProviders');
            const deepseek = new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);
            if (await deepseek.isAvailable()) {
                this.addModel({
                    id: 'deepseek-chat',
                    name: 'DeepSeek Chat',
                    provider: 'deepseek',
                    type: 'cloud',
                    available: true,
                });
            }
        }

        // Gemini - Google AI with Dynamic Model Discovery
        if (process.env.GEMINI_API_KEY) {
            console.log('🔑 Gemini API key detected');
            const { GeminiProvider } = await import('./EnhancedProviders');
            const gemini = new GeminiProvider(process.env.GEMINI_API_KEY);
            try {
                if (await gemini.isAvailable()) {
                    // Dynamically discover available models (paid first, then free)
                    const discoveredModels = await gemini.discoverModels();

                    console.log(`📊 [ModelManager] Discovered ${discoveredModels.length} Gemini models`);

                    for (const model of discoveredModels) {
                        const tierLabel = model.isPaid ? '💎 Pro' : '🆓 Free';
                        this.addModel({
                            id: model.id,
                            name: `${model.name} (${tierLabel})`,
                            provider: 'gemini',
                            type: 'cloud',
                            available: true,
                        });
                    }

                    console.log('✅ Gemini models registered (prioritized: paid → free, latest → oldest)');
                }
            } catch (error) {
                console.log('⚠️ Gemini setup skipped:', (error as Error).message);
            }
        }

        // OpenRouter - Fetch free models dynamically
        if (process.env.OPENROUTER_API_KEY) {
            console.log('🔑 OpenRouter API key detected');
            const { OpenRouterProvider } = await import('./EnhancedProviders');
            const openrouter = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);

            // Fetch free models from OpenRouter API
            const freeModels = await openrouter.getFreeModels();

            // Add each free model
            for (const model of freeModels) {
                this.addModel({
                    id: model.id,
                    name: `${model.name} (🆓 OpenRouter)`,
                    provider: 'openrouter',
                    type: 'cloud',
                    available: true,
                });
            }

            console.log(`✅ Added ${freeModels.length} free OpenRouter models`);
        }

        // Groq - Ultra-fast inference, fetch models dynamically
        if (process.env.GROQ_API_KEY) {
            console.log('🔑 Groq API key detected');
            const { GroqProvider } = await import('./EnhancedProviders');
            const groq = new GroqProvider(process.env.GROQ_API_KEY);

            try {
                if (await groq.isAvailable()) {
                    const groqModels = await groq.getAvailableModels();

                    for (const model of groqModels) {
                        this.addModel({
                            id: model.id,
                            name: `${model.name} (⚡ Groq)`,
                            provider: 'groq',
                            type: 'cloud',
                            available: true,
                        });
                    }
                    console.log(`✅ Added ${groqModels.length} Groq models`);
                }
            } catch (error) {
                console.log('⚠️ Groq setup skipped:', (error as Error).message);
            }
        }

        // Check for local models
        await this.checkLocalModels();
        console.log('✅ Finished checking local models');

        // Auto-select best model
        this.autoSelectModel();
        console.log('🔄 Auto-selection completed. Current model:', this.currentModel?.name ?? 'none');
    }

    /**
     * Update API keys and reinitialize models
     */
    async updateApiKeys(keys: { [key: string]: string }): Promise<void> {
        console.log('🔑 Updating API keys:', Object.keys(keys).filter(k => keys[k]));

        // Persist to ConfigManager
        const config = ConfigManager.getInstance();
        config.updateApiKeys(keys);
        console.log('💾 Persisted API keys to encrypted config');

        // Update environment variables
        if (keys.openai) {
            process.env.OPENAI_API_KEY = keys.openai;
            console.log('✓ OpenAI key set:', keys.openai.substring(0, 10) + '...');
        }
        if (keys.anthropic) {
            process.env.ANTHROPIC_API_KEY = keys.anthropic;
            console.log('✓ Anthropic key set:', keys.anthropic.substring(0, 10) + '...');
        }
        if (keys.mistral) {
            process.env.MISTRAL_API_KEY = keys.mistral;
            console.log('✓ Mistral key set');
        }
        if (keys.deepseek) {
            process.env.DEEPSEEK_API_KEY = keys.deepseek;
            console.log('✓ DeepSeek key set');
        }
        if (keys.gemini) {
            process.env.GEMINI_API_KEY = keys.gemini;
            console.log('✓ Gemini key set');
        }
        if (keys.openrouter) {
            process.env.OPENROUTER_API_KEY = keys.openrouter;
            console.log('✓ OpenRouter key set:', keys.openrouter.substring(0, 10) + '...');
        }
        if (keys.ollama) {
            process.env.OLLAMA_API_KEY = keys.ollama;
            console.log('✓ Ollama API key set:', keys.ollama.substring(0, 10) + '...');
        }
        if (keys.groq) {
            process.env.GROQ_API_KEY = keys.groq;
            console.log('✓ Groq API key set:', keys.groq.substring(0, 10) + '...');
        }

        // Clear existing models
        console.log('🗑️  Clearing', this.models.size, 'existing models');
        this.models.clear();
        this.currentModel = null;

        // Reinitialize
        console.log('🔄 Reinitializing models...');
        await this.initializeModels();

        console.log('✅ API keys updated,', this.models.size, 'models available');
    }

    /**
     * Check availability of local AI models
     */
    private async checkLocalModels(): Promise<void> {
        // Check Ollama Cloud (with API key)
        if (process.env.OLLAMA_API_KEY) {
            console.log('🔑 Ollama API key detected, using cloud provider');
            try {
                const { OllamaCloudProvider } = await import('./EnhancedProviders');
                const ollamaCloud = new OllamaCloudProvider(process.env.OLLAMA_API_KEY);

                if (await ollamaCloud.isAvailable()) {
                    const models = await ollamaCloud.listModels();
                    for (const model of models) {
                        this.addModel({
                            id: `ollama-cloud-${model.id}`,
                            name: `🌐 Ollama Cloud: ${model.name}`,
                            provider: 'ollama',
                            type: 'cloud',
                            available: true,
                        });
                    }
                    console.log(`✅ Added ${models.length} Ollama Cloud models`);
                } else {
                    // Add default models if API is available but no models listed
                    const defaultModels = ['llama2', 'llama3', 'codellama', 'mistral', 'mixtral', 'deepseek-coder'];
                    for (const modelName of defaultModels) {
                        this.addModel({
                            id: `ollama-cloud-${modelName}`,
                            name: `🌐 Ollama Cloud: ${modelName}`,
                            provider: 'ollama',
                            type: 'cloud',
                            available: true,
                        });
                    }
                    console.log('✅ Added default Ollama Cloud models');
                }
            } catch (error) {
                console.log('Ollama Cloud not available:', (error as Error).message);
            }
        }

        // Check local Ollama
        try {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            const response = await fetch(`${ollamaUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                if (data.models && data.models.length > 0) {
                    data.models.forEach((model: any) => {
                        this.addModel({
                            id: `ollama-${model.name}`,
                            name: `Ollama: ${model.name}`,
                            provider: 'ollama',
                            type: 'local',
                            available: true,
                        });
                    });
                }
            }
        } catch (error) {
            console.log('Local Ollama not available');
        }

        // Check LM Studio
        try {
            const lmStudioUrl = process.env.LMSTUDIO_URL || 'http://localhost:1234';
            const response = await fetch(`${lmStudioUrl}/v1/models`);
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    data.data.forEach((model: any) => {
                        this.addModel({
                            id: `lmstudio-${model.id}`,
                            name: `LM Studio: ${model.id}`,
                            provider: 'lmstudio',
                            type: 'local',
                            available: true,
                        });
                    });
                }
            }
        } catch (error) {
            console.log('LM Studio not available');
        }
    }

    /**
     * Add a model to the registry
     */
    private addModel(model: AIModel): void {
        this.models.set(model.id, model);
    }

    /**
     * Auto-select the best available model
     */
    private autoSelectModel(): void {
        const preference = process.env.DEFAULT_MODEL || 'auto';

        if (preference !== 'auto') {
            const preferred = this.models.get(preference);
            if (preferred && preferred.available) {
                this.currentModel = preferred;
                return;
            }
        }

        // Priority: Groq (free, fast) > OpenRouter free > Gemini > Claude > GPT
        const priority = [
            'llama-3.3-70b-versatile',  // Groq - free & fast
            'llama-3.1-70b-versatile',  // Groq
            'mixtral-8x7b-32768',       // Groq
            'gemini-2.0-flash',
            'gemini-1.5-flash-latest',
            'gemini-1.5-pro-latest',
            'claude-3-opus',
            'gpt-4-turbo',
            'claude-3-sonnet',
            'gpt-3.5-turbo',
        ];

        for (const id of priority) {
            const model = this.models.get(id);
            if (model && model.available) {
                this.currentModel = model;
                console.log(`Auto-selected model: ${model.name}`);
                return;
            }
        }

        // Fallback to first available local model
        for (const model of this.models.values()) {
            if (model.available && model.type === 'local') {
                this.currentModel = model;
                console.log(`Auto-selected local model: ${model.name}`);
                return;
            }
        }

        console.warn('No AI models available!');
    }

    /**
     * List all available models
     */
    listModels(): AIModel[] {
        return Array.from(this.models.values());
    }

    /**
     * Select a specific model
     */
    selectModel(modelId: string): boolean {
        const model = this.models.get(modelId);
        if (model && model.available) {
            this.currentModel = model;
            console.log(`Selected model: ${model.name}`);
            return true;
        }
        return false;
    }

    /**
     * Get current model
     */
    getCurrentModel(): AIModel | null {
        return this.currentModel;
    }

    /**
     * Chat with the current model
     */
    async chat(messages: AgentMessage[]): Promise<string> {
        if (!this.currentModel) {
            throw new Error('No model selected');
        }

        const startTime = Date.now();

        try {
            let response: string;

            switch (this.currentModel.provider) {
                case 'openai':
                    response = await this.chatOpenAI(messages);
                    break;
                case 'anthropic':
                    response = await this.chatAnthropic(messages);
                    break;
                case 'mistral':
                    response = await this.chatMistral(messages);
                    break;
                case 'deepseek':
                    response = await this.chatDeepSeek(messages);
                    break;
                case 'gemini':
                    response = await this.chatGemini(messages);
                    break;
                case 'openrouter':
                    response = await this.chatOpenRouter(messages);
                    break;
                case 'ollama':
                    response = await this.chatOllama(messages);
                    break;
                case 'lmstudio':
                    response = await this.chatLMStudio(messages);
                    break;
                case 'groq':
                    response = await this.chatGroq(messages);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${this.currentModel.provider}`);
            }

            // Update performance metrics
            const responseTime = Date.now() - startTime;
            this.updatePerformance(this.currentModel.id, responseTime);

            return response;
        } catch (error) {
            console.error('Chat error:', error);
            throw error;
        }
    }

    /**
     * Chat with OpenAI models
     */
    private async chatOpenAI(messages: AgentMessage[]): Promise<string> {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        const completion = await this.openai.chat.completions.create({
            model: this.currentModel!.id,
            messages: formattedMessages as any,
            temperature: 0.7,
            max_tokens: 4000,
        });

        return completion.choices[0]?.message?.content || '';
    }

    /**
     * Chat with Anthropic models
     */
    private async chatAnthropic(messages: AgentMessage[]): Promise<string> {
        if (!this.anthropic) {
            throw new Error('Anthropic client not initialized');
        }

        const formattedMessages = messages
            .filter((msg) => msg.role !== 'system')
            .map((msg) => ({
                role: msg.role === 'agent' ? 'assistant' : msg.role,
                content: msg.content,
            }));

        const systemMessage = messages.find((msg) => msg.role === 'system');

        const response = await this.anthropic.messages.create({
            model: this.currentModel!.id,
            max_tokens: 4000,
            system: systemMessage?.content,
            messages: formattedMessages as any,
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    /**
     * Chat with Ollama models (cloud or local)
     */
    private async chatOllama(messages: AgentMessage[]): Promise<string> {
        const isCloud = this.currentModel!.id.startsWith('ollama-cloud-');

        // Use cloud provider if API key is available and model is cloud-based
        if (isCloud && process.env.OLLAMA_API_KEY) {
            const { OllamaCloudProvider } = await import('./EnhancedProviders');
            const ollamaCloud = new OllamaCloudProvider(process.env.OLLAMA_API_KEY);
            const modelName = this.currentModel!.id.replace('ollama-cloud-', '');

            const formattedMessages = messages.map(msg => ({
                role: msg.role === 'agent' ? 'assistant' : msg.role,
                content: msg.content,
            }));

            return await ollamaCloud.chat(formattedMessages, modelName);
        }

        // Fallback to local Ollama
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        const modelName = this.currentModel!.id.replace('ollama-', '');

        const response = await fetch(`${ollamaUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                messages: messages.map((msg) => ({
                    role: msg.role === 'agent' ? 'assistant' : msg.role,
                    content: msg.content,
                })),
                stream: false,
            }),
        });

        const data = await response.json();
        return data.message?.content || '';
    }

    /**
     * Chat with LM Studio models
     */
    private async chatLMStudio(messages: AgentMessage[]): Promise<string> {
        const lmStudioUrl = process.env.LMSTUDIO_URL || 'http://localhost:1234';

        const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages.map((msg) => ({
                    role: msg.role === 'agent' ? 'assistant' : msg.role,
                    content: msg.content,
                })),
                temperature: 0.7,
                max_tokens: 4000,
            }),
        });

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * Chat with Mistral models
     */
    private async chatMistral(messages: AgentMessage[]): Promise<string> {
        const { MistralProvider } = await import('./EnhancedProviders');
        const mistral = new MistralProvider(process.env.MISTRAL_API_KEY!);

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        return await mistral.chat(formattedMessages, this.currentModel!.id);
    }

    /**
     * Chat with DeepSeek models
     */
    private async chatDeepSeek(messages: AgentMessage[]): Promise<string> {
        const { DeepSeekProvider } = await import('./EnhancedProviders');
        const deepseek = new DeepSeekProvider(process.env.DEEPSEEK_API_KEY!);

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        return await deepseek.chat(formattedMessages);
    }

    /**
     * Chat with Gemini models
     */
    private async chatGemini(messages: AgentMessage[]): Promise<string> {
        const { GeminiProvider } = await import('./EnhancedProviders');
        const gemini = new GeminiProvider(process.env.GEMINI_API_KEY!);

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        return await gemini.chat(formattedMessages, this.currentModel!.id);
    }

    /**
     * Chat with OpenRouter models
     */
    private async chatOpenRouter(messages: AgentMessage[]): Promise<string> {
        const { OpenRouterProvider } = await import('./EnhancedProviders');
        const openrouter = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);

        const formattedMessages = messages.map(msg => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        return await openrouter.chat(formattedMessages, this.currentModel!.id);
    }

    /**
     * Chat with Groq models (ultra-fast inference)
     */
    private async chatGroq(messages: AgentMessage[]): Promise<string> {
        const { GroqProvider } = await import('./EnhancedProviders');
        const groq = new GroqProvider(process.env.GROQ_API_KEY!);

        const formattedMessages = messages.map(msg => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        return await groq.chat(formattedMessages, this.currentModel!.id);
    }

    /**
     * Update model performance metrics
     */
    private updatePerformance(modelId: string, responseTime: number): void {
        const model = this.models.get(modelId);
        if (!model) return;

        if (!model.performance) {
            model.performance = {
                responseTime,
                accuracy: 0.9, // Default, would be calculated based on feedback
                tokensPerSecond: 0,
                lastUsed: new Date(),
            };
        } else {
            // Running average
            model.performance.responseTime =
                (model.performance.responseTime + responseTime) / 2;
            model.performance.lastUsed = new Date();
        }
    }

    /**
     * Stream chat with the current model - yields tokens as they arrive
     */
    async *chatStream(messages: AgentMessage[]): AsyncGenerator<string, string, unknown> {
        if (!this.currentModel) {
            throw new Error('No model selected');
        }

        const startTime = Date.now();
        let fullResponse = '';

        try {
            // Use streaming for supported providers
            switch (this.currentModel.provider) {
                case 'openai':
                    for await (const token of this.streamOpenAI(messages)) {
                        fullResponse += token;
                        yield token;
                    }
                    break;
                case 'openrouter':
                    for await (const token of this.streamOpenRouter(messages)) {
                        fullResponse += token;
                        yield token;
                    }
                    break;
                case 'deepseek':
                    for await (const token of this.streamDeepSeek(messages)) {
                        fullResponse += token;
                        yield token;
                    }
                    break;
                default:
                    // Fallback to non-streaming for unsupported providers
                    console.log(`[Stream] Provider ${this.currentModel.provider} doesn't support streaming, using fallback`);
                    const response = await this.chat(messages);
                    // Simulate streaming by chunking response
                    const words = response.split(' ');
                    for (const word of words) {
                        yield word + ' ';
                        fullResponse += word + ' ';
                        await new Promise(r => setTimeout(r, 10)); // Small delay for visual effect
                    }
            }

            // Update performance metrics
            const responseTime = Date.now() - startTime;
            this.updatePerformance(this.currentModel.id, responseTime);

            return fullResponse.trim();
        } catch (error) {
            console.error('Stream chat error:', error);
            throw error;
        }
    }

    /**
     * Stream with OpenAI
     */
    private async *streamOpenAI(messages: AgentMessage[]): AsyncGenerator<string> {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized');
        }

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        const stream = await this.openai.chat.completions.create({
            model: this.currentModel!.id,
            messages: formattedMessages as any,
            temperature: 0.7,
            max_tokens: 4000,
            stream: true,
        });

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || '';
            if (token) {
                yield token;
            }
        }
    }

    /**
     * Stream with OpenRouter
     */
    private async *streamOpenRouter(messages: AgentMessage[]): AsyncGenerator<string> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenRouter API key not set');
        }

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://shadow-ai.dev',
                'X-Title': 'Shadow AI'
            },
            body: JSON.stringify({
                model: this.currentModel!.id,
                messages: formattedMessages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const token = data.choices?.[0]?.delta?.content || '';
                        if (token) {
                            yield token;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }

    /**
     * Stream with DeepSeek
     */
    private async *streamDeepSeek(messages: AgentMessage[]): AsyncGenerator<string> {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            throw new Error('DeepSeek API key not set');
        }

        const formattedMessages = messages.map((msg) => ({
            role: msg.role === 'agent' ? 'assistant' : msg.role,
            content: msg.content,
        }));

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: this.currentModel!.id,
                messages: formattedMessages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const token = data.choices?.[0]?.delta?.content || '';
                        if (token) {
                            yield token;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }
}
