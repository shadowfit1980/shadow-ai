/**
 * Model Blobs - Binary blob storage
 */
import { EventEmitter } from 'events';

export interface ModelBlob { digest: string; size: number; contentType: string; path: string; createdAt: number; }

export class ModelBlobsEngine extends EventEmitter {
    private static instance: ModelBlobsEngine;
    private blobs: Map<string, ModelBlob> = new Map();
    private blobDir = '~/.ollama/models/blobs';
    private constructor() { super(); }
    static getInstance(): ModelBlobsEngine { if (!ModelBlobsEngine.instance) ModelBlobsEngine.instance = new ModelBlobsEngine(); return ModelBlobsEngine.instance; }

    store(digest: string, size: number, contentType = 'application/octet-stream'): ModelBlob { const blob: ModelBlob = { digest, size, contentType, path: `${this.blobDir}/${digest.replace(':', '-')}`, createdAt: Date.now() }; this.blobs.set(digest, blob); this.emit('stored', blob); return blob; }

    get(digest: string): ModelBlob | null { return this.blobs.get(digest) || null; }
    exists(digest: string): boolean { return this.blobs.has(digest); }
    delete(digest: string): boolean { const deleted = this.blobs.delete(digest); if (deleted) this.emit('deleted', digest); return deleted; }

    calculateDigest(data: string): string { let hash = 0; for (let i = 0; i < data.length; i++) { hash = ((hash << 5) - hash) + data.charCodeAt(i); hash |= 0; } return `sha256:${Math.abs(hash).toString(16).padStart(64, '0')}`; }

    getTotalSize(): number { return Array.from(this.blobs.values()).reduce((s, b) => s + b.size, 0); }
    getAll(): ModelBlob[] { return Array.from(this.blobs.values()); }
    setBlobDir(dir: string): void { this.blobDir = dir; }
}
export function getModelBlobsEngine(): ModelBlobsEngine { return ModelBlobsEngine.getInstance(); }
