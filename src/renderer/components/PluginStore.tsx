import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Align with backend Plugin interface
interface Plugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    rating: number;
    downloads: number;
    installed: boolean;
    enabled: boolean;
    icon?: string;
}

export default function PluginStore() {
    const [plugins, setPlugins] = useState<Plugin[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [installing, setInstalling] = useState<string | null>(null);

    useEffect(() => {
        loadPlugins();
    }, []);

    const loadPlugins = async () => {
        try {
            const list = await (window as any).shadowAPI?.plugins?.list?.();
            if (list) setPlugins(list);
        } catch (err) {
            console.error('Failed to load plugins:', err);
        }
    };

    const categories = ['All', ...new Set(plugins.map(p => p.category))];

    const filteredPlugins = plugins.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleInstall = async (plugin: Plugin) => {
        setInstalling(plugin.id);

        try {
            if (plugin.installed) {
                await (window as any).shadowAPI?.plugins?.uninstall?.(plugin.id);
            } else {
                await (window as any).shadowAPI?.plugins?.install?.(plugin.id);
            }
            // Reload list to reflect changes
            await loadPlugins();
        } catch (err) {
            console.error('Failed to toggle install:', err);
        }

        setInstalling(null);
    };

    const toggleEnable = async (id: string) => {
        const plugin = plugins.find(p => p.id === id);
        if (!plugin) return;

        try {
            if (plugin.enabled) {
                await (window as any).shadowAPI?.plugins?.disable?.(id);
            } else {
                await (window as any).shadowAPI?.plugins?.enable?.(id);
            }
            await loadPlugins();
        } catch (err) {
            console.error('Failed to toggle enable:', err);
        }
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🧩</span>
                        <span>Plugin Marketplace</span>
                    </h2>
                    <div className="text-xs text-gray-500">
                        {plugins.filter(p => p.installed).length} installed
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search extensions..."
                        className="cyber-input flex-1"
                    />
                    <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="cyber-input w-40"
                    >
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 gap-3">
                    {filteredPlugins.map(plugin => (
                        <motion.div
                            key={plugin.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                                        {plugin.icon || '📦'}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-white font-medium">{plugin.name}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-800">
                                                v{plugin.version}
                                            </span>
                                            {plugin.installed && (
                                                <span className="text-[10px] text-green-400 font-medium">INSTALLED</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{plugin.description}</p>
                                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                                            <span>{plugin.author}</span>
                                            <span>•</span>
                                            <span>{plugin.category}</span>
                                            <span>•</span>
                                            <span className="text-yellow-500">★ {plugin.rating}</span>
                                            <span>•</span>
                                            <span>{plugin.downloads.toLocaleString()} installs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end space-y-2">
                                    <button
                                        onClick={() => toggleInstall(plugin)}
                                        disabled={installing === plugin.id}
                                        className={`px-4 py-1.5 rounded text-xs font-medium min-w-[100px] transition-colors ${plugin.installed
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-neon-cyan text-black hover:bg-cyan-400'
                                            } ${installing === plugin.id ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {installing === plugin.id
                                            ? 'Processing...'
                                            : plugin.installed ? 'Uninstall' : 'Install'}
                                    </button>

                                    {plugin.installed && (
                                        <button
                                            onClick={() => toggleEnable(plugin.id)}
                                            className={`text-xs ${plugin.enabled ? 'text-green-400' : 'text-gray-500'}`}
                                        >
                                            {plugin.enabled ? 'Enabled' : 'Disabled'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
