import { motion } from 'framer-motion';

interface ModelDashboardProps {
    models: any[];
    currentModel: any;
    onModelSelect?: (modelId: string) => void;
}

export default function ModelDashboard({ models, currentModel, onModelSelect }: ModelDashboardProps) {
    const getModelTypeColor = (type: string) => {
        return type === 'cloud' ? 'text-blue-400' : 'text-green-400';
    };

    const getProviderIcon = (provider: string) => {
        const icons: Record<string, string> = {
            openai: '🤖',
            anthropic: '🧠',
            mistral: '⚡',
            ollama: '🦙',
            lmstudio: '💻',
            gpt4all: '🌐',
        };
        return icons[provider] || '🔮';
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-neon-cyan/20">
                <h2 className="text-lg font-semibold text-neon-cyan">Model Dashboard</h2>
                <p className="text-xs text-gray-500 mt-1">AI Model Performance & Status</p>
            </div>

            {/* Current Model */}
            {currentModel && (
                <div className="p-4 border-b border-gray-800">
                    <div className="text-xs text-gray-500 mb-2">Active Model</div>
                    <div className="cyber-card">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">{getProviderIcon(currentModel.provider)}</span>
                                <div>
                                    <div className="font-semibold text-white">{currentModel.name}</div>
                                    <div className={`text-xs ${getModelTypeColor(currentModel.type)}`}>
                                        {currentModel.type.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-glow"></div>
                        </div>

                        {currentModel.performance && (
                            <div className="mt-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Response Time</span>
                                    <span className="text-neon-cyan">
                                        {currentModel.performance.responseTime.toFixed(0)}ms
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Accuracy</span>
                                    <span className="text-neon-cyan">
                                        {(currentModel.performance.accuracy * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Available Models */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
                <div className="text-xs text-gray-500 mb-3">Available Models ({models.length})</div>
                <div className="space-y-2">
                    {models.map((model, idx) => (
                        <motion.div
                            key={model.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onModelSelect?.(model.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${model.id === currentModel?.id
                                ? 'bg-neon-cyan/10 border-neon-cyan/50'
                                : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span>{getProviderIcon(model.provider)}</span>
                                    <div>
                                        <div className="text-sm font-medium text-white">{model.name}</div>
                                        <div className={`text-xs ${getModelTypeColor(model.type)}`}>
                                            {model.provider}
                                        </div>
                                    </div>
                                </div>
                                {model.available ? (
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                ) : (
                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Agent Status */}
            <div className="p-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-3">Active Agents</div>
                <div className="space-y-2">
                    {['Architect', 'Builder', 'Debugger', 'UX', 'Communicator'].map((agent) => (
                        <div
                            key={agent}
                            className="flex items-center justify-between text-xs"
                        >
                            <span className={`agent-badge agent-${agent.toLowerCase()}`}>
                                {agent}
                            </span>
                            <span className="text-green-500">●</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
