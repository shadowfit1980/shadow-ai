/**
 * Plugin System
 * 
 * Extensible plugin architecture for third-party integrations
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    enabled: boolean;
    dependencies?: string[];
    permissions?: PluginPermission[];
    hooks?: PluginHook[];
}

export type PluginPermission =
    | 'file:read'
    | 'file:write'
    | 'network'
    | 'shell'
    | 'ai:chat'
    | 'ui:extend'
    | 'settings:read'
    | 'settings:write';

export interface PluginHook {
    event: string;
    handler: string;
}

export interface PluginInstance {
    plugin: Plugin;
    module: any;
    activated: boolean;
}

export interface PluginManifest {
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    dependencies?: string[];
    permissions?: PluginPermission[];
    hooks?: { event: string; handler: string }[];
}

/**
 * PluginManager - Manages plugin lifecycle
 */
export class PluginManager extends EventEmitter {
    private static instance: PluginManager;
    private plugins: Map<string, PluginInstance> = new Map();
    private pluginsDir: string;

    private constructor() {
        super();
        this.pluginsDir = path.join(process.cwd(), 'plugins');
        this.initializePluginDir();
    }

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    /**
     * Initialize plugins directory
     */
    private async initializePluginDir(): Promise<void> {
        try {
            await fs.mkdir(this.pluginsDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create plugins directory:', error);
        }
    }

    /**
     * Discover and load all plugins
     */
    async discoverPlugins(): Promise<Plugin[]> {
        const discovered: Plugin[] = [];

        try {
            const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const pluginPath = path.join(this.pluginsDir, entry.name);
                    const manifestPath = path.join(pluginPath, 'package.json');

                    try {
                        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
                        const manifest: PluginManifest = JSON.parse(manifestContent);

                        const plugin: Plugin = {
                            id: entry.name,
                            name: manifest.name,
                            version: manifest.version,
                            description: manifest.description,
                            author: manifest.author,
                            main: manifest.main || 'index.js',
                            enabled: false,
                            dependencies: manifest.dependencies ? Object.keys(manifest.dependencies) : [],
                            permissions: manifest.permissions,
                            hooks: manifest.hooks,
                        };

                        discovered.push(plugin);
                    } catch {
                        console.log(`Skipping invalid plugin: ${entry.name}`);
                    }
                }
            }

            console.log(`🔌 [PluginManager] Discovered ${discovered.length} plugins`);
        } catch (error) {
            console.error('Failed to discover plugins:', error);
        }

