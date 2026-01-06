/**
 * Model Customizer - Create custom models
 */
import { EventEmitter } from 'events';

export interface CustomModel { id: string; name: string; baseModel: string; systemPrompt?: string; parameters: Record<string, number>; adapters: string[]; createdAt: number; }

export class ModelCustomizerEngine extends EventEmitter {
    private static instance: ModelCustomizerEngine;
    private models: Map<string, CustomModel> = new Map();
    private constructor() { super(); }
    static getInstance(): ModelCustomizerEngine { if (!ModelCustomizerEngine.instance) ModelCustomizerEngine.instance = new ModelCustomizerEngine(); return ModelCustomizerEngine.instance; }

    create(name: string, baseModel: string, systemPrompt?: string, parameters: Record<string, number> = {}): CustomModel {
        const model: CustomModel = { id: `custom_${Date.now()}`, name, baseModel, systemPrompt, parameters: { temperature: 0.7, top_p: 0.9, top_k: 40, repeat_penalty: 1.1, ...parameters }, adapters: [], createdAt: Date.now() };
        this.models.set(model.id, model); this.emit('created', model); return model;
    }

    addAdapter(modelId: string, adapterPath: string): boolean { const model = this.models.get(modelId); if (!model) return false; model.adapters.push(adapterPath); return true; }
    updateParameters(modelId: string, params: Record<string, number>): boolean { const model = this.models.get(modelId); if (!model) return false; Object.assign(model.parameters, params); return true; }
    delete(modelId: string): boolean { return this.models.delete(modelId); }
    get(modelId: string): CustomModel | null { return this.models.get(modelId) || null; }
    getAll(): CustomModel[] { return Array.from(this.models.values()); }
}
export function getModelCustomizerEngine(): ModelCustomizerEngine { return ModelCustomizerEngine.getInstance(); }
