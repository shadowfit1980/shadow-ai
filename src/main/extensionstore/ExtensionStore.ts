/**
 * Extension Store - Open extension marketplace
 */
import { EventEmitter } from 'events';

export interface Extension { id: string; name: string; publisher: string; version: string; description: string; downloads: number; rating: number; installed: boolean; }

export class ExtensionStore extends EventEmitter {
    private static instance: ExtensionStore;
    private extensions: Map<string, Extension> = new Map();
    private constructor() { super(); this.initDefaults(); }
    static getInstance(): ExtensionStore { if (!ExtensionStore.instance) ExtensionStore.instance = new ExtensionStore(); return ExtensionStore.instance; }

    private initDefaults(): void {
        const exts: Extension[] = [
            { id: 'prettier', name: 'Prettier', publisher: 'esbenp', version: '9.0.0', description: 'Code formatter', downloads: 1000000, rating: 4.8, installed: false },
            { id: 'eslint', name: 'ESLint', publisher: 'dbaeumer', version: '2.4.0', description: 'Linter', downloads: 900000, rating: 4.7, installed: false },
            { id: 'gitlens', name: 'GitLens', publisher: 'eamodio', version: '14.0.0', description: 'Git supercharged', downloads: 800000, rating: 4.9, installed: false }
        ];
        exts.forEach(e => this.extensions.set(e.id, e));
    }

    search(query: string): Extension[] { const q = query.toLowerCase(); return Array.from(this.extensions.values()).filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)); }
    install(id: string): boolean { const e = this.extensions.get(id); if (!e) return false; e.installed = true; this.emit('installed', e); return true; }
    uninstall(id: string): boolean { const e = this.extensions.get(id); if (!e) return false; e.installed = false; this.emit('uninstalled', e); return true; }
    getInstalled(): Extension[] { return Array.from(this.extensions.values()).filter(e => e.installed); }
    getPopular(): Extension[] { return Array.from(this.extensions.values()).sort((a, b) => b.downloads - a.downloads).slice(0, 10); }
}
export function getExtensionStore(): ExtensionStore { return ExtensionStore.getInstance(); }
