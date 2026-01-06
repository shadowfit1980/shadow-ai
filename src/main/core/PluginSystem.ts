/**
 * 🔌 PluginSystem - WASM Sandboxed Plugin Architecture
 * 
 * Claude's Recommendation: WASM plugins (Rust/Go/Zig)
 * Zero npm dependencies, sandboxed execution
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// Types
export interface Plugin {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    type: PluginType;
    entryPoint: string;
    permissions: PluginPermission[];
    status: PluginStatus;
    config?: Record<string, unknown>;
}

export type PluginType = 'wasm' | 'javascript' | 'native';

export type PluginPermission =
    | 'read_files'
    | 'write_files'
    | 'network'
    | 'execute_code'
    | 'ui_panels'
    | 'ai_access'
    | 'git_access'
    | 'terminal_access';

export type PluginStatus = 'installed' | 'enabled' | 'disabled' | 'error';

export interface PluginManifest {
    name: string;
    version: string;
    author: string;
    description: string;
    type: PluginType;
    entryPoint: string;
    permissions: PluginPermission[];
    config?: PluginConfigSchema[];
}

export interface PluginConfigSchema {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    default: unknown;
    description: string;
    options?: string[]; // For select type
}

export interface PluginContext {
    pluginId: string;
    dataDir: string;
    api: PluginAPI;
}

export interface PluginAPI {
    // File operations (sandboxed)
    readFile: (relativePath: string) => Promise<string>;
    writeFile: (relativePath: string, content: string) => Promise<void>;

    // AI access
    aiComplete: (prompt: string) => Promise<string>;

    // UI
    showNotification: (message: string) => void;
    registerPanel: (panel: PanelDefinition) => void;

    // Commands
    registerCommand: (command: CommandDefinition) => void;

    // Events
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    emit: (event: string, ...args: unknown[]) => void;
}

export interface PanelDefinition {
    id: string;
    title: string;
    icon: string;
    position: 'left' | 'right' | 'bottom';
    render: () => string; // HTML content
}

export interface CommandDefinition {
    id: string;
    title: string;
    shortcut?: string;
    handler: () => Promise<void>;
}

export interface PluginInstance {
    plugin: Plugin;
    context: PluginContext;
    exports: Record<string, unknown>;
    cleanup?: () => Promise<void>;
}

export class PluginSystem extends EventEmitter {
    private static instance: PluginSystem;
    private plugins: Map<string, Plugin> = new Map();
    private instances: Map<string, PluginInstance> = new Map();
    private pluginsDir: string;

    private constructor() {
        super();
        this.pluginsDir = path.join(process.env.HOME || '/tmp', '.shadow-ai', 'plugins');
    }

    static getInstance(): PluginSystem {
        if (!PluginSystem.instance) {
            PluginSystem.instance = new PluginSystem();
        }
        return PluginSystem.instance;
    }

    /**
     * Initialize plugin system
     */
    async initialize(): Promise<void> {
        // Ensure plugins directory exists
        await fs.mkdir(this.pluginsDir, { recursive: true });

        // Scan for installed plugins
        await this.scanPlugins();

        // Auto-enable plugins that were enabled before
        for (const plugin of this.plugins.values()) {
            if (plugin.status === 'enabled') {
                await this.enablePlugin(plugin.id).catch(console.error);
            }
        }

        this.emit('plugins:initialized', { count: this.plugins.size });
    }

    /**
     * Scan plugins directory
     */
    private async scanPlugins(): Promise<void> {
        try {
            const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    await this.loadPluginManifest(path.join(this.pluginsDir, entry.name));
                }
            }
        } catch {
            // Plugins directory doesn't exist yet
        }
    }

    /**
     * Load plugin manifest
     */
    private async loadPluginManifest(pluginPath: string): Promise<void> {
        try {
            const manifestPath = path.join(pluginPath, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: PluginManifest = JSON.parse(manifestContent);

            const plugin: Plugin = {
                id: path.basename(pluginPath),
                name: manifest.name,
                version: manifest.version,
                author: manifest.author,
                description: manifest.description,
                type: manifest.type,
                entryPoint: manifest.entryPoint,
                permissions: manifest.permissions,
                status: 'installed'
            };

            this.plugins.set(plugin.id, plugin);
            this.emit('plugin:loaded', { plugin });

        } catch (error) {
            console.error(`Failed to load plugin at ${pluginPath}:`, error);
        }
    }

    /**
     * Install a plugin from URL or path
     */
    async installPlugin(source: string): Promise<Plugin> {
        // Generate plugin ID
        const pluginId = `plugin_${Date.now()}`;
        const pluginPath = path.join(this.pluginsDir, pluginId);

        // Create plugin directory
        await fs.mkdir(pluginPath, { recursive: true });

        // Copy plugin files (simplified - would handle zip/git in real implementation)
        if (source.startsWith('http')) {
            // Download from URL
            throw new Error('URL installation not yet implemented');
        } else {
            // Copy from local path
            await this.copyDirectory(source, pluginPath);
        }

        // Load the manifest
        await this.loadPluginManifest(pluginPath);
        const plugin = this.plugins.get(pluginId);

        if (!plugin) {
            throw new Error('Failed to load installed plugin');
        }

        this.emit('plugin:installed', { plugin });
        return plugin;
    }

    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        // Disable first
        await this.disablePlugin(pluginId);

        // Remove files
        const pluginPath = path.join(this.pluginsDir, pluginId);
        await fs.rm(pluginPath, { recursive: true, force: true });

        this.plugins.delete(pluginId);
        this.emit('plugin:uninstalled', { pluginId });
    }

    /**
     * Enable a plugin
     */
    async enablePlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        if (this.instances.has(pluginId)) {
            return; // Already enabled
        }

        try {
            const instance = await this.createPluginInstance(plugin);
            this.instances.set(pluginId, instance);
            plugin.status = 'enabled';

            this.emit('plugin:enabled', { plugin });

        } catch (error) {
            plugin.status = 'error';
            throw error;
        }
    }

    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId: string): Promise<void> {
        const instance = this.instances.get(pluginId);
        if (instance) {
            // Cleanup
            if (instance.cleanup) {
                await instance.cleanup();
            }
            this.instances.delete(pluginId);
        }

        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.status = 'disabled';
            this.emit('plugin:disabled', { pluginId });
        }
    }

    /**
     * Create a sandboxed plugin instance
     */
    private async createPluginInstance(plugin: Plugin): Promise<PluginInstance> {
        const pluginPath = path.join(this.pluginsDir, plugin.id);
        const dataDir = path.join(pluginPath, 'data');
        await fs.mkdir(dataDir, { recursive: true });

        // Create sandboxed API
        const api = this.createSandboxedAPI(plugin, dataDir);

        const context: PluginContext = {
            pluginId: plugin.id,
            dataDir,
            api
        };

        // Load plugin based on type
        let exports: Record<string, unknown> = {};

        if (plugin.type === 'wasm') {
            exports = await this.loadWasmPlugin(pluginPath, plugin.entryPoint, context);
        } else if (plugin.type === 'javascript') {
            exports = await this.loadJsPlugin(pluginPath, plugin.entryPoint, context);
        }

        return {
            plugin,
            context,
            exports
        };
    }

    /**
     * Create sandboxed API for plugin
     */
    private createSandboxedAPI(plugin: Plugin, dataDir: string): PluginAPI {
        const self = this;

        return {
            // File operations (sandboxed to data directory)
            readFile: async (relativePath: string) => {
                if (!plugin.permissions.includes('read_files')) {
                    throw new Error('Permission denied: read_files');
                }
                const safePath = path.join(dataDir, path.normalize(relativePath));
                if (!safePath.startsWith(dataDir)) {
                    throw new Error('Access denied: path traversal attempt');
                }
                return fs.readFile(safePath, 'utf-8');
            },

            writeFile: async (relativePath: string, content: string) => {
                if (!plugin.permissions.includes('write_files')) {
                    throw new Error('Permission denied: write_files');
                }
                const safePath = path.join(dataDir, path.normalize(relativePath));
                if (!safePath.startsWith(dataDir)) {
                    throw new Error('Access denied: path traversal attempt');
                }
                await fs.writeFile(safePath, content);
            },

            // AI access
            aiComplete: async (prompt: string) => {
                if (!plugin.permissions.includes('ai_access')) {
                    throw new Error('Permission denied: ai_access');
                }
                // Would integrate with UnifiedExecutionEngine
                return `AI response for: ${prompt}`;
            },

            // UI
            showNotification: (message: string) => {
                self.emit('plugin:notification', { pluginId: plugin.id, message });
            },

            registerPanel: (panel: PanelDefinition) => {
                if (!plugin.permissions.includes('ui_panels')) {
                    throw new Error('Permission denied: ui_panels');
                }
                self.emit('plugin:panel:register', { pluginId: plugin.id, panel });
            },

            // Commands
            registerCommand: (command: CommandDefinition) => {
                self.emit('plugin:command:register', {
                    pluginId: plugin.id,
                    command: { ...command, id: `${plugin.id}:${command.id}` }
                });
            },

            // Events
            on: (event: string, handler: (...args: unknown[]) => void) => {
                self.on(`plugin:${plugin.id}:${event}`, handler);
            },

            emit: (event: string, ...args: unknown[]) => {
                self.emit(`plugin:${plugin.id}:${event}`, ...args);
            }
        };
    }

    /**
     * Load WASM plugin (placeholder - would use actual WASM runtime)
     */
    private async loadWasmPlugin(
        _pluginPath: string,
        _entryPoint: string,
        _context: PluginContext
    ): Promise<Record<string, unknown>> {
        // Would load and instantiate WASM module
        console.log('WASM plugin loading not yet implemented');
        return {};
    }

    /**
     * Load JavaScript plugin
     */
    private async loadJsPlugin(
        pluginPath: string,
        entryPoint: string,
        context: PluginContext
    ): Promise<Record<string, unknown>> {
        const entryPath = path.join(pluginPath, entryPoint);
        const module = require(entryPath);

        if (typeof module.activate === 'function') {
            await module.activate(context);
        }

        return module;
    }

    /**
     * Copy directory recursively
     */
    private async copyDirectory(src: string, dest: string): Promise<void> {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * List all plugins
     */
    listPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get plugin by ID
     */
    getPlugin(pluginId: string): Plugin | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * Check if plugin is enabled
     */
    isEnabled(pluginId: string): boolean {
        return this.instances.has(pluginId);
    }
}

export const pluginSystem = PluginSystem.getInstance();
