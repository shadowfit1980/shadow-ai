/**
 * Design Canvas - Main design surface
 */
import { EventEmitter } from 'events';

export interface CanvasElement { id: string; type: 'text' | 'image' | 'shape' | 'group'; x: number; y: number; width: number; height: number; rotation: number; props: Record<string, unknown>; zIndex: number; }
export interface Canvas { id: string; name: string; width: number; height: number; elements: CanvasElement[]; backgroundColor: string; }

export class DesignCanvasEngine extends EventEmitter {
    private static instance: DesignCanvasEngine;
    private canvases: Map<string, Canvas> = new Map();
    private activeCanvas: string | null = null;
    private constructor() { super(); }
    static getInstance(): DesignCanvasEngine { if (!DesignCanvasEngine.instance) DesignCanvasEngine.instance = new DesignCanvasEngine(); return DesignCanvasEngine.instance; }

    create(name: string, width: number, height: number): Canvas {
        const canvas: Canvas = { id: `canvas_${Date.now()}`, name, width, height, elements: [], backgroundColor: '#ffffff' };
        this.canvases.set(canvas.id, canvas); this.activeCanvas = canvas.id; this.emit('created', canvas); return canvas;
    }

    addElement(canvasId: string, element: Omit<CanvasElement, 'id' | 'zIndex'>): CanvasElement {
        const canvas = this.canvases.get(canvasId); if (!canvas) throw new Error('Canvas not found');
        const el: CanvasElement = { ...element, id: `el_${Date.now()}`, zIndex: canvas.elements.length };
        canvas.elements.push(el); this.emit('elementAdded', { canvasId, element: el }); return el;
    }

    moveElement(canvasId: string, elementId: string, x: number, y: number): void { const el = this.getElement(canvasId, elementId); if (el) { el.x = x; el.y = y; this.emit('elementMoved', { canvasId, elementId, x, y }); } }
    resizeElement(canvasId: string, elementId: string, width: number, height: number): void { const el = this.getElement(canvasId, elementId); if (el) { el.width = width; el.height = height; } }
    deleteElement(canvasId: string, elementId: string): boolean { const canvas = this.canvases.get(canvasId); if (canvas) { canvas.elements = canvas.elements.filter(e => e.id !== elementId); return true; } return false; }
    getElement(canvasId: string, elementId: string): CanvasElement | null { return this.canvases.get(canvasId)?.elements.find(e => e.id === elementId) || null; }
    get(canvasId: string): Canvas | null { return this.canvases.get(canvasId) || null; }
    getActive(): Canvas | null { return this.activeCanvas ? this.canvases.get(this.activeCanvas) || null : null; }
}
export function getDesignCanvasEngine(): DesignCanvasEngine { return DesignCanvasEngine.getInstance(); }
