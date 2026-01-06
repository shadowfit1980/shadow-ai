/**
 * Preview Renderer - Component preview
 */
import { EventEmitter } from 'events';

export interface Preview { id: string; component: string; props: Record<string, unknown>; html: string; styles: string; }
export interface PreviewConfig { darkMode: boolean; viewport: 'mobile' | 'tablet' | 'desktop'; zoom: number; }

export class PreviewRendererEngine extends EventEmitter {
    private static instance: PreviewRendererEngine;
    private previews: Map<string, Preview> = new Map();
    private config: PreviewConfig = { darkMode: true, viewport: 'desktop', zoom: 1 };
    private constructor() { super(); }
    static getInstance(): PreviewRendererEngine { if (!PreviewRendererEngine.instance) PreviewRendererEngine.instance = new PreviewRendererEngine(); return PreviewRendererEngine.instance; }

    render(component: string, props: Record<string, unknown>): Preview {
        const propsStr = Object.entries(props).map(([k, v]) => `${k}="${v}"`).join(' ');
        const html = `<div class="${component}" ${propsStr}>${props.children || ''}</div>`;
        const styles = `.${component} { display: inline-flex; padding: 0.5rem 1rem; border-radius: 0.375rem; }`;
        const preview: Preview = { id: `preview_${Date.now()}`, component, props, html, styles };
        this.previews.set(preview.id, preview); this.emit('rendered', preview); return preview;
    }

    setConfig(config: Partial<PreviewConfig>): void { Object.assign(this.config, config); this.emit('configChanged', this.config); }
    getConfig(): PreviewConfig { return { ...this.config }; }

    toIframe(previewId: string): string { const p = this.previews.get(previewId); if (!p) return ''; return `<!DOCTYPE html><html class="${this.config.darkMode ? 'dark' : ''}"><head><style>${p.styles}</style></head><body>${p.html}</body></html>`; }
    getViewportSize(): { width: number; height: number } { const sizes = { mobile: { width: 375, height: 667 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } }; return sizes[this.config.viewport]; }
    get(previewId: string): Preview | null { return this.previews.get(previewId) || null; }
}
export function getPreviewRendererEngine(): PreviewRendererEngine { return PreviewRendererEngine.getInstance(); }