        return discovered;
    }

    /**
     * Load a plugin
     */
    async loadPlugin(pluginId: string): Promise<boolean> {
        if (this.plugins.has(pluginId)) {
            return true; // Already loaded
        }

        const pluginPath = path.join(this.pluginsDir, pluginId);
        const manifestPath = path.join(pluginPath, 'package.json');

        try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: PluginManifest = JSON.parse(manifestContent);

            const plugin: Plugin = {
                id: pluginId,
                name: manifest.name,
                version: manifest.version,
                description: manifest.description,
                author: manifest.author,
                main: manifest.main || 'index.js',
                enabled: true,
                dependencies: manifest.dependencies ? Object.keys(manifest.dependencies) : [],
                permissions: manifest.permissions,
                hooks: manifest.hooks,
            };

            // Dynamically import the plugin module
            const mainPath = path.join(pluginPath, manifest.main || 'index.js');
            const pluginModule = await import(mainPath);

            const instance: PluginInstance = {
                plugin,
                module: pluginModule,
                activated: false,
            };

            this.plugins.set(pluginId, instance);
            this.emit('plugin:loaded', plugin);

            console.log(`🔌 [PluginManager] Loaded plugin: ${plugin.name}`);
            return true;
        } catch (error) {
            console.error(`Failed to load plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Activate a plugin
     */
    async activatePlugin(pluginId: string): Promise<boolean> {
        const instance = this.plugins.get(pluginId);
        if (!instance) {
            const loaded = await this.loadPlugin(pluginId);
            if (!loaded) return false;
            return this.activatePlugin(pluginId);
        }

        if (instance.activated) return true;

        try {
            // Call activate if available
            if (instance.module.activate) {
                await instance.module.activate(this.createPluginAPI(instance.plugin));
            }

            // Register hooks
            if (instance.plugin.hooks) {
                for (const hook of instance.plugin.hooks) {
                    if (instance.module[hook.handler]) {
                        this.on(hook.event, instance.module[hook.handler].bind(instance.module));
                    }
                }
            }

            instance.activated = true;
            instance.plugin.enabled = true;
            this.emit('plugin:activated', instance.plugin);

            console.log(`🔌 [PluginManager] Activated plugin: ${instance.plugin.name}`);
            return true;
        } catch (error) {
            console.error(`Failed to activate plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Deactivate a plugin
     */
    async deactivatePlugin(pluginId: string): Promise<boolean> {
        const instance = this.plugins.get(pluginId);
        if (!instance || !instance.activated) return true;

        try {
            // Call deactivate if available
            if (instance.module.deactivate) {
                await instance.module.deactivate();
            }

            instance.activated = false;
            instance.plugin.enabled = false;
            this.emit('plugin:deactivated', instance.plugin);

            console.log(`🔌 [PluginManager] Deactivated plugin: ${instance.plugin.name}`);
            return true;
        } catch (error) {
            console.error(`Failed to deactivate plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId: string): Promise<boolean> {
        await this.deactivatePlugin(pluginId);
        this.plugins.delete(pluginId);
        this.emit('plugin:unloaded', pluginId);
        return true;
    }

    /**
     * Create plugin API (sandboxed capabilities)
     */
    private createPluginAPI(plugin: Plugin): PluginAPI {
        const permissions = plugin.permissions || [];

        return {
            // Log capability
            log: (message: string) => {
                console.log(`[${plugin.name}] ${message}`);
            },

            // File operations (if permitted)
            readFile: permissions.includes('file:read')
                ? async (filePath: string) => {
                    return fs.readFile(filePath, 'utf-8');
                }
                : undefined,

            writeFile: permissions.includes('file:write')
                ? async (filePath: string, content: string) => {
                    await fs.writeFile(filePath, content);
                }
                : undefined,

            // Emit events
            emit: (event: string, data: any) => {
                this.emit(`plugin:${plugin.id}:${event}`, data);
            },

            // Subscribe to events
            on: (event: string, handler: (...args: any[]) => void) => {
                this.on(event, handler);
            },

            // Get plugin info
            getPluginInfo: () => ({
                id: plugin.id,
                name: plugin.name,
                version: plugin.version,
            }),
        };
    }

    /**
     * Get all loaded plugins
     */
    getLoadedPlugins(): Plugin[] {
        return Array.from(this.plugins.values()).map(i => i.plugin);
    }

    /**
     * Get active plugins
     */
    getActivePlugins(): Plugin[] {
        return Array.from(this.plugins.values())
            .filter(i => i.activated)
            .map(i => i.plugin);
    }

    /**
     * Check if plugin is loaded
     */
    isLoaded(pluginId: string): boolean {
        return this.plugins.has(pluginId);
    }

    /**
     * Check if plugin is active
     */
    isActive(pluginId: string): boolean {
        const instance = this.plugins.get(pluginId);
        return instance?.activated || false;
    }

    /**
     * Reload a plugin
     */
    async reloadPlugin(pluginId: string): Promise<boolean> {
        await this.unloadPlugin(pluginId);
        return this.activatePlugin(pluginId);
    }
}

export interface PluginAPI {
    log: (message: string) => void;
    readFile?: (filePath: string) => Promise<string>;
    writeFile?: (filePath: string, content: string) => Promise<void>;
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    getPluginInfo: () => { id: string; name: string; version: string };
}

export default PluginManager;
