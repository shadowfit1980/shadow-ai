/**
 * Ollama Server - Local LLM server
 */
import { EventEmitter } from 'events';

export interface OllamaServerConfig { host: string; port: number; origins: string[]; keepAlive: string; numParallel: number; }
export interface ServerStatus { running: boolean; host: string; port: number; models: string[]; gpuAvailable: boolean; version: string; }

export class OllamaServerEngine extends EventEmitter {
    private static instance: OllamaServerEngine;
    private config: OllamaServerConfig = { host: '127.0.0.1', port: 11434, origins: ['*'], keepAlive: '5m', numParallel: 4 };
    private running = false;
    private loadedModels: Set<string> = new Set();
    private constructor() { super(); }
    static getInstance(): OllamaServerEngine { if (!OllamaServerEngine.instance) OllamaServerEngine.instance = new OllamaServerEngine(); return OllamaServerEngine.instance; }

    async start(): Promise<boolean> { if (this.running) return true; this.running = true; this.emit('started', this.getStatus()); return true; }
    async stop(): Promise<boolean> { if (!this.running) return true; this.running = false; this.loadedModels.clear(); this.emit('stopped'); return true; }

    async loadModel(name: string): Promise<boolean> { if (!this.running) return false; this.loadedModels.add(name); this.emit('modelLoaded', name); return true; }
    async unloadModel(name: string): Promise<boolean> { return this.loadedModels.delete(name); }

    getStatus(): ServerStatus { return { running: this.running, host: this.config.host, port: this.config.port, models: Array.from(this.loadedModels), gpuAvailable: true, version: '0.5.0' }; }
    setConfig(cfg: Partial<OllamaServerConfig>): void { Object.assign(this.config, cfg); }
    getConfig(): OllamaServerConfig { return { ...this.config }; }
}
export function getOllamaServerEngine(): OllamaServerEngine { return OllamaServerEngine.getInstance(); }
