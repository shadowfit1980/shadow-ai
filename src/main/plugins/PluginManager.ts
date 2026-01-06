/**
 * Plugin System for Shadow AI
 * Allows third-party extensions to add functionality
 */

export interface Plugin {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    icon?: string;

    // Lifecycle hooks
    onLoad?: () => void | Promise<void>;
    onUnload?: () => void | Promise<void>;

    // Extension points
    commands?: PluginCommand[];
    agents?: PluginAgent[];
    uiComponents?: PluginUIComponent[];
    modelProviders?: PluginModelProvider[];
}

export interface PluginCommand {
    name: string;
    description: string;
    handler: (params: any) => Promise<any>;
}

export interface PluginAgent {
    type: string;
    name: string;
    systemPrompt: string;
    execute: (task: string, params?: any) => Promise<any>;
}

export interface PluginUIComponent {
    id: string;
    location: 'sidebar' | 'panel' | 'toolbar' | 'modal';
    component: any; // React component
}

export interface PluginModelProvider {
    id: string;
    name: string;
    type: 'cloud' | 'local';
    chat: (messages: any[]) => Promise<string>;
    isAvailable: () => Promise<boolean>;
}

export class PluginManager {
    private static instance: PluginManager;
    private plugins: Map<string, Plugin> = new Map();
    private commands: Map<string, PluginCommand> = new Map();
    private agents: Map<string, PluginAgent> = new Map();
    private uiComponents: Map<string, PluginUIComponent> = new Map();
    private modelProviders: Map<string, PluginModelProvider> = new Map();

    static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    /**
     * Load a plugin
     */
    async loadPlugin(plugin: Plugin): Promise<void> {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin ${plugin.id} is already loaded`);
        }

        // Validate plugin
        if (!plugin.id || !plugin.name || !plugin.version) {
            throw new Error('Invalid plugin: missing required fields');
        }

        // Register commands
        if (plugin.commands) {
            for (const command of plugin.commands) {
                this.commands.set(command.name, command);
            }
        }

        // Register agents
        if (plugin.agents) {
            for (const agent of plugin.agents) {
                this.agents.set(agent.type, agent);
            }
        }

        // Register UI components
        if (plugin.uiComponents) {
            for (const component of plugin.uiComponents) {
                this.uiComponents.set(component.id, component);
            }
        }

        // Register model providers
        if (plugin.modelProviders) {
            for (const provider of plugin.modelProviders) {
                this.modelProviders.set(provider.id, provider);
            }
        }

        // Call onLoad hook
        if (plugin.onLoad) {
            await plugin.onLoad();
        }

        this.plugins.set(plugin.id, plugin);
        console.log(`✅ Loaded plugin: ${plugin.name} v${plugin.version}`);
    }

    /**
     * Unload a plugin
     */
    async unloadPlugin(pluginId: string): Promise<void> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) {
            throw new Error(`Plugin ${pluginId} not found`);
        }

        // Call onUnload hook
        if (plugin.onUnload) {
            await plugin.onUnload();
        }

        // Unregister everything
        if (plugin.commands) {
            for (const command of plugin.commands) {
                this.commands.delete(command.name);
            }
        }

        if (plugin.agents) {
            for (const agent of plugin.agents) {
                this.agents.delete(agent.type);
            }
        }

        if (plugin.uiComponents) {
            for (const component of plugin.uiComponents) {
                this.uiComponents.delete(component.id);
            }
        }

        if (plugin.modelProviders) {
            for (const provider of plugin.modelProviders) {
                this.modelProviders.delete(provider.id);
            }
        }

        this.plugins.delete(pluginId);
        console.log(`❌ Unloaded plugin: ${plugin.name}`);
    }

    /**
     * Execute a plugin command
     */
    async executeCommand(commandName: string, params: any): Promise<any> {
        const command = this.commands.get(commandName);
        if (!command) {
            throw new Error(`Command ${commandName} not found`);
        }

        return await command.handler(params);
    }

    /**
     * Get all loaded plugins
     */
    getPlugins(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get plugin commands
     */
    getCommands(): PluginCommand[] {
        return Array.from(this.commands.values());
    }

    /**
     * Get plugin agents
     */
    getAgents(): PluginAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get UI components by location
     */
    getUIComponents(location?: string): PluginUIComponent[] {
        const components = Array.from(this.uiComponents.values());
        if (location) {
            return components.filter(c => c.location === location);
        }
        return components;
    }

    /**
     * Get model providers
     */
    getModelProviders(): PluginModelProvider[] {
        return Array.from(this.modelProviders.values());
    }
}

// Example plugin
export const examplePlugin: Plugin = {
    id: 'example-plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    author: 'Shadow AI',
    description: 'An example plugin demonstrating the plugin API',
    icon: '🔌',

    onLoad: async () => {
        console.log('Example plugin loaded!');
    },

    onUnload: async () => {
        console.log('Example plugin unloaded!');
    },

    commands: [
        {
            name: '/example',
            description: 'Run an example command',
            handler: async (params) => {
                return {
                    success: true,
                    message: 'Example command executed!',
                    params,
                };
            },
        },
    ],

    agents: [
        {
            type: 'example',
            name: 'Example Agent',
            systemPrompt: 'You are an example agent that demonstrates plugin capabilities.',
            execute: async (task, params) => {
                return {
                    agent: 'example',
                    task,
                    result: 'Example agent executed successfully!',
                };
            },
        },
    ],
};
