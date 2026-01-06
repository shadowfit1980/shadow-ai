/**
 * Model Catalog - 200+ models
 */
import { EventEmitter } from 'events';

export interface CatalogModel { id: string; name: string; provider: string; category: 'llm' | 'image' | 'video' | 'audio' | 'embedding'; pricing: { input: number; output: number }; capabilities: string[]; }

export class ModelCatalogEngine extends EventEmitter {
    private static instance: ModelCatalogEngine;
    private models: Map<string, CatalogModel> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ModelCatalogEngine { if (!ModelCatalogEngine.instance) ModelCatalogEngine.instance = new ModelCatalogEngine(); return ModelCatalogEngine.instance; }

    private initDefaults(): void {
        const defaults: CatalogModel[] = [
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', category: 'llm', pricing: { input: 0.005, output: 0.015 }, capabilities: ['chat', 'code', 'vision'] },
            { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', category: 'llm', pricing: { input: 0.003, output: 0.015 }, capabilities: ['chat', 'code', 'analysis'] },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', category: 'llm', pricing: { input: 0.0001, output: 0.0004 }, capabilities: ['chat', 'code', 'multimodal'] },
            { id: 'sdxl', name: 'Stable Diffusion XL', provider: 'stability', category: 'image', pricing: { input: 0.02, output: 0 }, capabilities: ['text-to-image'] },
            { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', category: 'image', pricing: { input: 0.04, output: 0 }, capabilities: ['text-to-image'] }
        ];
        defaults.forEach(m => this.models.set(m.id, m));
    }

    register(model: Omit<CatalogModel, 'id'>): CatalogModel { const cat: CatalogModel = { id: `model_${Date.now()}`, ...model }; this.models.set(cat.id, cat); return cat; }
    getByCategory(category: CatalogModel['category']): CatalogModel[] { return Array.from(this.models.values()).filter(m => m.category === category); }
    search(query: string): CatalogModel[] { const q = query.toLowerCase(); return Array.from(this.models.values()).filter(m => m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q)); }
    getAll(): CatalogModel[] { return Array.from(this.models.values()); }
}
export function getModelCatalogEngine(): ModelCatalogEngine { return ModelCatalogEngine.getInstance(); }
