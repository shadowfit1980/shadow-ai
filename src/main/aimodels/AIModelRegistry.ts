/**
 * AI Model Registry - Model catalog
 */
import { EventEmitter } from 'events';

export interface AIModel { id: string; name: string; provider: string; type: 'chat' | 'completion' | 'embedding' | 'image'; contextWindow: number; pricing: { input: number; output: number }; capabilities: string[]; }

export class AIModelRegistry extends EventEmitter {
    private static instance: AIModelRegistry;
    private models: Map<string, AIModel> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): AIModelRegistry { if (!AIModelRegistry.instance) AIModelRegistry.instance = new AIModelRegistry(); return AIModelRegistry.instance; }

    private initDefaults(): void {
        this.register({ id: 'gpt-4', name: 'GPT-4', provider: 'openai', type: 'chat', contextWindow: 128000, pricing: { input: 0.03, output: 0.06 }, capabilities: ['reasoning', 'coding', 'analysis'] });
        this.register({ id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', type: 'chat', contextWindow: 200000, pricing: { input: 0.015, output: 0.075 }, capabilities: ['reasoning', 'coding', 'long-context'] });
        this.register({ id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', type: 'chat', contextWindow: 1000000, pricing: { input: 0.00025, output: 0.0005 }, capabilities: ['reasoning', 'multimodal'] });
    }

    register(model: AIModel): void { this.models.set(model.id, model); this.emit('registered', model); }
    get(id: string): AIModel | null { return this.models.get(id) || null; }
    getByProvider(provider: string): AIModel[] { return Array.from(this.models.values()).filter(m => m.provider === provider); }
    getByCapability(cap: string): AIModel[] { return Array.from(this.models.values()).filter(m => m.capabilities.includes(cap)); }
    getAll(): AIModel[] { return Array.from(this.models.values()); }
}

export function getAIModelRegistry(): AIModelRegistry { return AIModelRegistry.getInstance(); }
