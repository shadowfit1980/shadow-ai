/**
 * Extension Manager - Plugin extensions
 */
import { EventEmitter } from 'events';

export interface Extension { id: string; name: string; version: string; author: string; description: string; enabled: boolean; entrypoint: string; dependencies: string[]; }

export class ExtensionManager extends EventEmitter {
    private static instance: ExtensionManager;
    private extensions: Map<string, Extension> = new Map();
    private constructor() { super(); }
    static getInstance(): ExtensionManager { if (!ExtensionManager.instance) ExtensionManager.instance = new ExtensionManager(); return ExtensionManager.instance; }

    install(ext: Omit<Extension, 'enabled'>): Extension {
        const extension: Extension = { ...ext, enabled: true };
        this.extensions.set(extension.id, extension);
        this.emit('installed', extension);
        return extension;
    }

    uninstall(id: string): boolean { const ext = this.extensions.get(id); if (!ext) return false; this.extensions.delete(id); this.emit('uninstalled', ext); return true; }
    enable(id: string): boolean { const ext = this.extensions.get(id); if (!ext) return false; ext.enabled = true; this.emit('enabled', ext); return true; }
    disable(id: string): boolean { const ext = this.extensions.get(id); if (!ext) return false; ext.enabled = false; this.emit('disabled', ext); return true; }
    getEnabled(): Extension[] { return Array.from(this.extensions.values()).filter(e => e.enabled); }
    getAll(): Extension[] { return Array.from(this.extensions.values()); }
}

export function getExtensionManager(): ExtensionManager { return ExtensionManager.getInstance(); }
