/**
 * Model Registry - Version control
 */
import { EventEmitter } from 'events';

export interface RegisteredModel { id: string; name: string; version: string; framework: string; metrics: Record<string, number>; stage: 'development' | 'staging' | 'production' | 'archived'; created: number; }

export class ModelRegistryEngine extends EventEmitter {
    private static instance: ModelRegistryEngine;
    private models: Map<string, RegisteredModel[]> = new Map();
    private constructor() { super(); }
    static getInstance(): ModelRegistryEngine { if (!ModelRegistryEngine.instance) ModelRegistryEngine.instance = new ModelRegistryEngine(); return ModelRegistryEngine.instance; }

    register(name: string, version: string, framework: string, metrics: Record<string, number> = {}): RegisteredModel {
        const model: RegisteredModel = { id: `model_${Date.now()}`, name, version, framework, metrics, stage: 'development', created: Date.now() };
        const versions = this.models.get(name) || []; versions.push(model); this.models.set(name, versions); return model;
    }

    promote(modelId: string, stage: RegisteredModel['stage']): boolean { for (const versions of this.models.values()) { const m = versions.find(v => v.id === modelId); if (m) { m.stage = stage; this.emit('promoted', m); return true; } } return false; }
    getLatest(name: string): RegisteredModel | null { const versions = this.models.get(name); return versions?.[versions.length - 1] || null; }
    getByStage(stage: RegisteredModel['stage']): RegisteredModel[] { return Array.from(this.models.values()).flat().filter(m => m.stage === stage); }
    getAllModels(): { name: string; versions: RegisteredModel[] }[] { return Array.from(this.models.entries()).map(([name, versions]) => ({ name, versions })); }
}
export function getModelRegistryEngine(): ModelRegistryEngine { return ModelRegistryEngine.getInstance(); }
