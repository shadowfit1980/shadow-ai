/**
 * Plugin Registry
 * Manage plugins and extensions
 */

import { EventEmitter } from 'events';

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description?: string;
    enabled: boolean;
    initialize?: () => void | Promise<void>;
    destroy?: () => void | Promise<void>;
}

/**
 * PluginRegistry
 * Register and manage plugins
 */
export class PluginRegistry extends EventEmitter {
    private static instance: PluginRegistry;
    private plugins: Map<string, Plugin> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): PluginRegistry {
        if (!PluginRegistry.instance) {
            PluginRegistry.instance = new PluginRegistry();
        }
        return PluginRegistry.instance;
    }

    async register(plugin: Plugin): Promise<void> {
        this.plugins.set(plugin.id, plugin);

        if (plugin.enabled && plugin.initialize) {
            await plugin.initialize();
        }

        this.emit('registered', plugin);
    }

    async unregister(id: string): Promise<boolean> {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        if (plugin.destroy) {
            await plugin.destroy();
        }

        this.plugins.delete(id);
        this.emit('unregistered', plugin);
        return true;
    }

    async enable(id: string): Promise<boolean> {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        plugin.enabled = true;
        if (plugin.initialize) {
            await plugin.initialize();
        }

        this.emit('enabled', plugin);
        return true;
    }

    async disable(id: string): Promise<boolean> {
        const plugin = this.plugins.get(id);
        if (!plugin) return false;

        plugin.enabled = false;
        if (plugin.destroy) {
            await plugin.destroy();
        }

        this.emit('disabled', plugin);
        return true;
    }

    get(id: string): Plugin | null {
        return this.plugins.get(id) || null;
    }

    getAll(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    getEnabled(): Plugin[] {
        return this.getAll().filter(p => p.enabled);
    }
}

export function getPluginRegistry(): PluginRegistry {
    return PluginRegistry.getInstance();
}
