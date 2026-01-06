import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolMetadata {
    name: string;
    description: string;
    category: string;
    parameters: Array<{
        name: string;
        type: string;
        description: string;
        required: boolean;
        default?: any;
    }>;
    examples?: Array<{
        input: Record<string, any>;
        output: any;
        description: string;
    }>;
    tags?: string[];
}

interface ToolStats {
    totalTools: number;
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    byCategory: Record<string, number>;
    mostUsed: Array<{ name: string; count: number }>;
}

export default function ToolExplorer() {
    const [tools, setTools] = useState<ToolMetadata[]>([]);
    const [stats, setStats] = useState<ToolStats | null>(null);
    const [selectedTool, setSelectedTool] = useState<ToolMetadata | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        loadTools();
        loadStats();
    }, []);

    const loadTools = async () => {
        try {
            const toolList = await (window as any).shadowAPI.tools.list();
            setTools(toolList);
        } catch (error) {
            console.error('Failed to load tools:', error);
        }
    };

    const loadStats = async () => {
        try {
            const toolStats = await (window as any).shadowAPI.tools.getStats();
            setStats(toolStats);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const filteredTools = tools.filter(tool => {
        const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
        const matchesSearch =
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ['all', ...new Set(tools.map(t => t.category))];

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            file: 'bg-blue-500/20 text-blue-400',
            code: 'bg-purple-500/20 text-purple-400',
            browser: 'bg-green-500/20 text-green-400',
            terminal: 'bg-yellow-500/20 text-yellow-400',
            api: 'bg-pink-500/20 text-pink-400',
            analysis: 'bg-cyan-500/20 text-cyan-400',
            other: 'bg-gray-500/20 text-gray-400',
        };
        return colors[category] || colors.other;
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="fixed bottom-6 right-6 z-50 cyber-button p-3 rounded-full shadow-lg"
                title="Tool Explorer"
            >
                🔧
            </button>

            {/* Tool Explorer Panel */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, x: 400 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 400 }}
                        className="fixed top-0 right-0 w-[500px] h-full bg-dark-800/95 backdrop-blur-xl border-l border-neon-cyan/20 z-40 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-neon-cyan/20">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xl font-bold text-neon-cyan flex items-center space-x-2">
                                    <span>🔧</span>
                                    <span>Tool Explorer</span>
                                </h2>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="text-gray-400 hover:text-white transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Stats Summary */}
                            {stats && (
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div className="cyber-panel p-2">
                                        <div className="text-gray-400">Total Tools</div>
                                        <div className="text-lg font-bold text-neon-cyan">{stats.totalTools}</div>
                                    </div>
                                    <div className="cyber-panel p-2">
                                        <div className="text-gray-400">Executions</div>
                                        <div className="text-lg font-bold text-green-400">{stats.totalExecutions}</div>
                                    </div>
                                    <div className="cyber-panel p-2">
                                        <div className="text-gray-400">Success Rate</div>
                                        <div className="text-lg font-bold text-purple-400">
                                            {(stats.successRate * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full mt-3 px-3 py-2 bg-dark-700 border border-neon-cyan/30 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
                            />

                            {/* Category Filter */}
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition ${selectedCategory === cat
                                                ? 'bg-neon-cyan text-dark-900'
                                                : 'bg-dark-700 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tool List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredTools.map((tool, index) => (
                                <motion.div
                                    key={tool.name}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedTool(tool)}
                                    className="cyber-panel p-3 cursor-pointer hover:border-neon-cyan transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-mono text-sm font-bold text-white">
                                                {tool.name}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {tool.description}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(tool.category)}`}>
                                                    {tool.category}
                                                </span>
                                                {tool.tags?.map(tag => (
                                                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-dark-600 text-gray-400">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button className="text-neon-cyan text-lg">→</button>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredTools.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    No tools found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tool Detail Modal */}
            <AnimatePresence>
                {selectedTool && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedTool(null)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="cyber-panel p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-neon-cyan font-mono">
                                        {selectedTool.name}
                                    </h3>
                                    <p className="text-gray-400 mt-1">{selectedTool.description}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTool(null)}
                                    className="text-gray-400 hover:text-white text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Parameters */}
                            <div className="mb-4">
                                <h4 className="text-lg font-semibold text-white mb-2">Parameters</h4>
                                <div className="space-y-2">
                                    {selectedTool.parameters.map(param => (
                                        <div key={param.name} className="bg-dark-700 p-3 rounded">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-mono text-neon-cyan">{param.name}</span>
                                                <span className="text-xs text-gray-500">{param.type}</span>
                                                {param.required && (
                                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                        required
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">{param.description}</div>
                                            {param.default !== undefined && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Default: <code>{JSON.stringify(param.default)}</code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Examples */}
                            {selectedTool.examples && selectedTool.examples.length > 0 && (
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-2">Examples</h4>
                                    {selectedTool.examples.map((example, idx) => (
                                        <div key={idx} className="bg-dark-700 p-3 rounded mb-2">
                                            <div className="text-sm text-gray-300 mb-2">{example.description}</div>
                                            <div className="text-xs">
                                                <div className="text-gray-500 mb-1">Input:</div>
                                                <pre className="bg-dark-800 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(example.input, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
