/**
 * 📸 Screenshot Manager
 * 
 * Capture and share screenshots:
 * - Canvas capture
 * - Download/share
 * - Watermarking
 */

import { EventEmitter } from 'events';

export interface ScreenshotConfig {
    format: 'png' | 'jpg' | 'webp';
    quality: number;
    watermark?: string;
    includeUI?: boolean;
}

export class ScreenshotManager extends EventEmitter {
    private static instance: ScreenshotManager;

    private constructor() { super(); }

    static getInstance(): ScreenshotManager {
        if (!ScreenshotManager.instance) {
            ScreenshotManager.instance = new ScreenshotManager();
        }
        return ScreenshotManager.instance;
    }

    generateScreenshotCode(): string {
        return `
class ScreenshotManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.config = {
            format: 'png',
            quality: 0.92,
            watermark: null,
            includeUI: true
        };
        this.screenshots = [];
    }

    setConfig(config) {
        Object.assign(this.config, config);
    }

    // Capture current frame
    capture() {
        const canvas = this.config.includeUI 
            ? this.canvas 
            : this.getGameCanvas();

        // Create offscreen canvas if watermark needed
        let finalCanvas = canvas;
        if (this.config.watermark) {
            finalCanvas = this.addWatermark(canvas);
        }

        const mimeType = \`image/\${this.config.format}\`;
        const dataUrl = finalCanvas.toDataURL(mimeType, this.config.quality);

        const screenshot = {
            id: 'ss_' + Date.now(),
            dataUrl,
            timestamp: Date.now(),
            width: canvas.width,
            height: canvas.height
        };

        this.screenshots.push(screenshot);
        return screenshot;
    }

    getGameCanvas() {
        // If using multi-layer rendering, get just game layer
        return this.canvas;
    }

    addWatermark(sourceCanvas) {
        const canvas = document.createElement('canvas');
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        const ctx = canvas.getContext('2d');

        // Draw original
        ctx.drawImage(sourceCanvas, 0, 0);

        // Add watermark
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.config.watermark, canvas.width - 10, canvas.height - 10);

        return canvas;
    }

    // Download screenshot
    download(screenshot, filename = null) {
        const name = filename || \`screenshot_\${screenshot.id}.\${this.config.format}\`;
        
        const link = document.createElement('a');
        link.download = name;
        link.href = screenshot.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Quick capture and download
    quickSave(filename) {
        const ss = this.capture();
        this.download(ss, filename);
        return ss;
    }

    // Copy to clipboard (modern browsers)
    async copyToClipboard(screenshot = null) {
        const ss = screenshot || this.capture();
        
        try {
            const blob = await this.dataUrlToBlob(ss.dataUrl);
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            return true;
        } catch (e) {
            console.error('Failed to copy to clipboard:', e);
            return false;
        }
    }

    dataUrlToBlob(dataUrl) {
        return new Promise((resolve) => {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            const u8arr = new Uint8Array(bstr.length);
            for (let i = 0; i < bstr.length; i++) {
                u8arr[i] = bstr.charCodeAt(i);
            }
            resolve(new Blob([u8arr], { type: mime }));
        });
    }

    // Share (Web Share API)
    async share(screenshot = null, title = 'Game Screenshot') {
        const ss = screenshot || this.capture();

        if (!navigator.share) {
            console.warn('Web Share API not supported');
            return false;
        }

        try {
            const blob = await this.dataUrlToBlob(ss.dataUrl);
            const file = new File([blob], \`screenshot.\${this.config.format}\`, { type: blob.type });

            await navigator.share({
                title: title,
                files: [file]
            });
            return true;
        } catch (e) {
            console.error('Share failed:', e);
            return false;
        }
    }

    // Get all screenshots
    getAll() {
        return this.screenshots;
    }

    // Get last screenshot
    getLast() {
        return this.screenshots[this.screenshots.length - 1];
    }

    // Clear history
    clearHistory() {
        this.screenshots = [];
    }

    // Create thumbnail
    createThumbnail(screenshot, maxWidth = 200) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const scale = maxWidth / img.width;
                const canvas = document.createElement('canvas');
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = screenshot.dataUrl;
        });
    }
}`;
    }
}

export const screenshotManager = ScreenshotManager.getInstance();
