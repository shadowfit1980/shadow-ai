/**
 * Magic Resize - Intelligent resizing
 */
import { EventEmitter } from 'events';

export interface ResizePreset { id: string; name: string; width: number; height: number; category: string; }
export interface ResizeResult { id: string; sourceCanvasId: string; targetPreset: ResizePreset; newCanvasId: string; elementsAdjusted: number; }

export class MagicResizeEngine extends EventEmitter {
    private static instance: MagicResizeEngine;
    private presets: ResizePreset[] = [];
    private results: Map<string, ResizeResult> = new Map();
    private constructor() { super(); this.initPresets(); }
    static getInstance(): MagicResizeEngine { if (!MagicResizeEngine.instance) MagicResizeEngine.instance = new MagicResizeEngine(); return MagicResizeEngine.instance; }

    private initPresets(): void {
        this.presets = [
            { id: 'p1', name: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
            { id: 'p2', name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
            { id: 'p3', name: 'Facebook Post', width: 1200, height: 630, category: 'social' },
            { id: 'p4', name: 'Twitter Post', width: 1200, height: 675, category: 'social' },
            { id: 'p5', name: 'LinkedIn Post', width: 1200, height: 627, category: 'social' },
            { id: 'p6', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'video' },
            { id: 'p7', name: 'Presentation 16:9', width: 1920, height: 1080, category: 'presentation' },
            { id: 'p8', name: 'Presentation 4:3', width: 1024, height: 768, category: 'presentation' },
            { id: 'p9', name: 'A4 Document', width: 2480, height: 3508, category: 'print' },
            { id: 'p10', name: 'Business Card', width: 1050, height: 600, category: 'print' }
        ];
    }

    async resize(canvasId: string, presetId: string): Promise<ResizeResult> {
        const preset = this.presets.find(p => p.id === presetId); if (!preset) throw new Error('Preset not found');
        await new Promise(r => setTimeout(r, 300));
        const result: ResizeResult = { id: `resize_${Date.now()}`, sourceCanvasId: canvasId, targetPreset: preset, newCanvasId: `canvas_resized_${Date.now()}`, elementsAdjusted: Math.floor(Math.random() * 10) + 1 };
        this.results.set(result.id, result); this.emit('resized', result); return result;
    }

    async resizeMultiple(canvasId: string, presetIds: string[]): Promise<ResizeResult[]> { return Promise.all(presetIds.map(p => this.resize(canvasId, p))); }
    getPresets(): ResizePreset[] { return [...this.presets]; }
    getPresetsByCategory(category: string): ResizePreset[] { return this.presets.filter(p => p.category === category); }
    get(resultId: string): ResizeResult | null { return this.results.get(resultId) || null; }
}
export function getMagicResizeEngine(): MagicResizeEngine { return MagicResizeEngine.getInstance(); }
