/**
 * Icon Manager - Icon library
 */
import { EventEmitter } from 'events';

export interface Icon { id: string; name: string; svg: string; tags: string[]; }

export class IconManager extends EventEmitter {
    private static instance: IconManager;
    private icons: Map<string, Icon> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): IconManager { if (!IconManager.instance) IconManager.instance = new IconManager(); return IconManager.instance; }
    private initDefaults(): void { this.register({ id: 'file', name: 'File', svg: '<svg>...</svg>', tags: ['document'] }); this.register({ id: 'folder', name: 'Folder', svg: '<svg>...</svg>', tags: ['directory'] }); }
    register(icon: Icon): void { this.icons.set(icon.id, icon); }
    get(id: string): Icon | null { return this.icons.get(id) || null; }
    search(query: string): Icon[] { return Array.from(this.icons.values()).filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.tags.some(t => t.includes(query))); }
    getAll(): Icon[] { return Array.from(this.icons.values()); }
}
export function getIconManager(): IconManager { return IconManager.getInstance(); }
