/**
 * Hot Reloader - Live code reload
 */
import { EventEmitter } from 'events';

export interface WatchedFile { path: string; lastModified: number; hash: string; }
export interface ReloadEvent { id: string; files: string[]; type: 'full' | 'hmr'; timestamp: number; }

export class HotReloaderEngine extends EventEmitter {
    private static instance: HotReloaderEngine;
    private watched: Map<string, WatchedFile> = new Map();
    private active = false;
    private constructor() { super(); }
    static getInstance(): HotReloaderEngine { if (!HotReloaderEngine.instance) HotReloaderEngine.instance = new HotReloaderEngine(); return HotReloaderEngine.instance; }

    start(patterns: string[]): void { this.active = true; patterns.forEach(p => this.watched.set(p, { path: p, lastModified: Date.now(), hash: Math.random().toString(36) })); this.emit('started', patterns); }
    stop(): void { this.active = false; this.watched.clear(); this.emit('stopped'); }

    async triggerReload(files: string[], type: 'full' | 'hmr' = 'hmr'): Promise<ReloadEvent> {
        const event: ReloadEvent = { id: `reload_${Date.now()}`, files, type, timestamp: Date.now() };
        files.forEach(f => { const w = this.watched.get(f); if (w) { w.lastModified = Date.now(); w.hash = Math.random().toString(36); } });
        this.emit('reload', event); return event;
    }

    isActive(): boolean { return this.active; }
    getWatched(): string[] { return Array.from(this.watched.keys()); }
    setHMREnabled(enabled: boolean): void { this.emit('hmrConfig', { enabled }); }
}
export function getHotReloaderEngine(): HotReloaderEngine { return HotReloaderEngine.getInstance(); }
