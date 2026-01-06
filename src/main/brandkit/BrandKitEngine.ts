/**
 * Brand Kit - Brand assets management
 */
import { EventEmitter } from 'events';

export interface BrandColors { primary: string; secondary: string; accent: string; background: string; text: string; }
export interface BrandKit { id: string; name: string; logo?: string; colors: BrandColors; fonts: { heading: string; body: string }; assets: string[]; }

export class BrandKitEngine extends EventEmitter {
    private static instance: BrandKitEngine;
    private kits: Map<string, BrandKit> = new Map();
    private activeKit: string | null = null;
    private constructor() { super(); }
    static getInstance(): BrandKitEngine { if (!BrandKitEngine.instance) BrandKitEngine.instance = new BrandKitEngine(); return BrandKitEngine.instance; }

    create(name: string, colors?: Partial<BrandColors>): BrandKit {
        const defaultColors: BrandColors = { primary: '#3b82f6', secondary: '#6366f1', accent: '#22d3ee', background: '#ffffff', text: '#0f172a' };
        const kit: BrandKit = { id: `brand_${Date.now()}`, name, colors: { ...defaultColors, ...colors }, fonts: { heading: 'Inter', body: 'Inter' }, assets: [] };
        this.kits.set(kit.id, kit); if (!this.activeKit) this.activeKit = kit.id; this.emit('created', kit); return kit;
    }

    setColors(kitId: string, colors: Partial<BrandColors>): void { const kit = this.kits.get(kitId); if (kit) Object.assign(kit.colors, colors); }
    setFonts(kitId: string, fonts: { heading?: string; body?: string }): void { const kit = this.kits.get(kitId); if (kit) Object.assign(kit.fonts, fonts); }
    setLogo(kitId: string, logoUrl: string): void { const kit = this.kits.get(kitId); if (kit) kit.logo = logoUrl; }
    addAsset(kitId: string, assetUrl: string): void { const kit = this.kits.get(kitId); if (kit) kit.assets.push(assetUrl); }
    setActive(kitId: string): void { if (this.kits.has(kitId)) { this.activeKit = kitId; this.emit('activated', kitId); } }
    getActive(): BrandKit | null { return this.activeKit ? this.kits.get(this.activeKit) || null : null; }
    get(kitId: string): BrandKit | null { return this.kits.get(kitId) || null; }
    getAll(): BrandKit[] { return Array.from(this.kits.values()); }
}
export function getBrandKitEngine(): BrandKitEngine { return BrandKitEngine.getInstance(); }
