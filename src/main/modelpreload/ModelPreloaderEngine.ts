/**
 * Model Preloader - Preload models for fast inference
 */
import { EventEmitter } from 'events';

export interface PreloadedModel { id: string; modelId: string; loadedAt: number; memoryUsed: number; ready: boolean; lastUsed: number; }

export class ModelPreloaderEngine extends EventEmitter {
    private static instance: ModelPreloaderEngine;
    private preloaded: Map<string, PreloadedModel> = new Map();
    private maxPreloaded = 3;
    private constructor() { super(); }
    static getInstance(): ModelPreloaderEngine { if (!ModelPreloaderEngine.instance) ModelPreloaderEngine.instance = new ModelPreloaderEngine(); return ModelPreloaderEngine.instance; }

    async preload(modelId: string, memoryUsed = 4000): Promise<PreloadedModel> {
        if (this.preloaded.size >= this.maxPreloaded) this.evictLRU();
        const pm: PreloadedModel = { id: `pre_${Date.now()}`, modelId, loadedAt: Date.now(), memoryUsed, ready: false, lastUsed: Date.now() };
        this.preloaded.set(modelId, pm);
        await new Promise(r => setTimeout(r, 100)); pm.ready = true;
        this.emit('ready', pm); return pm;
    }

    private evictLRU(): void { let oldest: PreloadedModel | null = null; for (const m of this.preloaded.values()) { if (!oldest || m.lastUsed < oldest.lastUsed) oldest = m; } if (oldest) { this.preloaded.delete(oldest.modelId); this.emit('evicted', oldest.modelId); } }
    use(modelId: string): PreloadedModel | null { const m = this.preloaded.get(modelId); if (m) m.lastUsed = Date.now(); return m || null; }
    isPreloaded(modelId: string): boolean { return this.preloaded.has(modelId) && this.preloaded.get(modelId)!.ready; }
    unload(modelId: string): boolean { return this.preloaded.delete(modelId); }
    getAll(): PreloadedModel[] { return Array.from(this.preloaded.values()); }
    setMaxPreloaded(max: number): void { this.maxPreloaded = max; }
}
export function getModelPreloaderEngine(): ModelPreloaderEngine { return ModelPreloaderEngine.getInstance(); }
