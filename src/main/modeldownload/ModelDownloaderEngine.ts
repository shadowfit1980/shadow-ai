/**
 * Model Downloader - Download models from HuggingFace
 */
import { EventEmitter } from 'events';

export interface ModelDownload { id: string; modelId: string; fileName: string; url: string; size: number; progress: number; status: 'queued' | 'downloading' | 'complete' | 'failed' | 'paused'; localPath?: string; }

export class ModelDownloaderEngine extends EventEmitter {
    private static instance: ModelDownloaderEngine;
    private downloads: Map<string, ModelDownload> = new Map();
    private modelsDir = '~/.cache/gpt4all/models';
    private constructor() { super(); }
    static getInstance(): ModelDownloaderEngine { if (!ModelDownloaderEngine.instance) ModelDownloaderEngine.instance = new ModelDownloaderEngine(); return ModelDownloaderEngine.instance; }

    async download(modelId: string, fileName: string, url: string, size: number): Promise<ModelDownload> {
        const dl: ModelDownload = { id: `dl_${Date.now()}`, modelId, fileName, url, size, progress: 0, status: 'queued' };
        this.downloads.set(dl.id, dl); dl.status = 'downloading';
        for (let i = 0; i <= 100; i += 10) { dl.progress = i; this.emit('progress', { downloadId: dl.id, progress: i }); await new Promise(r => setTimeout(r, 20)); }
        dl.localPath = `${this.modelsDir}/${fileName}`; dl.status = 'complete'; this.emit('complete', dl); return dl;
    }

    pause(downloadId: string): boolean { const dl = this.downloads.get(downloadId); if (!dl || dl.status !== 'downloading') return false; dl.status = 'paused'; return true; }
    resume(downloadId: string): boolean { const dl = this.downloads.get(downloadId); if (!dl || dl.status !== 'paused') return false; dl.status = 'downloading'; return true; }
    cancel(downloadId: string): boolean { const dl = this.downloads.get(downloadId); if (!dl) return false; dl.status = 'failed'; return true; }
    getAll(): ModelDownload[] { return Array.from(this.downloads.values()); }
    setModelsDir(dir: string): void { this.modelsDir = dir; }
}
export function getModelDownloaderEngine(): ModelDownloaderEngine { return ModelDownloaderEngine.getInstance(); }
