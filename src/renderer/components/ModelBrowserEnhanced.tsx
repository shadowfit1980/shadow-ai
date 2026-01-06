import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIModel {
    id: string;
    name: string;
    provider: 'ollama' | 'huggingface' | 'gpt4all';
    size: string;
    parameters: string;
    quantization?: string;
    description: string;
    tags: string[];
    downloads?: number;
    installed: boolean;
    downloadProgress?: number;
}

const AVAILABLE_MODELS: AIModel[] = [
    {
        id: 'llama3.2:3b',
        name: 'Llama 3.2 3B',
        provider: 'ollama',
        size: '2.0 GB',
        parameters: '3B',
        quantization: 'Q4_K_M',
        description: 'Fast, efficient model for general tasks',
        tags: ['general', 'fast', 'coding'],
        downloads: 150000,
        installed: false
    },
    {
        id: 'llama3.2:1b',
        name: 'Llama 3.2 1B',
        provider: 'ollama',
        size: '1.3 GB',
        parameters: '1B',
        quantization: 'Q4_K_M',
        description: 'Smallest Llama model, runs on any hardware',
        tags: ['general', 'tiny', 'fast'],
        downloads: 98000,
        installed: false
    },
    {
        id: 'codellama:7b',
        name: 'Code Llama 7B',
        provider: 'ollama',
        size: '3.8 GB',
        parameters: '7B',
        quantization: 'Q4_K_M',
        description: 'Specialized for code generation and understanding',
        tags: ['coding', 'python', 'javascript'],
        downloads: 250000,
        installed: false
    },
    {
        id: 'deepseek-coder-v2:16b',
        name: 'DeepSeek Coder V2 16B',
        provider: 'ollama',
        size: '8.9 GB',
        parameters: '16B',
        quantization: 'Q4_K_M',
        description: 'Advanced coding model, excellent for complex tasks',
        tags: ['coding', 'advanced'],
        downloads: 85000,
        installed: false
    },
    {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen 2.5 Coder 7B',
        provider: 'ollama',
        size: '4.7 GB',
        parameters: '7B',
        quantization: 'Q4_K_M',
        description: 'Multi-language coding assistant',
        tags: ['coding', 'multilingual'],
        downloads: 120000,
        installed: false
    },
    {
        id: 'mistral:7b',
        name: 'Mistral 7B',
        provider: 'ollama',
        size: '4.1 GB',
        parameters: '7B',
        quantization: 'Q4_K_M',
        description: 'Excellent general-purpose model',
        tags: ['general', 'balanced'],
        downloads: 320000,
        installed: false
    },
    {
        id: 'phi3:mini',
        name: 'Phi-3 Mini',
        provider: 'ollama',
        size: '2.3 GB',
        parameters: '3.8B',
        description: 'Microsoft\'s compact but powerful model',
        tags: ['general', 'microsoft'],
        downloads: 180000,
        installed: false
    },
    {
        id: 'gemma2:2b',
        name: 'Gemma 2 2B',
        provider: 'ollama',
        size: '1.6 GB',
        parameters: '2B',
        description: 'Google\'s efficient small model',
        tags: ['general', 'google', 'fast'],
        downloads: 95000,
        installed: false
    },
    {
        id: 'starcoder2:3b',
        name: 'StarCoder2 3B',
        provider: 'ollama',
        size: '1.7 GB',
        parameters: '3B',
        description: 'Code completion and generation',
        tags: ['coding', 'completion'],
        downloads: 75000,
        installed: false
    },
    {
        id: 'nomic-embed-text',
        name: 'Nomic Embed Text',
        provider: 'ollama',
        size: '274 MB',
        parameters: '137M',
        description: 'Text embeddings for RAG applications',
        tags: ['embeddings', 'rag'],
        downloads: 200000,
        installed: false
    }
];

