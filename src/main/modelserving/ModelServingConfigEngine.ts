/**
 * Model Serving Config - Inference settings
 */
import { EventEmitter } from 'events';

export interface ServingConfig { id: string; endpointId: string; batchSize: number; maxConcurrency: number; timeout: number; caching: boolean; preprocessing?: string; postprocessing?: string; }

export class ModelServingConfigEngine extends EventEmitter {
    private static instance: ModelServingConfigEngine;
    private configs: Map<string, ServingConfig> = new Map();
    private constructor() { super(); }
    static getInstance(): ModelServingConfigEngine { if (!ModelServingConfigEngine.instance) ModelServingConfigEngine.instance = new ModelServingConfigEngine(); return ModelServingConfigEngine.instance; }

    create(endpointId: string, options: Partial<ServingConfig> = {}): ServingConfig { const cfg: ServingConfig = { id: `scfg_${Date.now()}`, endpointId, batchSize: options.batchSize || 1, maxConcurrency: options.maxConcurrency || 100, timeout: options.timeout || 30000, caching: options.caching ?? true, preprocessing: options.preprocessing, postprocessing: options.postprocessing }; this.configs.set(cfg.id, cfg); return cfg; }
    update(configId: string, updates: Partial<ServingConfig>): boolean { const cfg = this.configs.get(configId); if (!cfg) return false; Object.assign(cfg, updates); this.emit('updated', cfg); return true; }
    getByEndpoint(endpointId: string): ServingConfig | null { return Array.from(this.configs.values()).find(c => c.endpointId === endpointId) || null; }
    getAll(): ServingConfig[] { return Array.from(this.configs.values()); }
}
export function getModelServingConfigEngine(): ModelServingConfigEngine { return ModelServingConfigEngine.getInstance(); }
