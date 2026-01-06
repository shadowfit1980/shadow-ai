import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Plugin {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    icon?: string;
}

interface PluginMarketplaceProps {
    onClose?: () => void;
}

export default function PluginMarketplace({ onClose }: PluginMarketplaceProps) {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [installedPlugins, setInstalledPlugins] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [installing, setInstalling] = useState<string | null>(null);

    // Mock plugin marketplace data
    const marketplacePlugins: Plugin[] = [
        {
            id: 'github-integration',
            name: 'GitHub Integration',
            version: '1.0.0',
            author: 'Shadow AI Team',
            description: 'Integrate with GitHub for version control, PR reviews, and issue tracking',
            icon: '🐙',
        },
        {
            id: 'figma-sync',
            name: 'Figma Sync',
            version: '1.2.0',
            author: 'Design Team',
            description: 'Sync designs from Figma and generate React components automatically',
            icon: '🎨',
        },
        {
            id: 'database-designer',
            name: 'Database Designer',
            version: '2.0.0',
            author: 'DB Tools',
            description: 'Visual database schema designer with SQL generation',
            icon: '🗄️',
        },
        {
            id: 'api-tester',
            name: 'API Tester',
            version: '1.5.0',
            author: 'Dev Tools',
            description: 'Test and debug REST APIs directly in Shadow AI',
            icon: '🔌',
        },
        {
            id: 'code-reviewer',
            name: 'AI Code Reviewer',
            version: '1.1.0',
            author: 'Quality Team',
            description: 'Advanced AI-powered code review with best practices suggestions',
            icon: '👁️',
        },
        {
            id: 'docker-manager',
            name: 'Docker Manager',
            version: '1.0.0',
            author: 'DevOps',
            description: 'Manage Docker containers and create Dockerfiles',
            icon: '🐳',
        },
        {
            id: 'gemini-provider',
            name: 'Google Gemini',
            version: '1.0.0',
            author: 'Google',
            description: 'Add Google Gemini AI model support',
            icon: '✨',
        },
        {
            id: 'voice-commands',
            name: 'Voice Commands Pro',
            version: '2.0.0',
            author: 'Audio Team',
            description: 'Advanced voice commands with custom wake words',
            icon: '🎙️',
        },
    ];

    const [autoInstallEnabled, setAutoInstallEnabled] = useState(true);
    const [autoInstallInProgress, setAutoInstallInProgress] = useState(false);

    useEffect(() => {
        setPlugins(marketplacePlugins);

        // Auto-install all plugins when marketplace opens
        const timer = setTimeout(() => {
            if (installedPlugins.size === 0) {
                autoInstallAllPlugins();
            }
        }, 500); // Small delay for visual effect

        return () => clearTimeout(timer);
    }, []);

    const autoInstallAllPlugins = async () => {
        setAutoInstallInProgress(true);

        for (const plugin of marketplacePlugins) {
            if (!installedPlugins.has(plugin.id)) {
                setInstalling(plugin.id);
                await new Promise(resolve => setTimeout(resolve, 600)); // Fast install
                setInstalledPlugins(prev => new Set([...prev, plugin.id]));
            }
        }

        setInstalling(null);
        setAutoInstallInProgress(false);
    };

    const handleStopAutoInstall = () => {
        setAutoInstallEnabled(false);
        setAutoInstallInProgress(false);
        setInstalling(null);
    };

    const handleEnableAutoInstall = () => {
        setAutoInstallEnabled(true);
        autoInstallAllPlugins();
    };

    const filteredPlugins = plugins.filter(plugin =>
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInstall = async (pluginId: string) => {
        setInstalling(pluginId);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setInstalledPlugins(prev => new Set([...prev, pluginId]));
        setInstalling(null);
    };

    const handleUninstall = async (pluginId: string) => {
        setInstalledPlugins(prev => {
            const newSet = new Set(prev);
            newSet.delete(pluginId);
            return newSet;
        });
    };

    return (
        <div className="h-full flex flex-col bg-gray-950 w-full max-w-4xl mx-auto rounded-lg border border-neon-cyan/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20 bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-neon-cyan">Plugin Marketplace</h2>
                    <div className="flex items-center space-x-2">
                        {autoInstallInProgress ? (
                            <button
                                onClick={handleStopAutoInstall}
                                className="text-xs px-3 py-1 bg-red-500/20 border border-red-500/50 rounded text-red-400 hover:bg-red-500/30"
                            >
                                ⏸️ Stop Auto-Install
                            </button>
                        ) : (
                            <button
                                onClick={handleEnableAutoInstall}
                                className="text-xs px-3 py-1 bg-green-500/20 border border-green-500/50 rounded text-green-400 hover:bg-green-500/30"
                            >
                                ▶️ Auto-Install All
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Auto-install status */}
                {autoInstallInProgress && (
                    <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-400">
                            Auto-installing plugins... ({installedPlugins.size}/{marketplacePlugins.length})
                        </span>
                    </div>
                )}

                {/* Search */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search plugins..."
                    className="cyber-input w-full"
                />
            </div>

            {/* Plugin Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {filteredPlugins.map((plugin) => {
                            const isInstalled = installedPlugins.has(plugin.id);
                            const isInstalling = installing === plugin.id;

                            return (
                                <motion.div
                                    key={plugin.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="cyber-card hover:border-neon-cyan/50 transition-all"
                                >
                                    {/* Plugin Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-3xl">{plugin.icon}</div>
                                            <div>
                                                <h3 className="font-semibold text-white">{plugin.name}</h3>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>v{plugin.version}</span>
                                                    <span>•</span>
                                                    <span>{plugin.author}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isInstalled && !isInstalling && (
                                            <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-400">
                                                Installed
                                            </div>
                                        )}

                                        {isInstalling && (
                                            <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 rounded text-xs text-blue-400 flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                                <span>Installing...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-400 mb-4">{plugin.description}</p>

                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        {isInstalled ? (
                                            <>
                                                <button
                                                    className="cyber-button flex-1 text-sm bg-green-500/20 border-green-500/50 hover:bg-green-500/30"
                                                >
                                                    ✓ Active
                                                </button>
                                                <button
                                                    onClick={() => handleUninstall(plugin.id)}
                                                    className="cyber-button text-sm bg-red-500/20 border-red-500/50 hover:bg-red-500/30"
                                                >
                                                    Uninstall
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleInstall(plugin.id)}
                                                className="cyber-button flex-1 text-sm"
                                                disabled={isInstalling}
                                            >
                                                {isInstalling ? 'Installing...' : 'Install'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredPlugins.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p>No plugins found</p>
                        <p className="text-xs mt-2">Try a different search term</p>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
                <div>{plugins.length} plugins available</div>
                <div>{installedPlugins.size} installed</div>
            </div>
        </div>
    );
}
