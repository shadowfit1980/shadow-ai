/**
 * MiniMap - Code minimap visualization
 */
import { EventEmitter } from 'events';

export interface MiniMapConfig { enabled: boolean; side: 'left' | 'right'; showSlider: boolean; maxColumn: number; scale: number; }
export interface MiniMapRegion { startLine: number; endLine: number; type: 'visible' | 'highlighted' | 'selection' | 'search'; }

export class MiniMapManager extends EventEmitter {
    private static instance: MiniMapManager;
    private config: MiniMapConfig = { enabled: true, side: 'right', showSlider: true, maxColumn: 120, scale: 1 };
    private regions: MiniMapRegion[] = [];
    private constructor() { super(); }
    static getInstance(): MiniMapManager { if (!MiniMapManager.instance) MiniMapManager.instance = new MiniMapManager(); return MiniMapManager.instance; }

    setConfig(config: Partial<MiniMapConfig>): void { this.config = { ...this.config, ...config }; this.emit('configChanged', this.config); }
    getConfig(): MiniMapConfig { return { ...this.config }; }
    toggle(): boolean { this.config.enabled = !this.config.enabled; this.emit('toggled', this.config.enabled); return this.config.enabled; }

    setVisibleRegion(startLine: number, endLine: number): void { this.regions = this.regions.filter(r => r.type !== 'visible'); this.regions.push({ startLine, endLine, type: 'visible' }); this.emit('regionChanged', this.regions); }
    highlightRegion(startLine: number, endLine: number, type: MiniMapRegion['type']): void { this.regions.push({ startLine, endLine, type }); }
    clearHighlights(): void { this.regions = this.regions.filter(r => r.type === 'visible'); }
    getRegions(): MiniMapRegion[] { return [...this.regions]; }
}
export function getMiniMapManager(): MiniMapManager { return MiniMapManager.getInstance(); }
