/**
 * Plugin Marketplace
 * 
 * Community-contributed tools, custom model integrations,
 * and framework-specific extensions.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: PluginCategory;
    tags: string[];
    downloads: number;
    rating: number;
    repository?: string;
    homepage?: string;
    dependencies?: string[];
    main: string;
    installed: boolean;
    enabled: boolean;
}

export type PluginCategory =
    | 'language'
    | 'framework'
    | 'theme'
    | 'tool'
    | 'ai-model'
    | 'integration'
    | 'productivity';

export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    main: string;
    engines?: { shadow?: string };
    contributes?: {
        commands?: Array<{ command: string; title: string }>;
        languages?: Array<{ id: string; extensions: string[] }>;
        themes?: Array<{ id: string; label: string; path: string }>;
    };
}

export interface PluginInstance {
    manifest: PluginManifest;
    activate?: () => Promise<void>;
    deactivate?: () => Promise<void>;
    exports?: Record<string, any>;
}

// ============================================================================
// PLUGIN MARKETPLACE
// ============================================================================

export class PluginMarketplace extends EventEmitter {
    private static instance: PluginMarketplace;
    private registry: Plugin[] = [];
    private installed: Map<string, PluginInstance> = new Map();
    private pluginDir: string = '';

    private constructor() {
        super();
        this.initializeRegistry();
    }

    static getInstance(): PluginMarketplace {
        if (!PluginMarketplace.instance) {
            PluginMarketplace.instance = new PluginMarketplace();
        }
        return PluginMarketplace.instance;
    }

    /**
     * Set plugin directory
     */
    setPluginDirectory(dir: string): void {
        this.pluginDir = dir;
    }

    // ========================================================================
    // REGISTRY
    // ========================================================================

    private initializeRegistry(): void {
        // Built-in plugins registry
        this.registry = [
            {
                id: 'shadow-prettier',
                name: 'Prettier',
                version: '3.0.0',
                description: 'Code formatter using Prettier',
                author: 'Shadow AI',
                category: 'tool',
                tags: ['formatter', 'code-style'],
                downloads: 10000,
                rating: 4.8,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-eslint',
                name: 'ESLint',
                version: '9.0.0',
                description: 'JavaScript/TypeScript linter',
                author: 'Shadow AI',
                category: 'tool',
                tags: ['linter', 'javascript', 'typescript'],
                downloads: 15000,
                rating: 4.9,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-react',
                name: 'React Developer Tools',
                version: '1.0.0',
                description: 'Enhanced React development support',
                author: 'Shadow AI',
                category: 'framework',
                tags: ['react', 'jsx', 'hooks'],
                downloads: 8000,
                rating: 4.7,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-vue',
                name: 'Vue Developer Tools',
                version: '1.0.0',
                description: 'Enhanced Vue.js development support',
                author: 'Shadow AI',
                category: 'framework',
                tags: ['vue', 'vuex', 'composition-api'],
                downloads: 5000,
                rating: 4.6,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-python',
                name: 'Python Tools',
                version: '1.0.0',
                description: 'Python development support with Pylint',
                author: 'Shadow AI',
                category: 'language',
                tags: ['python', 'pylint', 'formatting'],
                downloads: 12000,
                rating: 4.8,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-docker',
                name: 'Docker Tools',
                version: '1.0.0',
                description: 'Docker container management',
                author: 'Shadow AI',
                category: 'integration',
                tags: ['docker', 'containers', 'devops'],
                downloads: 7000,
                rating: 4.5,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-github',
                name: 'GitHub Integration',
                version: '1.0.0',
                description: 'GitHub integration with PR reviews',
                author: 'Shadow AI',
                category: 'integration',
                tags: ['github', 'git', 'pr'],
                downloads: 9000,
                rating: 4.7,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-ollama',
                name: 'Ollama Models',
                version: '1.0.0',
                description: 'Local AI models via Ollama',
                author: 'Shadow AI',
                category: 'ai-model',
                tags: ['ollama', 'local-ai', 'llm'],
                downloads: 6000,
                rating: 4.6,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
            {
                id: 'shadow-dark-theme',
                name: 'Shadow Dark Pro',
                version: '1.0.0',
                description: 'Premium dark theme for Shadow AI',
                author: 'Shadow AI',
                category: 'theme',
                tags: ['theme', 'dark', 'ui'],
                downloads: 20000,
                rating: 4.9,
                main: 'index.js',
                installed: false,
                enabled: false,
            },
        ];
    }

    // ========================================================================
    // MARKETPLACE OPERATIONS
    // ========================================================================

    /**
     * Search plugins
     */
    search(query: string, options?: {
        category?: PluginCategory;
        sortBy?: 'downloads' | 'rating' | 'name';
    }): Plugin[] {
        let results = this.registry.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        );

        if (options?.category) {
            results = results.filter(p => p.category === options.category);
        }

        if (options?.sortBy) {
            results.sort((a, b) => {
                if (options.sortBy === 'downloads') return b.downloads - a.downloads;
                if (options.sortBy === 'rating') return b.rating - a.rating;
                return a.name.localeCompare(b.name);
            });
        }

        return results;
    }

    /**
     * Get featured plugins
     */
    getFeatured(): Plugin[] {
        return this.registry
            .filter(p => p.rating >= 4.5 && p.downloads >= 5000)
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, 6);
    }

    /**
     * Get plugins by category
     */
    getByCategory(category: PluginCategory): Plugin[] {
        return this.registry.filter(p => p.category === category);
    }

    // ========================================================================
    // PLUGIN MANAGEMENT
    // ========================================================================

    /**
     * Install a plugin
     */
    async installPlugin(pluginId: string): Promise<boolean> {
        const plugin = this.registry.find(p => p.id === pluginId);
        if (!plugin) return false;

        this.emit('plugin:installing', plugin);

        try {
            // Simulate installation
            plugin.installed = true;
            plugin.enabled = true;
            plugin.downloads++;

            // Create plugin instance
            const instance: PluginInstance = {
                manifest: {
                    id: plugin.id,
                    name: plugin.name,
                    version: plugin.version,
                    description: plugin.description,
                    author: plugin.author,
                    main: plugin.main,
                },
            };

            this.installed.set(pluginId, instance);
            this.emit('plugin:installed', plugin);

            return true;
        } catch (error: any) {
            this.emit('plugin:error', { plugin, error: error.message });
            return false;
        }
    }

    /**
     * Uninstall a plugin
     */
    async uninstallPlugin(pluginId: string): Promise<boolean> {
        const plugin = this.registry.find(p => p.id === pluginId);
        if (!plugin) return false;

        this.emit('plugin:uninstalling', plugin);

        try {
            // Deactivate if enabled
            await this.disablePlugin(pluginId);

            plugin.installed = false;
            plugin.enabled = false;
            this.installed.delete(pluginId);

            this.emit('plugin:uninstalled', plugin);
            return true;
        } catch (error: any) {
            this.emit('plugin:error', { plugin, error: error.message });
            return false;
        }
    }

    /**
     * Enable a plugin
     */
    async enablePlugin(pluginId: string): Promise<boolean> {
        const plugin = this.registry.find(p => p.id === pluginId);
        const instance = this.installed.get(pluginId);

        if (!plugin || !instance) return false;

        try {
            if (instance.activate) {
                await instance.activate();
            }
            plugin.enabled = true;
            this.emit('plugin:enabled', plugin);
            return true;
        } catch (error: any) {
            this.emit('plugin:error', { plugin, error: error.message });
            return false;
        }
    }

    /**
     * Disable a plugin
     */
    async disablePlugin(pluginId: string): Promise<boolean> {
        const plugin = this.registry.find(p => p.id === pluginId);
        const instance = this.installed.get(pluginId);

        if (!plugin || !instance) return false;

        try {
            if (instance.deactivate) {
                await instance.deactivate();
            }
            plugin.enabled = false;
            this.emit('plugin:disabled', plugin);
            return true;
        } catch (error: any) {
            this.emit('plugin:error', { plugin, error: error.message });
            return false;
        }
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    /**
     * Get all plugins
     */
    getAllPlugins(): Plugin[] {
        return [...this.registry];
    }

    /**
     * Get installed plugins
     */
    getInstalledPlugins(): Plugin[] {
        return this.registry.filter(p => p.installed);
    }

    /**
     * Get enabled plugins
     */
    getEnabledPlugins(): Plugin[] {
        return this.registry.filter(p => p.enabled);
    }

    /**
     * Get plugin by ID
     */
    getPlugin(id: string): Plugin | undefined {
        return this.registry.find(p => p.id === id);
    }

    /**
     * Get categories
     */
    getCategories(): PluginCategory[] {
        return ['language', 'framework', 'theme', 'tool', 'ai-model', 'integration', 'productivity'];
    }
}

// Export singleton
export const pluginMarketplace = PluginMarketplace.getInstance();
