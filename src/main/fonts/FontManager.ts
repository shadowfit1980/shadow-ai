/**
 * Font Manager - Font management
 */
import { EventEmitter } from 'events';

export interface Font { id: string; name: string; family: string; weights: number[]; }

export class FontManager extends EventEmitter {
    private static instance: FontManager;
    private fonts: Map<string, Font> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): FontManager { if (!FontManager.instance) FontManager.instance = new FontManager(); return FontManager.instance; }
    private initDefaults(): void { this.register({ id: 'inter', name: 'Inter', family: 'Inter, sans-serif', weights: [400, 500, 600, 700] }); this.register({ id: 'mono', name: 'JetBrains Mono', family: 'JetBrains Mono, monospace', weights: [400, 500, 700] }); }
    register(font: Font): void { this.fonts.set(font.id, font); }
    get(id: string): Font | null { return this.fonts.get(id) || null; }
    getAll(): Font[] { return Array.from(this.fonts.values()); }
}
export function getFontManager(): FontManager { return FontManager.getInstance(); }
