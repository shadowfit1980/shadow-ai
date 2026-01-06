/**
 * 🎨 Asset Generator
 * 
 * AI-powered game asset generation:
 * - Placeholder sprites
 * - Procedural textures
 * - Tilemaps
 * - Color palettes
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface GeneratedAsset {
    id: string;
    type: 'sprite' | 'tileset' | 'background' | 'ui' | 'icon';
    format: 'svg' | 'png' | 'dataUrl';
    content: string;
    width: number;
    height: number;
}

export interface SpriteSpec {
    name: string;
    width: number;
    height: number;
    style: 'pixel' | 'simple' | 'detailed';
    type: 'character' | 'enemy' | 'item' | 'platform' | 'projectile';
    colors: string[];
}

export class AssetGenerator extends EventEmitter {
    private static instance: AssetGenerator;
    private palettes: Map<string, string[]> = new Map();

    private constructor() {
        super();
        this.initializePalettes();
    }

    static getInstance(): AssetGenerator {
        if (!AssetGenerator.instance) {
            AssetGenerator.instance = new AssetGenerator();
        }
        return AssetGenerator.instance;
    }

    private initializePalettes(): void {
        this.palettes.set('retro', ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']);
        this.palettes.set('neon', ['#ff00ff', '#00ffff', '#ff0080', '#80ff00']);
        this.palettes.set('fantasy', ['#4a3728', '#8b7355', '#c4a484', '#f5deb3']);
        this.palettes.set('ocean', ['#001f3f', '#0074d9', '#7fdbff', '#39cccc']);
        this.palettes.set('fire', ['#ff4136', '#ff851b', '#ffdc00', '#ffffff']);
        this.palettes.set('forest', ['#2d5a27', '#4a8c3e', '#7bc96f', '#b5e89e']);
        this.palettes.set('dark', ['#1a1a2e', '#16213e', '#0f3460', '#e94560']);
    }

    // ========================================================================
    // SPRITE GENERATION
    // ========================================================================

    generateSprite(spec: SpriteSpec): GeneratedAsset {
        let svg = '';

        switch (spec.type) {
            case 'character':
                svg = this.generateCharacterSVG(spec);
                break;
            case 'enemy':
                svg = this.generateEnemySVG(spec);
                break;
            case 'item':
                svg = this.generateItemSVG(spec);
                break;
            case 'platform':
                svg = this.generatePlatformSVG(spec);
                break;
            case 'projectile':
                svg = this.generateProjectileSVG(spec);
                break;
            default:
                svg = this.generateDefaultSVG(spec);
        }

        return {
            id: `asset_${Date.now()}`,
            type: 'sprite',
            format: 'svg',
            content: svg,
            width: spec.width,
            height: spec.height
        };
    }

    private generateCharacterSVG(spec: SpriteSpec): string {
        const [primary, secondary, accent] = spec.colors.length >= 3
            ? spec.colors
            : ['#4a90d9', '#2c5282', '#ffffff'];
        const w = spec.width;
        const h = spec.height;

        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <!-- Body -->
  <rect x="${w * 0.25}" y="${h * 0.4}" width="${w * 0.5}" height="${h * 0.45}" fill="${primary}" rx="3"/>
  <!-- Head -->
  <circle cx="${w * 0.5}" cy="${h * 0.25}" r="${w * 0.25}" fill="${primary}"/>
  <!-- Eyes -->
  <circle cx="${w * 0.38}" cy="${h * 0.22}" r="${w * 0.06}" fill="${accent}"/>
  <circle cx="${w * 0.62}" cy="${h * 0.22}" r="${w * 0.06}" fill="${accent}"/>
  <!-- Legs -->
  <rect x="${w * 0.28}" y="${h * 0.82}" width="${w * 0.18}" height="${h * 0.18}" fill="${secondary}" rx="2"/>
  <rect x="${w * 0.54}" y="${h * 0.82}" width="${w * 0.18}" height="${h * 0.18}" fill="${secondary}" rx="2"/>
</svg>`;
    }

    private generateEnemySVG(spec: SpriteSpec): string {
        const [primary, secondary] = spec.colors.length >= 2
            ? spec.colors
            : ['#e53e3e', '#742a2a'];
        const w = spec.width;
        const h = spec.height;

        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <!-- Body -->
  <ellipse cx="${w * 0.5}" cy="${h * 0.6}" rx="${w * 0.4}" ry="${h * 0.35}" fill="${primary}"/>
  <!-- Spikes -->
  <polygon points="${w * 0.3},${h * 0.3} ${w * 0.4},${h * 0.1} ${w * 0.5},${h * 0.3}" fill="${secondary}"/>
  <polygon points="${w * 0.5},${h * 0.25} ${w * 0.6},${h * 0.05} ${w * 0.7},${h * 0.25}" fill="${secondary}"/>
  <!-- Eyes -->
  <circle cx="${w * 0.35}" cy="${h * 0.55}" r="${w * 0.1}" fill="white"/>
  <circle cx="${w * 0.65}" cy="${h * 0.55}" r="${w * 0.1}" fill="white"/>
  <circle cx="${w * 0.38}" cy="${h * 0.55}" r="${w * 0.05}" fill="black"/>
  <circle cx="${w * 0.68}" cy="${h * 0.55}" r="${w * 0.05}" fill="black"/>
</svg>`;
    }

    private generateItemSVG(spec: SpriteSpec): string {
        const [primary, glow] = spec.colors.length >= 2
            ? spec.colors
            : ['#ffd700', '#fff3cd'];
        const w = spec.width;
        const h = spec.height;

        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="${glow}"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Glow -->
  <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.45}" fill="url(#glow)"/>
  <!-- Coin/Item -->
  <circle cx="${w * 0.5}" cy="${h * 0.5}" r="${w * 0.3}" fill="${primary}" stroke="${glow}" stroke-width="2"/>
  <text x="${w * 0.5}" y="${h * 0.6}" text-anchor="middle" font-size="${h * 0.3}" fill="black">★</text>
</svg>`;
    }

    private generatePlatformSVG(spec: SpriteSpec): string {
        const [primary, secondary, edge] = spec.colors.length >= 3
            ? spec.colors
            : ['#4a5568', '#2d3748', '#718096'];
        const w = spec.width;
        const h = spec.height;

        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <!-- Main platform -->
  <rect x="0" y="${h * 0.2}" width="${w}" height="${h * 0.8}" fill="${primary}"/>
  <!-- Top edge -->
  <rect x="0" y="0" width="${w}" height="${h * 0.25}" fill="${edge}"/>
  <!-- Texture lines -->
  <line x1="${w * 0.2}" y1="${h * 0.5}" x2="${w * 0.2}" y2="${h}" stroke="${secondary}" stroke-width="2"/>
  <line x1="${w * 0.5}" y1="${h * 0.5}" x2="${w * 0.5}" y2="${h}" stroke="${secondary}" stroke-width="2"/>
  <line x1="${w * 0.8}" y1="${h * 0.5}" x2="${w * 0.8}" y2="${h}" stroke="${secondary}" stroke-width="2"/>
</svg>`;
    }

    private generateProjectileSVG(spec: SpriteSpec): string {
        const [primary, glow] = spec.colors.length >= 2
            ? spec.colors
            : ['#fbbf24', '#fef3c7'];
        const w = spec.width;
        const h = spec.height;

        return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="projectileGlow">
      <stop offset="0%" stop-color="${glow}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </radialGradient>
  </defs>
  <ellipse cx="${w * 0.5}" cy="${h * 0.5}" rx="${w * 0.4}" ry="${h * 0.25}" fill="url(#projectileGlow)"/>
  <ellipse cx="${w * 0.3}" cy="${h * 0.5}" rx="${w * 0.15}" ry="${h * 0.15}" fill="${glow}"/>
</svg>`;
    }

    private generateDefaultSVG(spec: SpriteSpec): string {
        const color = spec.colors[0] || '#888888';
        return `<svg width="${spec.width}" height="${spec.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${color}"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="10">${spec.name}</text>
</svg>`;
    }

    // ========================================================================
    // TILESET GENERATION
    // ========================================================================

    generateTileset(width: number, height: number, tileSize: number, palette: string = 'forest'): GeneratedAsset {
        const colors = this.palettes.get(palette) || ['#888888'];
        const cols = Math.floor(width / tileSize);
        const rows = Math.floor(height / tileSize);

        let rects = '';
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const color = colors[(x + y) % colors.length];
                const variation = Math.random() * 20 - 10;
                rects += `<rect x="${x * tileSize}" y="${y * tileSize}" width="${tileSize}" height="${tileSize}" fill="${color}" opacity="${0.9 + Math.random() * 0.1}"/>`;
            }
        }

        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;

        return {
            id: `tileset_${Date.now()}`,
            type: 'tileset',
            format: 'svg',
            content: svg,
            width,
            height
        };
    }

    // ========================================================================
    // SAVE ASSETS
    // ========================================================================

    saveAsset(asset: GeneratedAsset, outputPath: string): string {
        const filename = `${asset.id}.${asset.format}`;
        const filePath = path.join(outputPath, filename);
        fs.writeFileSync(filePath, asset.content);
        this.emit('assetSaved', { path: filePath, asset });
        return filePath;
    }

    // ========================================================================
    // PALETTE UTILS
    // ========================================================================

    getPalettes(): string[] {
        return Array.from(this.palettes.keys());
    }

    getPalette(name: string): string[] {
        return this.palettes.get(name) || [];
    }

    generateRandomPalette(count: number = 4): string[] {
        const hue = Math.random() * 360;
        return Array.from({ length: count }, (_, i) => {
            const h = (hue + i * (360 / count)) % 360;
            const s = 60 + Math.random() * 30;
            const l = 30 + i * (50 / count);
            return `hsl(${h}, ${s}%, ${l}%)`;
        });
    }
}

export const assetGenerator = AssetGenerator.getInstance();
