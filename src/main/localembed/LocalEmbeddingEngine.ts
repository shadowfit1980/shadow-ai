/**
 * Local Embedding - Local vector embeddings
 */
import { EventEmitter } from 'events';

export interface EmbeddingModel { id: string; name: string; dimensions: number; maxTokens: number; loaded: boolean; }
export interface EmbeddingResult { id: string; input: string; embedding: number[]; tokens: number; }

export class LocalEmbeddingEngine extends EventEmitter {
    private static instance: LocalEmbeddingEngine;
    private models: Map<string, EmbeddingModel> = new Map();
    private loadedModel: EmbeddingModel | null = null;
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): LocalEmbeddingEngine { if (!LocalEmbeddingEngine.instance) LocalEmbeddingEngine.instance = new LocalEmbeddingEngine(); return LocalEmbeddingEngine.instance; }

    private initDefaults(): void {
        const defaults: EmbeddingModel[] = [
            { id: 'nomic-embed', name: 'Nomic Embed Text', dimensions: 768, maxTokens: 8192, loaded: false },
            { id: 'all-minilm', name: 'all-MiniLM-L6-v2', dimensions: 384, maxTokens: 512, loaded: false }
        ];
        defaults.forEach(m => this.models.set(m.id, m));
    }

    async load(modelId: string): Promise<boolean> { const m = this.models.get(modelId); if (!m) return false; if (this.loadedModel) this.loadedModel.loaded = false; m.loaded = true; this.loadedModel = m; return true; }

    async embed(texts: string[]): Promise<EmbeddingResult[]> { if (!this.loadedModel) throw new Error('No model loaded'); return texts.map(input => ({ id: `emb_${Date.now()}_${Math.random()}`, input: input.slice(0, 50), embedding: Array(this.loadedModel!.dimensions).fill(0).map(() => Math.random() * 2 - 1), tokens: Math.ceil(input.length / 4) })); }

    cosineSimilarity(a: number[], b: number[]): number { if (a.length !== b.length) return 0; const dot = a.reduce((s, v, i) => s + v * b[i], 0); const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0)); const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0)); return dot / (magA * magB); }
    getModels(): EmbeddingModel[] { return Array.from(this.models.values()); }
}
export function getLocalEmbeddingEngine(): LocalEmbeddingEngine { return LocalEmbeddingEngine.getInstance(); }
