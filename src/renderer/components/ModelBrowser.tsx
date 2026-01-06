import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelCatalogEntry {
    id: string;
    name: string;
    description: string;
    size: string;
    sizeBytes: number;
    source: 'ollama' | 'huggingface' | 'gpt4all';
    downloadUrl?: string;
    parameters?: string;
    quantization?: string;
    tags: string[];
    installed?: boolean;
}

interface DownloadProgress {
    modelId: string;
    bytesDownloaded: number;
    totalBytes: number;
    percentage: number;
    speed: string;
    eta: string;
    status: 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';
}

interface ModelBrowserProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ModelBrowser({ isOpen, onClose }: ModelBrowserProps) {
    const [models, setModels] = useState<ModelCatalogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [source, setSource] = useState<'all' | 'ollama' | 'huggingface' | 'gpt4all'>('all');
    const [storagePath, setStoragePath] = useState('');
    const [storageInfo, setStorageInfo] = useState<{ used: number; available: number; models: number }>({ used: 0, available: 0, models: 0 });
    const [activeDownloads, setActiveDownloads] = useState<DownloadProgress[]>([]);
    const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

    const loadModels = useCallback(async () => {
        setLoading(true);
        try {
            const sourceFilter = source === 'all' ? undefined : source;
            const result = await (window as any).shadowAPI?.localModel?.browseModels(sourceFilter, search);
            setModels(result || []);
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setLoading(false);
        }
    }, [source, search]);

    const loadStorageInfo = useCallback(async () => {
        try {
            const path = await (window as any).shadowAPI?.localModel?.getStoragePath();
            setStoragePath(path || '');
            const info = await (window as any).shadowAPI?.localModel?.getStorageInfo();
            setStorageInfo(info || { used: 0, available: 0, models: 0 });
        } catch (err) {
            console.error('Failed to load storage info:', err);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadModels();
            loadStorageInfo();
        }
    }, [isOpen, loadModels, loadStorageInfo]);

    const handleDownload = async (modelId: string) => {
        setDownloadingIds(prev => new Set(prev).add(modelId));
        try {
            await (window as any).shadowAPI?.localModel?.downloadModel(modelId);
            await loadModels();
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(modelId);
                return next;
            });
        }
    };

    const handleDelete = async (modelId: string) => {
        if (!confirm('Delete this model?')) return;
        try {
            await (window as any).shadowAPI?.localModel?.deleteLocalModel(modelId);
            await loadModels();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const handleSelectFolder = async () => {
        const path = await (window as any).shadowAPI?.localModel?.selectStorageFolder();
        if (path) {
            setStoragePath(path);
            await loadStorageInfo();
        }
    };

    const handleScanFolder = async () => {
        const scanned = await (window as any).shadowAPI?.localModel?.selectAndScanFolder();
        if (scanned?.length) {
            alert(`Found ${scanned.length} model files!`);
            await loadModels();
        }
    };

    const formatSize = (bytes: number): string => {
        const gb = bytes / (1024 * 1024 * 1024);
        if (gb >= 1) return `${gb.toFixed(1)} GB`;
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(0)} MB`;
    };

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'ollama': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
            case 'huggingface': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'gpt4all': return 'bg-green-500/20 text-green-400 border-green-500/50';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="cyber-panel w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🤖</span>
                        <h2 className="text-xl font-semibold text-neon-cyan">Model Browser</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
                </div>

                {/* Storage Info */}
                <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-400">Storage Path</div>
                            <div className="text-sm text-white font-mono truncate max-w-md">{storagePath || 'Not set'}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-right mr-4">
                                <div className="text-sm text-gray-400">{storageInfo.models} models</div>
                                <div className="text-sm text-white">{formatSize(storageInfo.used)} used</div>
                            </div>
                            <button onClick={handleSelectFolder} className="cyber-button-secondary text-sm px-3 py-1.5">
                                📁 Change
                            </button>
                            <button onClick={handleScanFolder} className="cyber-button-secondary text-sm px-3 py-1.5">
                                🔍 Scan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-800 flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && loadModels()}
                        className="cyber-input flex-1"
                    />
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value as any)}
                        className="cyber-input w-40"
                    >
                        <option value="all">All Sources</option>
                        <option value="ollama">🦙 Ollama</option>
                        <option value="huggingface">🤗 HuggingFace</option>
                        <option value="gpt4all">💬 GPT4All</option>
                    </select>
                    <button onClick={loadModels} className="cyber-button px-4">
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                </div>

                {/* Model List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="text-gray-400">Loading models...</div>
                        </div>
                    ) : models.length === 0 ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="text-gray-400">No models found</div>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {models.map((model) => (
                                <motion.div
                                    key={model.id}
                                    layout
                                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-white">{model.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${getSourceColor(model.source)}`}>
                                                    {model.source}
                                                </span>
                                                {model.installed && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/50">
                                                        ✓ Installed
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                <span>📦 {model.size}</span>
                                                {model.parameters && <span>🧠 {model.parameters}</span>}
                                                {model.quantization && <span>⚡ {model.quantization}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {model.tags.map((tag) => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {model.installed ? (
                                                <button
                                                    onClick={() => handleDelete(model.id)}
                                                    className="cyber-button-secondary text-sm px-3 py-1.5 text-red-400 hover:text-red-300"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDownload(model.id)}
                                                    disabled={downloadingIds.has(model.id)}
                                                    className="cyber-button text-sm px-3 py-1.5"
                                                >
                                                    {downloadingIds.has(model.id) ? '⏳ Downloading...' : '⬇️ Download'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                        {models.length} models available
                    </div>
                    <button onClick={onClose} className="cyber-button text-sm">
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
