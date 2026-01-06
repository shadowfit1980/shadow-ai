/**
 * Model Download Manager
 * 
 * Download and manage AI models from multiple sources:
 * - Ollama registry
 * - Hugging Face (GGUF models)
 * - GPT4All catalog
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { app } from 'electron';

// Model catalog entry
export interface ModelCatalogEntry {
    id: string;
    name: string;
    description: string;
    size: string;
    sizeBytes: number;
    source: 'ollama' | 'huggingface' | 'gpt4all';
    downloadUrl?: string;
    parameters?: string;
    quantization?: string;
    tags: string[];
    installed?: boolean;
}

// Download progress
export interface DownloadProgress {
    modelId: string;
    bytesDownloaded: number;
    totalBytes: number;
    percentage: number;
    speed: string;
    eta: string;
    status: 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
}

// Model storage settings
export interface ModelStorageSettings {
    storagePath: string;
    maxStorageGB: number;
    autoCleanup: boolean;
}

/**
 * ModelDownloadManager - Handle model downloads from multiple sources
 */
export class ModelDownloadManager extends EventEmitter {
    private static instance: ModelDownloadManager;
    private storagePath: string;
    private activeDownloads: Map<string, { controller: AbortController; progress: DownloadProgress }> = new Map();
    private catalogCache: ModelCatalogEntry[] = [];

    private constructor() {
        super();
        // Default storage path
        this.storagePath = path.join(app.getPath('userData'), 'models');
        this.ensureStorageDirectory();
    }

    static getInstance(): ModelDownloadManager {
        if (!ModelDownloadManager.instance) {
            ModelDownloadManager.instance = new ModelDownloadManager();
        }
        return ModelDownloadManager.instance;
    }

    /**
     * Ensure storage directory exists
     */
    private ensureStorageDirectory(): void {
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }

    /**
     * Set custom storage path
     */
    setStoragePath(newPath: string): void {
        this.storagePath = newPath;
        this.ensureStorageDirectory();
        this.emit('storagePath:changed', newPath);
    }

    /**
     * Get current storage path
     */
    getStoragePath(): string {
        return this.storagePath;
    }

    /**
     * Get storage info (space used, available)
     */
    async getStorageInfo(): Promise<{ used: number; available: number; models: number }> {
        let totalSize = 0;
        let modelCount = 0;

        try {
            const files = fs.readdirSync(this.storagePath);
            for (const file of files) {
                if (file.endsWith('.gguf') || file.endsWith('.bin')) {
                    const stat = fs.statSync(path.join(this.storagePath, file));
                    totalSize += stat.size;
                    modelCount++;
                }
            }
        } catch { }

        return { used: totalSize, available: 100 * 1024 * 1024 * 1024, models: modelCount };
    }

    /**
     * Browse available models from all sources
     */
    async browseModels(source?: 'ollama' | 'huggingface' | 'gpt4all', search?: string): Promise<ModelCatalogEntry[]> {
        let models: ModelCatalogEntry[] = [];

        if (!source || source === 'ollama') {
            models = models.concat(await this.getOllamaCatalog());
        }
        if (!source || source === 'huggingface') {
            models = models.concat(await this.getHuggingFaceCatalog());
        }
        if (!source || source === 'gpt4all') {
            models = models.concat(await this.getGPT4AllCatalog());
        }

        // Mark installed models
        const installed = await this.getInstalledModels();
        models = models.map(m => ({
            ...m,
            installed: installed.some(i => i.id === m.id),
        }));

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            models = models.filter(m =>
                m.name.toLowerCase().includes(searchLower) ||
                m.description.toLowerCase().includes(searchLower) ||
                m.tags.some(t => t.toLowerCase().includes(searchLower))
            );
        }

