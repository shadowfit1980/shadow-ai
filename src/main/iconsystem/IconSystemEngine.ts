/**
 * Icon System - Icon management
 */
import { EventEmitter } from 'events';

export interface Icon { id: string; name: string; svg: string; category: string; tags: string[]; }
export interface IconSet { id: string; name: string; icons: Icon[]; prefix: string; }

export class IconSystemEngine extends EventEmitter {
    private static instance: IconSystemEngine;
    private icons: Map<string, Icon> = new Map();
    private sets: Map<string, IconSet> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): IconSystemEngine { if (!IconSystemEngine.instance) IconSystemEngine.instance = new IconSystemEngine(); return IconSystemEngine.instance; }

    private initDefaults(): void {
        const defaultIcons: Icon[] = [
            { id: 'i1', name: 'arrow-right', svg: '<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>', category: 'arrows', tags: ['direction', 'navigation'] },
            { id: 'i2', name: 'check', svg: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>', category: 'actions', tags: ['success', 'confirm'] },
            { id: 'i3', name: 'x', svg: '<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>', category: 'actions', tags: ['close', 'cancel'] },
            { id: 'i4', name: 'menu', svg: '<svg viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>', category: 'navigation', tags: ['hamburger', 'menu'] }
        ];
        defaultIcons.forEach(i => this.icons.set(i.name, i));
        this.sets.set('default', { id: 'set1', name: 'Default', icons: defaultIcons, prefix: 'icon' });
    }

    get(name: string): Icon | null { return this.icons.get(name) || null; }
    getByCategory(category: string): Icon[] { return Array.from(this.icons.values()).filter(i => i.category === category); }
    search(query: string): Icon[] { const q = query.toLowerCase(); return Array.from(this.icons.values()).filter(i => i.name.includes(q) || i.tags.some(t => t.includes(q))); }
    add(icon: Icon): void { this.icons.set(icon.name, icon); }
    toReact(name: string): string { const i = this.icons.get(name); if (!i) return ''; return `export const ${name.replace(/-/g, '')}Icon = () => (${i.svg.replace('<svg', '<svg className="w-6 h-6"')});`; }
    getAll(): Icon[] { return Array.from(this.icons.values()); }
}
export function getIconSystemEngine(): IconSystemEngine { return IconSystemEngine.getInstance(); }
