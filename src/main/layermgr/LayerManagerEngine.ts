/**
 * Layer Manager - Layer management
 */
import { EventEmitter } from 'events';

export interface Layer { id: string; name: string; visible: boolean; locked: boolean; opacity: number; blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'; elementIds: string[]; }

export class LayerManagerEngine extends EventEmitter {
    private static instance: LayerManagerEngine;
    private layers: Map<string, Layer[]> = new Map(); // canvasId -> layers
    private constructor() { super(); }
    static getInstance(): LayerManagerEngine { if (!LayerManagerEngine.instance) LayerManagerEngine.instance = new LayerManagerEngine(); return LayerManagerEngine.instance; }

    create(canvasId: string, name: string): Layer {
        if (!this.layers.has(canvasId)) this.layers.set(canvasId, []);
        const layer: Layer = { id: `layer_${Date.now()}`, name, visible: true, locked: false, opacity: 100, blendMode: 'normal', elementIds: [] };
        this.layers.get(canvasId)!.push(layer); this.emit('created', { canvasId, layer }); return layer;
    }

    reorder(canvasId: string, layerId: string, newIndex: number): void {
        const layers = this.layers.get(canvasId); if (!layers) return;
        const idx = layers.findIndex(l => l.id === layerId); if (idx === -1) return;
        const [layer] = layers.splice(idx, 1); layers.splice(newIndex, 0, layer);
        this.emit('reordered', { canvasId, layerId, newIndex });
    }

    toggle(canvasId: string, layerId: string, prop: 'visible' | 'locked'): void { const layer = this.get(canvasId, layerId); if (layer) { layer[prop] = !layer[prop]; this.emit('toggled', { canvasId, layerId, prop }); } }
    setOpacity(canvasId: string, layerId: string, opacity: number): void { const layer = this.get(canvasId, layerId); if (layer) layer.opacity = Math.max(0, Math.min(100, opacity)); }
    setBlendMode(canvasId: string, layerId: string, mode: Layer['blendMode']): void { const layer = this.get(canvasId, layerId); if (layer) layer.blendMode = mode; }
    addElement(canvasId: string, layerId: string, elementId: string): void { const layer = this.get(canvasId, layerId); if (layer) layer.elementIds.push(elementId); }
    get(canvasId: string, layerId: string): Layer | null { return this.layers.get(canvasId)?.find(l => l.id === layerId) || null; }
    getAll(canvasId: string): Layer[] { return this.layers.get(canvasId) || []; }
}
export function getLayerManagerEngine(): LayerManagerEngine { return LayerManagerEngine.getInstance(); }