        this.catalogCache = models;
        return models;
    }

    /**
     * Get Ollama model catalog
     */
    private async getOllamaCatalog(): Promise<ModelCatalogEntry[]> {
        // Popular Ollama models
        return [
            { id: 'ollama:llama3.2:3b', name: 'Llama 3.2 3B', description: 'Fast, lightweight general purpose model', size: '2.0 GB', sizeBytes: 2147483648, source: 'ollama', parameters: '3B', tags: ['general', 'fast', 'chat'] },
            { id: 'ollama:llama3.2:latest', name: 'Llama 3.2', description: 'Balanced performance for most tasks', size: '4.7 GB', sizeBytes: 5046586573, source: 'ollama', parameters: '8B', tags: ['general', 'chat', 'reasoning'] },
            { id: 'ollama:llama3.1:70b', name: 'Llama 3.1 70B', description: 'Large model for complex tasks', size: '40 GB', sizeBytes: 42949672960, source: 'ollama', parameters: '70B', tags: ['large', 'reasoning', 'complex'] },
            { id: 'ollama:codellama:7b', name: 'Code Llama 7B', description: 'Specialized for code generation', size: '3.8 GB', sizeBytes: 4080218931, source: 'ollama', parameters: '7B', tags: ['coding', 'programming'] },
            { id: 'ollama:codellama:34b', name: 'Code Llama 34B', description: 'Advanced code generation', size: '19 GB', sizeBytes: 20401094656, source: 'ollama', parameters: '34B', tags: ['coding', 'programming', 'large'] },
            { id: 'ollama:deepseek-coder:6.7b', name: 'DeepSeek Coder 6.7B', description: 'Excellent code completion', size: '3.8 GB', sizeBytes: 4080218931, source: 'ollama', parameters: '6.7B', tags: ['coding', 'completion'] },
            { id: 'ollama:mistral:7b', name: 'Mistral 7B', description: 'Fast instruction following', size: '4.1 GB', sizeBytes: 4402341478, source: 'ollama', parameters: '7B', tags: ['general', 'fast', 'instruct'] },
            { id: 'ollama:mixtral:8x7b', name: 'Mixtral 8x7B', description: 'Mixture of experts model', size: '26 GB', sizeBytes: 27917287424, source: 'ollama', parameters: '8x7B', tags: ['large', 'moe', 'reasoning'] },
            { id: 'ollama:phi3:mini', name: 'Phi-3 Mini', description: 'Microsoft small but capable model', size: '2.2 GB', sizeBytes: 2362232013, source: 'ollama', parameters: '3.8B', tags: ['small', 'fast', 'efficient'] },
            { id: 'ollama:qwen2:7b', name: 'Qwen2 7B', description: 'Alibaba multilingual model', size: '4.4 GB', sizeBytes: 4724464025, source: 'ollama', parameters: '7B', tags: ['multilingual', 'general'] },
            { id: 'ollama:gemma2:9b', name: 'Gemma 2 9B', description: 'Google open model', size: '5.4 GB', sizeBytes: 5798205850, source: 'ollama', parameters: '9B', tags: ['general', 'google'] },
            { id: 'ollama:nomic-embed-text', name: 'Nomic Embed Text', description: 'Text embeddings model', size: '274 MB', sizeBytes: 287309824, source: 'ollama', tags: ['embeddings', 'small'] },
            { id: 'ollama:starcoder2:7b', name: 'StarCoder2 7B', description: 'Code generation trained on GitHub', size: '4.0 GB', sizeBytes: 4294967296, source: 'ollama', parameters: '7B', tags: ['coding', 'github'] },
        ];
    }

    /**
     * Get Hugging Face GGUF models catalog
     */
    private async getHuggingFaceCatalog(): Promise<ModelCatalogEntry[]> {
        return [
            { id: 'hf:TheBloke/Llama-2-7B-Chat-GGUF', name: 'Llama 2 7B Chat GGUF', description: 'Meta Llama 2 chat model', size: '3.8 GB', sizeBytes: 4080218931, source: 'huggingface', downloadUrl: 'https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf', quantization: 'Q4_K_M', tags: ['chat', 'llama'] },
            { id: 'hf:TheBloke/Mistral-7B-Instruct-v0.2-GGUF', name: 'Mistral 7B Instruct GGUF', description: 'Mistral instruction-tuned', size: '4.1 GB', sizeBytes: 4402341478, source: 'huggingface', downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf', quantization: 'Q4_K_M', tags: ['instruct', 'mistral'] },
            { id: 'hf:TheBloke/CodeLlama-7B-Instruct-GGUF', name: 'Code Llama 7B Instruct GGUF', description: 'Code generation model', size: '3.8 GB', sizeBytes: 4080218931, source: 'huggingface', downloadUrl: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf', quantization: 'Q4_K_M', tags: ['coding', 'instruct'] },
            { id: 'hf:TheBloke/zephyr-7B-beta-GGUF', name: 'Zephyr 7B Beta GGUF', description: 'Fine-tuned Mistral for chat', size: '4.1 GB', sizeBytes: 4402341478, source: 'huggingface', downloadUrl: 'https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf', quantization: 'Q4_K_M', tags: ['chat', 'aligned'] },
            { id: 'hf:TheBloke/Nous-Hermes-2-Mistral-7B-DPO-GGUF', name: 'Nous Hermes 2 Mistral GGUF', description: 'Highly capable general model', size: '4.1 GB', sizeBytes: 4402341478, source: 'huggingface', downloadUrl: 'https://huggingface.co/TheBloke/Nous-Hermes-2-Mistral-7B-DPO-GGUF/resolve/main/nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf', quantization: 'Q4_K_M', tags: ['general', 'dpo'] },
        ];
    }

    /**
     * Get GPT4All model catalog
     */
    private async getGPT4AllCatalog(): Promise<ModelCatalogEntry[]> {
        return [
            { id: 'gpt4all:mistral-7b-openorca', name: 'Mistral OpenOrca', description: 'Fast chat model', size: '3.8 GB', sizeBytes: 4080218931, source: 'gpt4all', downloadUrl: 'https://gpt4all.io/models/gguf/mistral-7b-openorca.gguf2.Q4_0.gguf', tags: ['chat', 'fast'] },
            { id: 'gpt4all:gpt4all-falcon-newbpe', name: 'GPT4All Falcon', description: 'Falcon-based model', size: '3.9 GB', sizeBytes: 4187593113, source: 'gpt4all', downloadUrl: 'https://gpt4all.io/models/gguf/gpt4all-falcon-newbpe-q4_0.gguf', tags: ['general', 'falcon'] },
            { id: 'gpt4all:nous-hermes-llama2-13b', name: 'Nous Hermes Llama 2 13B', description: 'Large capable model', size: '7.3 GB', sizeBytes: 7838285414, source: 'gpt4all', downloadUrl: 'https://gpt4all.io/models/gguf/nous-hermes-llama2-13b.Q4_0.gguf', tags: ['large', 'capable'] },
            { id: 'gpt4all:orca-mini-3b-gguf2', name: 'Orca Mini 3B', description: 'Small fast model', size: '1.8 GB', sizeBytes: 1932735283, source: 'gpt4all', downloadUrl: 'https://gpt4all.io/models/gguf/orca-mini-3b-gguf2-q4_0.gguf', tags: ['small', 'fast'] },
            { id: 'gpt4all:replit-code-v1_5-3b', name: 'Replit Code 3B', description: 'Code completion model', size: '1.7 GB', sizeBytes: 1825361101, source: 'gpt4all', downloadUrl: 'https://gpt4all.io/models/gguf/replit-code-v1_5-3b-q4_0.gguf', tags: ['coding', 'small'] },
        ];
    }

    /**
     * Get installed models from storage path
     */
    async getInstalledModels(): Promise<ModelCatalogEntry[]> {
        const models: ModelCatalogEntry[] = [];
        try {
            const files = fs.readdirSync(this.storagePath);
            for (const file of files) {
                if (file.endsWith('.gguf') || file.endsWith('.bin')) {
                    const filePath = path.join(this.storagePath, file);
                    const stat = fs.statSync(filePath);
                    models.push({
                        id: `local:${file}`,
                        name: file.replace(/\.(gguf|bin)$/, ''),
                        description: 'Locally installed model',
                        size: this.formatSize(stat.size),
                        sizeBytes: stat.size,
                        source: 'huggingface',
                        installed: true,
                        tags: ['local'],
                    });
                }
            }
        } catch { }
        return models;
    }

    /**
     * Download a model
     */
    async downloadModel(modelId: string): Promise<boolean> {
        // Find model in catalog
        const model = this.catalogCache.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found in catalog`);
        }

        // Handle Ollama models differently (use ollama pull)
        if (model.source === 'ollama') {
            return this.pullOllamaModel(modelId.replace('ollama:', ''));
        }

        // For HuggingFace and GPT4All, download the file
        if (!model.downloadUrl) {
            throw new Error(`No download URL for model ${modelId}`);
        }

        const fileName = model.downloadUrl.split('/').pop() || `${model.id}.gguf`;
        const filePath = path.join(this.storagePath, fileName);

        const controller = new AbortController();
        const progress: DownloadProgress = {
            modelId,
            bytesDownloaded: 0,
            totalBytes: model.sizeBytes,
            percentage: 0,
            speed: '0 MB/s',
            eta: 'calculating...',
            status: 'downloading',
        };

        this.activeDownloads.set(modelId, { controller, progress });
        this.emit('download:started', progress);

        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filePath);
            let startTime = Date.now();

            https.get(model.downloadUrl!, { signal: controller.signal }, (response) => {
                const totalBytes = parseInt(response.headers['content-length'] || '0', 10) || model.sizeBytes;
                progress.totalBytes = totalBytes;

                response.on('data', (chunk) => {
                    progress.bytesDownloaded += chunk.length;
                    progress.percentage = Math.round((progress.bytesDownloaded / totalBytes) * 100);

                    const elapsed = (Date.now() - startTime) / 1000;
                    const speed = progress.bytesDownloaded / elapsed;
                    progress.speed = `${(speed / 1024 / 1024).toFixed(1)} MB/s`;

                    const remaining = (totalBytes - progress.bytesDownloaded) / speed;
                    progress.eta = this.formatTime(remaining);

                    this.emit('download:progress', progress);
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    progress.status = 'completed';
                    progress.percentage = 100;
                    this.emit('download:completed', progress);
                    this.activeDownloads.delete(modelId);
                    resolve(true);
                });
            }).on('error', (err) => {
                fs.unlink(filePath, () => { });
                progress.status = 'error';
                this.emit('download:error', { modelId, error: err.message });
                this.activeDownloads.delete(modelId);
                reject(err);
            });
        });
    }

    /**
     * Pull Ollama model
     */
    private async pullOllamaModel(modelName: string): Promise<boolean> {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

        const progress: DownloadProgress = {
            modelId: `ollama:${modelName}`,
            bytesDownloaded: 0,
            totalBytes: 0,
            percentage: 0,
            speed: '',
            eta: '',
            status: 'downloading',
        };

        this.emit('download:started', progress);

        try {
            const response = await fetch(`${ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: false }),
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }

            progress.status = 'completed';
            progress.percentage = 100;
            this.emit('download:completed', progress);
            return true;
        } catch (error: any) {
            progress.status = 'error';
            this.emit('download:error', { modelId: `ollama:${modelName}`, error: error.message });
            throw error;
        }
    }

    /**
     * Cancel a download
     */
    cancelDownload(modelId: string): boolean {
        const download = this.activeDownloads.get(modelId);
        if (download) {
            download.controller.abort();
            download.progress.status = 'cancelled';
            this.emit('download:cancelled', download.progress);
            this.activeDownloads.delete(modelId);
            return true;
        }
        return false;
    }

    /**
     * Delete a local model
     */
    async deleteModel(modelId: string): Promise<boolean> {
        if (modelId.startsWith('ollama:')) {
            // Delete from Ollama
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            const modelName = modelId.replace('ollama:', '');
            const response = await fetch(`${ollamaUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
            });
            return response.ok;
        }

        // Delete local file
        if (modelId.startsWith('local:')) {
            const fileName = modelId.replace('local:', '');
            const filePath = path.join(this.storagePath, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
        }
        return false;
    }

    /**
     * Get download progress
     */
    getDownloadProgress(modelId: string): DownloadProgress | null {
        return this.activeDownloads.get(modelId)?.progress || null;
    }

    /**
     * Get all active downloads
     */
    getActiveDownloads(): DownloadProgress[] {
        return Array.from(this.activeDownloads.values()).map(d => d.progress);
    }

    /**
     * Scan directory for model files
     */
    async scanDirectory(dirPath: string): Promise<ModelCatalogEntry[]> {
        const models: ModelCatalogEntry[] = [];
        try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                if (file.endsWith('.gguf') || file.endsWith('.bin')) {
                    const filePath = path.join(dirPath, file);
                    const stat = fs.statSync(filePath);
                    models.push({
                        id: `scan:${filePath}`,
                        name: file.replace(/\.(gguf|bin)$/, ''),
                        description: `Found in ${dirPath}`,
                        size: this.formatSize(stat.size),
                        sizeBytes: stat.size,
                        source: 'huggingface',
                        tags: ['scanned'],
                    });
                }
            }
        } catch { }
        return models;
    }

    /**
     * Format bytes to human readable
     */
    private formatSize(bytes: number): string {
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) return `${gb.toFixed(1)} GB`;
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)} MB`;
    }

    /**
     * Format seconds to human readable time
     */
    private formatTime(seconds: number): string {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    }
}

export default ModelDownloadManager;
