/**
 * 🎨 Asset Pipeline
 * 
 * Game asset management:
 * - Placeholder generation
 * - Asset manifest
 * - Sprite sheet handling
 * - Audio management
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface AssetManifest {
    images: { id: string; path: string; width: number; height: number }[];
    audio: { id: string; path: string; type: 'sfx' | 'music' }[];
    fonts: { id: string; path: string }[];
    data: { id: string; path: string }[];
}

export class AssetPipeline extends EventEmitter {
    private static instance: AssetPipeline;

    private constructor() { super(); }

    static getInstance(): AssetPipeline {
        if (!AssetPipeline.instance) {
            AssetPipeline.instance = new AssetPipeline();
        }
        return AssetPipeline.instance;
    }

    createManifest(projectPath: string): AssetManifest {
        const assetsPath = path.join(projectPath, 'src', 'assets');
        const manifest: AssetManifest = {
            images: [],
            audio: [],
            fonts: [],
            data: []
        };

        // Scan directories
        const dirs = {
            images: path.join(assetsPath, 'images'),
            sounds: path.join(assetsPath, 'sounds'),
            fonts: path.join(assetsPath, 'fonts')
        };

        for (const [type, dir] of Object.entries(dirs)) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const id = path.basename(file, path.extname(file));
                    const relativePath = `assets/${type}/${file}`;

                    if (type === 'images') {
                        manifest.images.push({ id, path: relativePath, width: 32, height: 32 });
                    } else if (type === 'sounds') {
                        manifest.audio.push({ id, path: relativePath, type: 'sfx' });
                    } else if (type === 'fonts') {
                        manifest.fonts.push({ id, path: relativePath });
                    }
                });
            }
        }

        // Write manifest
        const manifestPath = path.join(assetsPath, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        return manifest;
    }

    generatePlaceholderSprites(projectPath: string, sprites: { name: string; width: number; height: number; color: string }[]) {
        const imagesPath = path.join(projectPath, 'src', 'assets', 'images');

        if (!fs.existsSync(imagesPath)) {
            fs.mkdirSync(imagesPath, { recursive: true });
        }

        // Generate SVG placeholders
        sprites.forEach(sprite => {
            const svg = `
<svg width="${sprite.width}" height="${sprite.height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${sprite.color}"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="10">${sprite.name}</text>
</svg>
            `.trim();

            fs.writeFileSync(path.join(imagesPath, `${sprite.name}.svg`), svg);
        });

        this.emit('placeholdersGenerated', { count: sprites.length });
    }

    generateAssetLoaderCode(): string {
        return `
// Asset Loader
class AssetLoader {
    constructor() {
        this.images = new Map();
        this.audio = new Map();
        this.loaded = 0;
        this.total = 0;
    }

    async loadManifest(url) {
        const response = await fetch(url);
        const manifest = await response.json();
        
        this.total = manifest.images.length + manifest.audio.length;
        
        await Promise.all([
            ...manifest.images.map(img => this.loadImage(img.id, img.path)),
            ...manifest.audio.map(snd => this.loadAudio(snd.id, snd.path))
        ]);
        
        return manifest;
    }

    async loadImage(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(id, img);
                this.loaded++;
                this.onProgress?.(this.loaded / this.total);
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    async loadAudio(id, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.audio.set(id, audio);
                this.loaded++;
                this.onProgress?.(this.loaded / this.total);
                resolve(audio);
            };
            audio.onerror = reject;
            audio.src = src;
        });
    }

    getImage(id) { return this.images.get(id); }
    getAudio(id) { return this.audio.get(id); }
    
    get progress() { return this.total ? this.loaded / this.total : 0; }
}

// Sprite sheet helper
class SpriteSheet {
    constructor(image, frameWidth, frameHeight) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.cols = Math.floor(image.width / frameWidth);
    }

    getFrame(index) {
        const x = (index % this.cols) * this.frameWidth;
        const y = Math.floor(index / this.cols) * this.frameHeight;
        return { x, y, width: this.frameWidth, height: this.frameHeight };
    }

    draw(ctx, index, x, y, scale = 1) {
        const frame = this.getFrame(index);
        ctx.drawImage(
            this.image,
            frame.x, frame.y, frame.width, frame.height,
            x, y, frame.width * scale, frame.height * scale
        );
    }
}

export const assets = new AssetLoader();
`;
    }
}

export const assetPipeline = AssetPipeline.getInstance();
