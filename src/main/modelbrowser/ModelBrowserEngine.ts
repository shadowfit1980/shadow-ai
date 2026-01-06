/**
 * Model Browser - Explore and discover models
 */
import { EventEmitter } from 'events';

export interface BrowsableModel { id: string; name: string; author: string; description: string; downloads: number; size: number; quantizations: string[]; tags: string[]; updatedAt: string; }
export interface ModelFilters { search?: string; tags?: string[]; minSize?: number; maxSize?: number; sortBy: 'downloads' | 'updated' | 'name'; }

export class ModelBrowserEngine extends EventEmitter {
    private static instance: ModelBrowserEngine;
    private models: BrowsableModel[] = [];
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ModelBrowserEngine { if (!ModelBrowserEngine.instance) ModelBrowserEngine.instance = new ModelBrowserEngine(); return ModelBrowserEngine.instance; }

    private initDefaults(): void {
        this.models = [
            { id: 'gpt-oss', name: 'gpt-oss', author: 'lmstudio', description: 'Open source GPT-style model', downloads: 100000, size: 4000000000, quantizations: ['Q4_K_M', 'Q5_K_M', 'Q8_0'], tags: ['chat', 'code'], updatedAt: new Date().toISOString() },
            { id: 'llama-3.2', name: 'Llama 3.2', author: 'meta', description: 'Meta Llama 3.2', downloads: 500000, size: 8000000000, quantizations: ['Q4_K_M', 'Q8_0'], tags: ['chat', 'multilingual'], updatedAt: new Date().toISOString() },
            { id: 'qwen3', name: 'Qwen3', author: 'qwen', description: 'Alibaba Qwen 3', downloads: 200000, size: 7000000000, quantizations: ['Q4_K_M', 'Q5_K_M'], tags: ['chat', 'reasoning'], updatedAt: new Date().toISOString() },
            { id: 'deepseek-r1', name: 'DeepSeek R1', author: 'deepseek', description: 'DeepSeek reasoning model', downloads: 150000, size: 6000000000, quantizations: ['Q4_K_M'], tags: ['reasoning', 'code'], updatedAt: new Date().toISOString() }
        ];
    }

    search(filters: ModelFilters): BrowsableModel[] { let results = [...this.models]; if (filters.search) { const q = filters.search.toLowerCase(); results = results.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)); } if (filters.tags?.length) results = results.filter(m => filters.tags!.some(t => m.tags.includes(t))); if (filters.minSize) results = results.filter(m => m.size >= filters.minSize!); if (filters.maxSize) results = results.filter(m => m.size <= filters.maxSize!); results.sort((a, b) => filters.sortBy === 'downloads' ? b.downloads - a.downloads : filters.sortBy === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)); return results; }
    get(modelId: string): BrowsableModel | null { return this.models.find(m => m.id === modelId) || null; }
    getTags(): string[] { return [...new Set(this.models.flatMap(m => m.tags))]; }
}
export function getModelBrowserEngine(): ModelBrowserEngine { return ModelBrowserEngine.getInstance(); }