export default function ModelBrowserEnhanced() {
    const [models, setModels] = useState<AIModel[]>(AVAILABLE_MODELS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProvider, setSelectedProvider] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set());
    const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

    const allTags = [...new Set(models.flatMap(m => m.tags))];

    const filteredModels = models.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProvider = selectedProvider === 'all' || model.provider === selectedProvider;
        const matchesTag = selectedTag === 'all' || model.tags.includes(selectedTag);
        return matchesSearch && matchesProvider && matchesTag;
    });

    const downloadModel = async (model: AIModel) => {
        setDownloadingModels(prev => new Set(prev).add(model.id));

        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 300));
            setModels(prev => prev.map(m =>
                m.id === model.id ? { ...m, downloadProgress: i } : m
            ));
        }

        // Mark as installed
        setModels(prev => prev.map(m =>
            m.id === model.id ? { ...m, installed: true, downloadProgress: undefined } : m
        ));
        setDownloadingModels(prev => {
            const next = new Set(prev);
            next.delete(model.id);
            return next;
        });
    };

    const deleteModel = (modelId: string) => {
        setModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, installed: false } : m
        ));
    };

    const formatDownloads = (num?: number) => {
        if (!num) return '';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toString();
    };

    return (
        <div className="cyber-panel h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center space-x-2">
                        <span>🤖</span>
                        <span>Model Browser</span>
                    </h2>
                    <div className="text-xs text-gray-500">
                        {models.filter(m => m.installed).length} installed • {models.length} available
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search models..."
                        className="cyber-input flex-1"
                    />
                    <select
                        value={selectedProvider}
                        onChange={e => setSelectedProvider(e.target.value)}
                        className="cyber-input"
                    >
                        <option value="all">All Providers</option>
                        <option value="ollama">Ollama</option>
                        <option value="huggingface">Hugging Face</option>
                        <option value="gpt4all">GPT4All</option>
                    </select>
                    <select
                        value={selectedTag}
                        onChange={e => setSelectedTag(e.target.value)}
                        className="cyber-input"
                    >
                        <option value="all">All Tags</option>
                        {allTags.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Models Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredModels.map(model => (
                        <motion.div
                            key={model.id}
                            layoutId={model.id}
                            onClick={() => setSelectedModel(model)}
                            className={`p-4 rounded-lg cursor-pointer transition-all border ${model.installed
                                    ? 'bg-green-900/20 border-green-500/30'
                                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-medium text-gray-200">{model.name}</h3>
                                        {model.installed && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                                                ✓ Installed
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                                </div>
                                <span className="text-xs text-gray-500">{model.size}</span>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex flex-wrap gap-1">
                                    {model.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    {model.downloads && (
                                        <span>↓ {formatDownloads(model.downloads)}</span>
                                    )}
                                    <span className="text-neon-cyan">{model.parameters}</span>
                                </div>
                            </div>

                            {/* Download Progress */}
                            {downloadingModels.has(model.id) && model.downloadProgress !== undefined && (
                                <div className="mt-3">
                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-neon-cyan"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${model.downloadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 text-center">
                                        Downloading... {model.downloadProgress}%
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="mt-3 flex justify-end space-x-2">
                                {model.installed ? (
                                    <>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteModel(model.id); }}
                                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={e => e.stopPropagation()}
                                            className="text-xs px-2 py-1 rounded bg-neon-cyan/20 text-neon-cyan"
                                        >
                                            Use Model
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={e => { e.stopPropagation(); downloadModel(model); }}
                                        disabled={downloadingModels.has(model.id)}
                                        className="text-xs px-3 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
                                    >
                                        {downloadingModels.has(model.id) ? 'Downloading...' : '↓ Download'}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredModels.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>No models found matching your search</p>
                    </div>
                )}
            </div>

            {/* Model Details Modal */}
            <AnimatePresence>
                {selectedModel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                        onClick={() => setSelectedModel(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="cyber-panel p-6 w-full max-w-lg"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-white">{selectedModel.name}</h3>
                                    <p className="text-sm text-gray-400">{selectedModel.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedModel(null)}
                                    className="text-gray-500 hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="text-gray-300 mb-4">{selectedModel.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded bg-gray-800/50">
                                    <p className="text-xs text-gray-500">Size</p>
                                    <p className="text-lg text-white">{selectedModel.size}</p>
                                </div>
                                <div className="p-3 rounded bg-gray-800/50">
                                    <p className="text-xs text-gray-500">Parameters</p>
                                    <p className="text-lg text-neon-cyan">{selectedModel.parameters}</p>
                                </div>
                                <div className="p-3 rounded bg-gray-800/50">
                                    <p className="text-xs text-gray-500">Provider</p>
                                    <p className="text-lg text-white capitalize">{selectedModel.provider}</p>
                                </div>
                                <div className="p-3 rounded bg-gray-800/50">
                                    <p className="text-xs text-gray-500">Downloads</p>
                                    <p className="text-lg text-white">{formatDownloads(selectedModel.downloads)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedModel.tags.map(tag => (
                                    <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setSelectedModel(null)} className="cyber-button-secondary">
                                    Close
                                </button>
                                {selectedModel.installed ? (
                                    <button className="cyber-button">Use Model</button>
                                ) : (
                                    <button
                                        onClick={() => { downloadModel(selectedModel); setSelectedModel(null); }}
                                        className="cyber-button"
                                    >
                                        ↓ Download ({selectedModel.size})
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
