/**
 * UI Preview - Live preview
 */
import { EventEmitter } from 'events';

export interface Preview { id: string; type: 'web' | 'react' | 'vue' | 'html'; html: string; css?: string; js?: string; port?: number; status: 'building' | 'running' | 'stopped'; }

export class UIPreviewEngine extends EventEmitter {
    private static instance: UIPreviewEngine;
    private previews: Map<string, Preview> = new Map();
    private basePort = 5173;
    private constructor() { super(); }
    static getInstance(): UIPreviewEngine { if (!UIPreviewEngine.instance) UIPreviewEngine.instance = new UIPreviewEngine(); return UIPreviewEngine.instance; }

    create(type: Preview['type'], html: string, css?: string, js?: string): Preview { const preview: Preview = { id: `prev_${Date.now()}`, type, html, css, js, port: this.basePort + this.previews.size, status: 'building' }; this.previews.set(preview.id, preview); return preview; }
    start(previewId: string): boolean { const p = this.previews.get(previewId); if (!p) return false; p.status = 'running'; this.emit('started', p); return true; }
    stop(previewId: string): boolean { const p = this.previews.get(previewId); if (!p) return false; p.status = 'stopped'; return true; }
    update(previewId: string, html: string, css?: string, js?: string): boolean { const p = this.previews.get(previewId); if (!p) return false; p.html = html; if (css) p.css = css; if (js) p.js = js; this.emit('updated', p); return true; }
    get(previewId: string): Preview | null { return this.previews.get(previewId) || null; }
    getRunning(): Preview[] { return Array.from(this.previews.values()).filter(p => p.status === 'running'); }
}
export function getUIPreviewEngine(): UIPreviewEngine { return UIPreviewEngine.getInstance(); }
