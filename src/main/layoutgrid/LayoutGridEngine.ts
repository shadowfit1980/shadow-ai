/**
 * Layout Grid - Responsive grid system
 */
import { EventEmitter } from 'events';

export interface GridConfig { columns: number; gap: string; minWidth?: string; maxWidth?: string; }
export interface LayoutTemplate { id: string; name: string; areas: string[][]; responsive: Record<string, GridConfig>; }

export class LayoutGridEngine extends EventEmitter {
    private static instance: LayoutGridEngine;
    private templates: Map<string, LayoutTemplate> = new Map();
    private breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' };
    private constructor() { super(); this.initTemplates(); }
    static getInstance(): LayoutGridEngine { if (!LayoutGridEngine.instance) LayoutGridEngine.instance = new LayoutGridEngine(); return LayoutGridEngine.instance; }

    private initTemplates(): void {
        const templates: LayoutTemplate[] = [
            { id: 't1', name: 'sidebar', areas: [['sidebar', 'content']], responsive: { default: { columns: 1, gap: '1rem' }, lg: { columns: 2, gap: '2rem' } } },
            { id: 't2', name: 'dashboard', areas: [['header', 'header'], ['sidebar', 'main'], ['footer', 'footer']], responsive: { default: { columns: 1, gap: '1rem' }, md: { columns: 2, gap: '1.5rem' } } },
            { id: 't3', name: 'card-grid', areas: [], responsive: { default: { columns: 1, gap: '1rem' }, sm: { columns: 2, gap: '1rem' }, lg: { columns: 3, gap: '1.5rem' }, xl: { columns: 4, gap: '2rem' } } }
        ];
        templates.forEach(t => this.templates.set(t.id, t));
    }

    get(templateId: string): LayoutTemplate | null { return this.templates.get(templateId) || null; }
    create(name: string, areas: string[][], responsive: Record<string, GridConfig>): LayoutTemplate { const t: LayoutTemplate = { id: `layout_${Date.now()}`, name, areas, responsive }; this.templates.set(t.id, t); return t; }
    toCSS(templateId: string): string { const t = this.templates.get(templateId); if (!t) return ''; return Object.entries(t.responsive).map(([bp, cfg]) => bp === 'default' ? `.grid { display: grid; grid-template-columns: repeat(${cfg.columns}, 1fr); gap: ${cfg.gap}; }` : `@media (min-width: ${this.breakpoints[bp as keyof typeof this.breakpoints] || bp}) { .grid { grid-template-columns: repeat(${cfg.columns}, 1fr); gap: ${cfg.gap}; } }`).join('\n'); }
    getAll(): LayoutTemplate[] { return Array.from(this.templates.values()); }
}
export function getLayoutGridEngine(): LayoutGridEngine { return LayoutGridEngine.getInstance(); }
