import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIModel {
    id: string;
    name: string;
    provider: string;
    type: 'cloud' | 'local';
    available: boolean;
}

interface ModelSelectorProps {
    onModelChange?: (modelId: string) => void;
    compact?: boolean;
}

export default function ModelSelector({ onModelChange, compact = false }: ModelSelectorProps) {
    const [models, setModels] = useState<AIModel[]>([]);
    const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'cloud' | 'local'>('all');
    const [providerFilter, setProviderFilter] = useState<string>('all');

    // Load models on mount
    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        setLoading(true);
        try {
            const api = (window as any).shadowAPI;
            if (api?.listModels) {
                const modelList = await api.listModels();
                setModels(modelList || []);

                // Set current model if not set
                if (!currentModel && modelList?.length > 0) {
                    setCurrentModel(modelList[0]);
                }
            }
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectModel = async (model: AIModel) => {
        try {
            const api = (window as any).shadowAPI;
            if (api?.selectModel) {
                await api.selectModel(model.id);
                setCurrentModel(model);
                onModelChange?.(model.id);
            }
        } catch (err) {
            console.error('Failed to select model:', err);
        }
        setIsOpen(false);
    };

    const getProviderIcon = (provider: string): string => {
        switch (provider.toLowerCase()) {
            case 'openai': return '🟢';
            case 'anthropic': return '🟣';
            case 'gemini': return '💎';
            case 'openrouter': return '🔀';
            case 'groq': return '⚡';
            case 'ollama': return '🦙';
            case 'deepseek': return '🔍';
            case 'lmstudio': return '🖥️';
            case 'mistral': return '🌪️';
            default: return '🤖';
        }
    };

    const getProviderColor = (provider: string): string => {
        switch (provider.toLowerCase()) {
            case 'openai': return 'text-green-400';
            case 'anthropic': return 'text-purple-400';
            case 'gemini': return 'text-blue-400';
            case 'openrouter': return 'text-orange-400';
            case 'groq': return 'text-yellow-400';
            case 'ollama': return 'text-cyan-400';
            case 'deepseek': return 'text-indigo-400';
            default: return 'text-gray-400';
        }
    };

    const filteredModels = models.filter(m => {
        if (filter !== 'all' && m.type !== filter) return false;
        if (providerFilter !== 'all' && m.provider !== providerFilter) return false;
        return true;
    });

    const providers = [...new Set(models.map(m => m.provider))];

    const groupedModels = filteredModels.reduce((acc, model) => {
        if (!acc[model.provider]) acc[model.provider] = [];
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, AIModel[]>);

    if (compact) {
        return (
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-neon-cyan/30 text-sm transition-all shadow-lg"
                >
                    <span className="text-lg">{currentModel ? getProviderIcon(currentModel.provider) : '🤖'}</span>
                    <div className="text-left">
                        <div className="text-gray-300 max-w-[150px] truncate font-medium">
                            {currentModel?.name || 'Select Model'}
                        </div>
                        <div className="text-[10px] text-gray-500">{models.length} models available</div>
                    </div>
                    <span className="text-neon-cyan">{isOpen ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-neon-cyan/30 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto"
                        >
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">Loading models...</div>
                            ) : models.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                    <div className="text-2xl mb-2">🔐</div>
                                    <div>No models available</div>
                                    <div className="text-xs mt-1">Add API keys in Settings</div>
                                </div>
                            ) : (
                                Object.entries(groupedModels).map(([provider, providerModels]) => (
                                    <div key={provider}>
                                        <div className={`px-3 py-1.5 text-xs font-semibold uppercase ${getProviderColor(provider)} bg-gray-800/50 sticky top-0`}>
                                            {getProviderIcon(provider)} {provider} ({providerModels.length})
                                        </div>
                                        {providerModels.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => handleSelectModel(model)}
                                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center justify-between ${currentModel?.id === model.id ? 'bg-gray-800 text-neon-cyan' : 'text-gray-300'
                                                    }`}
                                            >
                                                <span className="truncate">{model.name}</span>
                                                {currentModel?.id === model.id && <span className="text-neon-cyan">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="cyber-panel p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                    <span>🤖</span>
                    <span>AI Model Selection</span>
                </h3>
                <button
                    onClick={loadModels}
                    disabled={loading}
                    className="cyber-button-secondary text-sm px-3 py-1"
                >
                    {loading ? '⏳' : '🔄'} Refresh
                </button>
            </div>

            {/* Current Model */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-neon-cyan/30">
                <div className="text-xs text-gray-400 mb-1">Current Model</div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl">{currentModel ? getProviderIcon(currentModel.provider) : '❓'}</span>
                        <div>
                            <div className="text-white font-medium">{currentModel?.name || 'No model selected'}</div>
                            <div className={`text-xs ${currentModel ? getProviderColor(currentModel.provider) : 'text-gray-500'}`}>
                                {currentModel?.provider || 'Select a model below'} • {currentModel?.type || ''}
                            </div>
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${currentModel?.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {currentModel?.available ? '● Online' : '○ Offline'}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3 mb-4">
                <div className="flex-1">
                    <select
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        className="cyber-input text-sm w-full"
                    >
                        <option value="all">All Providers</option>
                        {providers.map(p => (
                            <option key={p} value={p}>{getProviderIcon(p)} {p}</option>
                        ))}
                    </select>
                </div>
                <div className="flex space-x-1">
                    {(['all', 'cloud', 'local'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs rounded ${filter === f
                                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            {f === 'all' ? '📋 All' : f === 'cloud' ? '☁️ Cloud' : '💻 Local'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Model List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin text-2xl mb-2">⏳</div>
                        Loading models...
                    </div>
                ) : filteredModels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No models found. Add API keys in Settings.
                    </div>
                ) : (
                    Object.entries(groupedModels).map(([provider, providerModels]) => (
                        <div key={provider} className="mb-3">
                            <div className={`text-xs font-semibold uppercase mb-1 flex items-center space-x-1 ${getProviderColor(provider)}`}>
                                <span>{getProviderIcon(provider)}</span>
                                <span>{provider}</span>
                                <span className="text-gray-600">({providerModels.length})</span>
                            </div>
                            <div className="space-y-1">
                                {providerModels.map(model => (
                                    <motion.button
                                        key={model.id}
                                        onClick={() => handleSelectModel(model)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-all ${currentModel?.id === model.id
                                            ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-white'
                                            : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{model.name}</div>
                                            <div className="text-xs text-gray-500">{model.id}</div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-2">
                                            <span className={`text-xs px-2 py-0.5 rounded ${model.type === 'cloud'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {model.type === 'cloud' ? '☁️' : '💻'}
                                            </span>
                                            {currentModel?.id === model.id && (
                                                <span className="text-neon-cyan">✓</span>
                                            )}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <span>
                    {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
                </span>
                <span>
                    {providers.length} provider{providers.length !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}
