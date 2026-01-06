/**
 * Custom Agent Builder
 * 
 * Create user-defined specialist AI agents
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CustomAgent {
    id: string;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
    model: string;
    temperature: number;
    capabilities: string[];
    examples: { input: string; output: string }[];
    createdAt: Date;
    usageCount: number;
}

const defaultAgents: Partial<CustomAgent>[] = [
    {
        name: 'Code Reviewer',
        description: 'Reviews code for quality, bugs, and best practices',
        icon: '🔍',
        systemPrompt: 'You are a senior code reviewer. Analyze code for:\n- Code quality and readability\n- Potential bugs and edge cases\n- Performance issues\n- Security vulnerabilities\n- Best practices',
        capabilities: ['code-review', 'suggestions', 'security'],
    },
    {
        name: 'Test Writer',
        description: 'Generates comprehensive unit tests',
        icon: '🧪',
        systemPrompt: 'You are a testing specialist. Generate comprehensive tests including:\n- Unit tests for all functions\n- Edge case coverage\n- Mocking strategies\n- Integration tests when needed',
        capabilities: ['test-generation', 'mocking', 'coverage'],
    },
    {
        name: 'Documentation Expert',
        description: 'Writes clear and comprehensive documentation',
        icon: '📝',
        systemPrompt: 'You are a documentation expert. Create:\n- JSDoc/TSDoc comments\n- README files\n- API documentation\n- Usage examples\nFocus on clarity and completeness.',
        capabilities: ['jsdoc', 'readme', 'api-docs'],
    },
];

const icons = ['🤖', '🧠', '⚡', '🔧', '🎯', '🚀', '💡', '🛡️', '🔍', '📊', '🧪', '📝'];

const CustomAgentBuilder: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [agents, setAgents] = useState<CustomAgent[]>([]);
    const [editingAgent, setEditingAgent] = useState<Partial<CustomAgent> | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const saved = await (window as any).shadowAPI?.agents?.getCustomAgents?.();
            // Merge save agents with defaults until we have a proper database seed
            if (saved && saved.length > 0) {
                setAgents(saved);
            } else {
                setAgents(defaultAgents as CustomAgent[]);
            }
        } catch (err) {
            console.error('Failed to load agents:', err);
            setAgents(defaultAgents as CustomAgent[]);
        }
    };

    const handleSave = async () => {
        if (!editingAgent?.name || !editingAgent?.systemPrompt) return;

        const agent: CustomAgent = {
            id: editingAgent.id || `agent_${Date.now()}`,
            name: editingAgent.name,
            description: editingAgent.description || '',
            icon: editingAgent.icon || '🤖',
            systemPrompt: editingAgent.systemPrompt,
            model: editingAgent.model || 'default',
            temperature: editingAgent.temperature || 0.7,
            capabilities: editingAgent.capabilities || [],
            examples: editingAgent.examples || [],
            createdAt: editingAgent.createdAt || new Date(),
            usageCount: editingAgent.usageCount || 0,
        };

        try {
            await (window as any).shadowAPI?.agents?.saveCustomAgent?.(agent);
            setAgents(prev => {
                const existing = prev.findIndex(a => a.id === agent.id);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = agent;
                    return updated;
                }
                return [...prev, agent];
            });
            setEditingAgent(null);
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to save agent:', err);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this agent?')) {
            try {
                await (window as any).shadowAPI?.agents?.deleteCustomAgent?.(id);
                setAgents(prev => prev.filter(a => a.id !== id));
                if (editingAgent?.id === id) {
                    setEditingAgent(null);
                    setIsCreating(false);
                }
            } catch (err) {
                console.error('Failed to delete agent:', err);
            }
        }
    };

    const startCreating = (template?: Partial<CustomAgent>) => {
        setEditingAgent(template || { icon: '🤖', temperature: 0.7 });
        setIsCreating(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#161b22] w-full max-w-4xl h-[85vh] rounded-xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span>🛠️</span>
                        <span>Custom Agent Builder</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {isCreating ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-semibold text-neon-cyan">
                                    {editingAgent?.id ? 'Edit Agent' : 'Create New Agent'}
                                </h3>
                                <button
                                    onClick={() => { setIsCreating(false); setEditingAgent(null); }}
                                    className="text-sm text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Icon</label>
                                    <div className="flex flex-wrap gap-2 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                                        {icons.map((icon) => (
                                            <button
                                                key={icon}
                                                onClick={() => setEditingAgent(prev => ({ ...prev, icon }))}
                                                className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-all ${editingAgent?.icon === icon
                                                    ? 'bg-neon-cyan/20 border border-neon-cyan text-white scale-110'
                                                    : 'hover:bg-gray-700 border border-transparent'
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editingAgent?.name || ''}
                                            onChange={(e) => setEditingAgent(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Code Reviewer"
                                            className="cyber-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Role Description</label>
                                        <input
                                            type="text"
                                            value={editingAgent?.description || ''}
                                            onChange={(e) => setEditingAgent(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="What does this agent do?"
                                            className="cyber-input w-full"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                        System Prompt
                                        <span className="text-xs text-gray-500 ml-2 font-normal">(The brain of your agent)</span>
                                    </label>
                                    <textarea
                                        value={editingAgent?.systemPrompt || ''}
                                        onChange={(e) => setEditingAgent(prev => ({ ...prev, systemPrompt: e.target.value }))}
                                        placeholder="You are a specialized AI assistant. Your goal is to..."
                                        className="cyber-input w-full min-h-[200px] font-mono text-sm leading-relaxed"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-medium text-gray-400">Creativity (Temperature)</label>
                                        <span className="text-neon-cyan font-mono text-xs">{editingAgent?.temperature || 0.7}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={editingAgent?.temperature || 0.7}
                                        onChange={(e) => setEditingAgent(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Precise</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
                                <button
                                    onClick={() => { setIsCreating(false); setEditingAgent(null); }}
                                    className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="cyber-button px-6 py-2"
                                    disabled={!editingAgent?.name || !editingAgent?.systemPrompt}
                                >
                                    Save Agent
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {agents.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Agents</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {agents.map((agent) => (
                                            <div
                                                key={agent.id}
                                                className="bg-[#0d1117] border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-all group relative"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl group-hover:bg-gray-700 transition-colors">
                                                        {agent.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white font-medium truncate">{agent.name}</h4>
                                                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">{agent.description}</p>
                                                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                                            <span>Used {agent.usageCount} times</span>
                                                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                            <span>Temp: {agent.temperature}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditingAgent(agent); setIsCreating(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-md hover:bg-gray-700"
                                                        title="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(agent.id, e)}
                                                        className="p-1.5 text-red-400 hover:text-red-300 bg-gray-800 rounded-md hover:bg-gray-700"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    {agents.length === 0 ? 'Get Started Templates' : 'Create from Template'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => startCreating()}
                                        className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg hover:border-neon-cyan/50 hover:bg-gray-800/50 transition-all group h-full min-h-[140px]"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform text-neon-cyan">
                                            +
                                        </div>
                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">Create Empty</span>
                                    </button>
                                    {defaultAgents.map((template, i) => (
                                        <button
                                            key={i}
                                            onClick={() => startCreating(template)}
                                            className="flex flex-col items-start gap-3 p-6 bg-gray-800/30 border border-gray-700 rounded-lg hover:border-neon-cyan/50 hover:bg-gray-800/50 transition-all text-left"
                                        >
                                            <span className="text-2xl">{template.icon}</span>
                                            <div>
                                                <h4 className="font-medium text-white mb-1">{template.name}</h4>
                                                <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default CustomAgentBuilder;
