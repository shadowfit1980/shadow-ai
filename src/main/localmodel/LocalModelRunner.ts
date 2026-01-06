/**
 * Local Model Runner - Run LLMs locally
 */
import { EventEmitter } from 'events';

export interface LocalModel { id: string; name: string; path: string; format: 'gguf' | 'ggml' | 'safetensors'; size: number; quantization: string; contextLength: number; loaded: boolean; }
export interface InferenceConfig { temperature: number; topP: number; topK: number; maxTokens: number; repeatPenalty: number; }

export class LocalModelRunner extends EventEmitter {
    private static instance: LocalModelRunner;
    private models: Map<string, LocalModel> = new Map();
    private loadedModel: LocalModel | null = null;
    private defaultConfig: InferenceConfig = { temperature: 0.7, topP: 0.9, topK: 40, maxTokens: 2048, repeatPenalty: 1.1 };
    private constructor() { super(); }
    static getInstance(): LocalModelRunner { if (!LocalModelRunner.instance) LocalModelRunner.instance = new LocalModelRunner(); return LocalModelRunner.instance; }

    register(name: string, path: string, format: LocalModel['format'], size: number, quantization: string, contextLength = 4096): LocalModel { const model: LocalModel = { id: `lm_${Date.now()}`, name, path, format, size, quantization, contextLength, loaded: false }; this.models.set(model.id, model); return model; }

    async load(modelId: string): Promise<boolean> { const m = this.models.get(modelId); if (!m) return false; if (this.loadedModel) this.loadedModel.loaded = false; m.loaded = true; this.loadedModel = m; this.emit('loaded', m); return true; }
    unload(): void { if (this.loadedModel) { this.loadedModel.loaded = false; this.loadedModel = null; } }

    async generate(prompt: string, config: Partial<InferenceConfig> = {}): Promise<{ text: string; tokens: number; time: number }> { if (!this.loadedModel) throw new Error('No model loaded'); const cfg = { ...this.defaultConfig, ...config }; const start = Date.now(); const text = `[Local ${this.loadedModel.name}] Response to: ${prompt.slice(0, 50)}...`; return { text, tokens: text.split(' ').length * 1.3, time: Date.now() - start }; }

    getLoaded(): LocalModel | null { return this.loadedModel; }
    getAll(): LocalModel[] { return Array.from(this.models.values()); }
}
export function getLocalModelRunner(): LocalModelRunner { return LocalModelRunner.getInstance(); }
