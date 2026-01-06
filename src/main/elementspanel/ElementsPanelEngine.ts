/**
 * Elements Panel - Design elements
 */
import { EventEmitter } from 'events';

export interface DesignElement { id: string; type: 'shape' | 'line' | 'frame' | 'sticker' | 'graphic' | 'chart'; name: string; svg?: string; category: string; premium: boolean; }

export class ElementsPanelEngine extends EventEmitter {
    private static instance: ElementsPanelEngine;
    private elements: Map<string, DesignElement> = new Map();
    private constructor() { super(); this.initElements(); }
    static getInstance(): ElementsPanelEngine { if (!ElementsPanelEngine.instance) ElementsPanelEngine.instance = new ElementsPanelEngine(); return ElementsPanelEngine.instance; }

    private initElements(): void {
        const elements: Omit<DesignElement, 'id'>[] = [
            { type: 'shape', name: 'Rectangle', svg: '<rect width="100" height="100" fill="currentColor"/>', category: 'basic', premium: false },
            { type: 'shape', name: 'Circle', svg: '<circle cx="50" cy="50" r="50" fill="currentColor"/>', category: 'basic', premium: false },
            { type: 'shape', name: 'Triangle', svg: '<polygon points="50,0 100,100 0,100" fill="currentColor"/>', category: 'basic', premium: false },
            { type: 'line', name: 'Line', svg: '<line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" stroke-width="2"/>', category: 'basic', premium: false },
            { type: 'frame', name: 'Photo Frame', category: 'frames', premium: false },
            { type: 'sticker', name: 'Star Sticker', category: 'stickers', premium: false },
            { type: 'chart', name: 'Bar Chart', category: 'charts', premium: false }
        ];
        elements.forEach(e => { const el = { ...e, id: `elem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }; this.elements.set(el.id, el); });
    }

    search(query: string): DesignElement[] { const q = query.toLowerCase(); return Array.from(this.elements.values()).filter(e => e.name.toLowerCase().includes(q)); }
    getByType(type: DesignElement['type']): DesignElement[] { return Array.from(this.elements.values()).filter(e => e.type === type); }
    getByCategory(category: string): DesignElement[] { return Array.from(this.elements.values()).filter(e => e.category === category); }
    get(elementId: string): DesignElement | null { return this.elements.get(elementId) || null; }
    getAll(): DesignElement[] { return Array.from(this.elements.values()); }
}
export function getElementsPanelEngine(): ElementsPanelEngine { return ElementsPanelEngine.getInstance(); }
