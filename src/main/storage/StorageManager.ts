/**
 * Storage Manager - Key-value storage
 */
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export class StorageManager extends EventEmitter {
    private static instance: StorageManager;
    private data: Map<string, any> = new Map();
    private storagePath = '';
    private constructor() { super(); }
    static getInstance(): StorageManager { if (!StorageManager.instance) StorageManager.instance = new StorageManager(); return StorageManager.instance; }

    setPath(p: string): void { this.storagePath = p; }

    async set(key: string, value: any): Promise<void> { this.data.set(key, value); this.emit('set', { key, value }); if (this.storagePath) await this.persist(); }
    get<T>(key: string): T | null { return this.data.get(key) || null; }
    has(key: string): boolean { return this.data.has(key); }
    delete(key: string): boolean { return this.data.delete(key); }
    keys(): string[] { return Array.from(this.data.keys()); }
    clear(): void { this.data.clear(); }

    private async persist(): Promise<void> { if (!this.storagePath) return; const obj: Record<string, any> = {}; this.data.forEach((v, k) => obj[k] = v); await fs.writeFile(this.storagePath, JSON.stringify(obj, null, 2)); }
    async load(): Promise<void> { if (!this.storagePath) return; try { const content = await fs.readFile(this.storagePath, 'utf-8'); const obj = JSON.parse(content); Object.entries(obj).forEach(([k, v]) => this.data.set(k, v)); } catch { } }
}

export function getStorageManager(): StorageManager { return StorageManager.getInstance(); }
