/**
 * Local Model Manager
 * 
 * Detect and manage local AI models (Ollama, LM Studio, GPT4All, llama.cpp)
 */

import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);

interface LocalModel {
    name: string;
    size: string;
    modified: string;
    digest: string;
    provider: 'ollama' | 'lmstudio' | 'gpt4all' | 'llamacpp' | 'other';
    path?: string;
}

interface OllamaStatus {
    running: boolean;
    version?: string;
    models: LocalModel[];
}

interface LMStudioStatus {
    running: boolean;
    models: LocalModel[];
}

interface LocalModelSettings {
    ollamaUrl: string;
    lmStudioUrl: string;
    gpt4allPath: string;
    modelStoragePath: string;
}

/**
 * LocalModelManager - Manage local AI models
 */
export class LocalModelManager extends EventEmitter {
    private static instance: LocalModelManager;
    private settings: LocalModelSettings = {
        ollamaUrl: 'http://localhost:11434',
        lmStudioUrl: 'http://localhost:1234',
        gpt4allPath: '',
        modelStoragePath: '',
    };
    private cachedModels: LocalModel[] = [];
    private isOllamaRunning = false;
    private isLMStudioRunning = false;

    private constructor() {
        super();
        this.settings.modelStoragePath = path.join(app.getPath('userData'), 'models');
        this.loadSettings();
    }

    static getInstance(): LocalModelManager {
        if (!LocalModelManager.instance) {
            LocalModelManager.instance = new LocalModelManager();
        }
        return LocalModelManager.instance;
    }

    /**
     * Load settings from localStorage equivalent
     */
    private loadSettings(): void {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'local-model-settings.json');
            if (fs.existsSync(settingsPath)) {
                const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                this.settings = { ...this.settings, ...data };
            }
        } catch { }
    }

    /**
     * Save settings
     */
    private saveSettings(): void {
        try {
            const settingsPath = path.join(app.getPath('userData'), 'local-model-settings.json');
            fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2));
        } catch { }
    }

    /**
     * Update settings
     */
    updateSettings(newSettings: Partial<LocalModelSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.emit('settings:updated', this.settings);
    }

    /**
     * Get current settings
     */
    getSettings(): LocalModelSettings {
        return { ...this.settings };
    }

    /**
     * Set model storage path
     */
    setStoragePath(newPath: string): void {
        this.settings.modelStoragePath = newPath;
        this.saveSettings();
        // Ensure directory exists
        if (!fs.existsSync(newPath)) {
            fs.mkdirSync(newPath, { recursive: true });
        }
        this.emit('storagePath:changed', newPath);
    }

    /**
     * Get storage path
     */
    getStoragePath(): string {
        return this.settings.modelStoragePath;
    }


    /**
     * Check if Ollama is installed and running
     */
    async checkOllamaStatus(): Promise<OllamaStatus> {
        try {
            // Check if Ollama is running
            const response = await fetch(`${this.settings.ollamaUrl}/api/tags`);
            if (!response.ok) {
                return { running: false, models: [] };
            }

            const data = await response.json();
            this.isOllamaRunning = true;

            const models: LocalModel[] = (data.models || []).map((m: any) => ({
                name: m.name,
                size: this.formatSize(m.size),
                modified: m.modified_at,
                digest: m.digest?.substring(0, 12),
                provider: 'ollama' as const,
            }));

            this.cachedModels = models;

            // Get version
            let version: string | undefined;
            try {
                const versionRes = await fetch(`${this.settings.ollamaUrl}/api/version`);
                const versionData = await versionRes.json();
                version = versionData.version;
            } catch { }

            return { running: true, version, models };
        } catch {
            this.isOllamaRunning = false;
            return { running: false, models: [] };
        }
    }

    /**
     * Format size in human-readable format
     */
    private formatSize(bytes: number): string {
        if (!bytes) return 'Unknown';
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) return `${gb.toFixed(1)} GB`;
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)} MB`;
    }

    /**
     * List available local models
     */
    async listModels(): Promise<LocalModel[]> {
        const status = await this.checkOllamaStatus();
        return status.models;
    }

    /**
     * Pull a model from Ollama
     */
    async pullModel(modelName: string): Promise<boolean> {
        if (!this.isOllamaRunning) {
            throw new Error('Ollama is not running');
        }

        this.emit('model:pulling', { name: modelName });

        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: false }),
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }

            this.emit('model:pulled', { name: modelName });
            await this.checkOllamaStatus(); // Refresh cache
            return true;
        } catch (error: any) {
            this.emit('model:error', { name: modelName, error: error.message });
            throw error;
        }
    }

    /**
     * Delete a local model
     */
    async deleteModel(modelName: string): Promise<boolean> {
        if (!this.isOllamaRunning) {
            throw new Error('Ollama is not running');
        }

        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete model: ${response.statusText}`);
            }

            this.emit('model:deleted', { name: modelName });
            await this.checkOllamaStatus(); // Refresh cache
            return true;
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Chat with a local model
     */
    async chat(
        modelName: string,
        messages: Array<{ role: string; content: string }>,
        options: { stream?: boolean; temperature?: number } = {}
    ): Promise<string> {
        if (!this.isOllamaRunning) {
            throw new Error('Ollama is not running');
        }

        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    messages: messages.map(m => ({ role: m.role, content: m.content })),
                    stream: options.stream ?? false,
                    options: {
                        temperature: options.temperature ?? 0.7,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.message?.content || '';
        } catch (error: any) {
            throw new Error(`Chat with ${modelName} failed: ${error.message}`);
        }
    }

    /**
     * Generate embeddings
     */
    async embed(modelName: string, text: string): Promise<number[]> {
        if (!this.isOllamaRunning) {
            throw new Error('Ollama is not running');
        }

        try {
            const response = await fetch(`${this.settings.ollamaUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelName, prompt: text }),
            });

            if (!response.ok) {
                throw new Error(`Embeddings failed: ${response.statusText}`);
            }

            const data = await response.json();
            return data.embedding || [];
        } catch (error: any) {
            throw new Error(`Embeddings failed: ${error.message}`);
        }
    }

    /**
     * Start Ollama (if installed but not running)
     */
    async startOllama(): Promise<boolean> {
        try {
            await execAsync('ollama serve &');
            // Wait for it to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            return (await this.checkOllamaStatus()).running;
        } catch {
            return false;
        }
    }

    /**
     * Check if Ollama is installed
     */
    async isOllamaInstalled(): Promise<boolean> {
        try {
            await execAsync('which ollama');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get recommended models for different tasks
     */
    getRecommendedModels(): Array<{ name: string; description: string; size: string; task: string }> {
        return [
            { name: 'llama3.2:3b', description: 'Fast, lightweight general purpose', size: '2GB', task: 'general' },
            { name: 'llama3.2:latest', description: 'Balanced performance', size: '4GB', task: 'general' },
            { name: 'codellama:7b', description: 'Code generation and analysis', size: '4GB', task: 'coding' },
            { name: 'deepseek-coder:6.7b', description: 'Advanced code completion', size: '4GB', task: 'coding' },
            { name: 'mistral:7b', description: 'Fast instruction following', size: '4GB', task: 'general' },
            { name: 'nomic-embed-text', description: 'Text embeddings', size: '274MB', task: 'embeddings' },
        ];
    }

    /**
     * Check if running
     */
    isRunning(): boolean {
        return this.isOllamaRunning;
    }

    /**
     * Get cached models
     */
    getCachedModels(): LocalModel[] {
        return this.cachedModels;
    }
}

export default LocalModelManager;
