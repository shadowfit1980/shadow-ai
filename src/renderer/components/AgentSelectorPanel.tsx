import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentInfo {
    id: string;
    name: string;
    type: string;
    specialty: string;
    capabilities: string[];
    status: 'idle' | 'busy' | 'error';
    successRate: number;
    tasksCompleted: number;
    icon: string;
}

const MOCK_AGENTS: AgentInfo[] = [
    {
        id: 'architect',
        name: 'Architect Agent',
        type: 'architect',
        specialty: 'System design and architecture planning',
        capabilities: ['Design patterns', 'System architecture', 'Scalability planning', 'API design'],
        status: 'idle',
        successRate: 94,
        tasksCompleted: 127,
        icon: '🏗️'
    },
    {
        id: 'coder',
        name: 'Coder Agent',
        type: 'coder',
        specialty: 'Code generation and implementation',
        capabilities: ['Code generation', 'Refactoring', 'Optimization', 'Multi-language support'],
        status: 'idle',
        successRate: 91,
        tasksCompleted: 342,
        icon: '💻'
    },
    {
        id: 'debugger',
        name: 'Debugger Agent',
        type: 'debugger',
        specialty: 'Bug detection and fixing',
        capabilities: ['Error analysis', 'Stack trace parsing', 'Fix suggestions', 'Root cause analysis'],
        status: 'idle',
        successRate: 88,
        tasksCompleted: 89,
        icon: '🐛'
    },
    {
        id: 'reviewer',
        name: 'Review Agent',
        type: 'reviewer',
        specialty: 'Code review and quality assurance',
        capabilities: ['Code review', 'Best practices', 'Security audit', 'Performance review'],
        status: 'idle',
        successRate: 96,
        tasksCompleted: 215,
        icon: '🔍'
    },
    {
        id: 'security',
        name: 'Security Agent',
        type: 'security',
        specialty: 'Security analysis and vulnerability detection',
        capabilities: ['Vulnerability scanning', 'OWASP compliance', 'Penetration testing', 'Security fixes'],
        status: 'idle',
        successRate: 97,
        tasksCompleted: 76,
        icon: '🛡️'
    },
    {
        id: 'tester',
        name: 'Test Agent',
        type: 'tester',
        specialty: 'Test generation and execution',
        capabilities: ['Unit tests', 'Integration tests', 'E2E tests', 'Test coverage'],
        status: 'idle',
        successRate: 89,
        tasksCompleted: 156,
        icon: '🧪'
    },
    {
        id: 'docs',
        name: 'Documentation Agent',
        type: 'docs',
        specialty: 'Documentation and API specs',
        capabilities: ['API docs', 'README generation', 'Code comments', 'User guides'],
        status: 'idle',
        successRate: 93,
        tasksCompleted: 98,
        icon: '📚'
    },
    {
        id: 'devops',
        name: 'DevOps Agent',
        type: 'devops',
        specialty: 'CI/CD and deployment automation',
        capabilities: ['CI/CD pipelines', 'Docker', 'Kubernetes', 'Cloud deployment'],
        status: 'idle',
        successRate: 90,
        tasksCompleted: 64,
        icon: '🚀'
    }
];

interface AgentSelectorPanelProps {
    onAgentSelect?: (agent: AgentInfo) => void;
    onTaskSubmit?: (task: string, agentId?: string) => void;
    selectedAgentId?: string;
}

export default function AgentSelectorPanel({
    onAgentSelect,
    onTaskSubmit,
    selectedAgentId
}: AgentSelectorPanelProps) {
    const [agents, setAgents] = useState<AgentInfo[]>(MOCK_AGENTS);
    const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
    const [taskInput, setTaskInput] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [filter, setFilter] = useState<'all' | 'idle' | 'busy'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Load real agents from API
        const loadAgents = async () => {
            try {
                const api = (window as any).shadowAPI;
                if (api?.agents?.list) {
                    const realAgents = await api.agents.list();
                    if (realAgents?.length) {
                        setAgents(realAgents);
                    }
                }
            } catch (error) {
                console.log('Using mock agents');
            }
        };
        loadAgents();
    }, []);

    useEffect(() => {
        if (selectedAgentId) {
            const agent = agents.find(a => a.id === selectedAgentId);
            if (agent) setSelectedAgent(agent);
        }
    }, [selectedAgentId, agents]);

    const filteredAgents = agents.filter(agent => {
        if (filter !== 'all' && agent.status !== filter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                agent.name.toLowerCase().includes(query) ||
                agent.specialty.toLowerCase().includes(query) ||
                agent.capabilities.some(c => c.toLowerCase().includes(query))
            );
        }
        return true;
    });

    const handleAgentSelect = useCallback((agent: AgentInfo) => {
        setSelectedAgent(agent);
        onAgentSelect?.(agent);
    }, [onAgentSelect]);

    const handleSubmitTask = useCallback(() => {
        if (!taskInput.trim()) return;
        onTaskSubmit?.(taskInput, selectedAgent?.id);
        setTaskInput('');
    }, [taskInput, selectedAgent, onTaskSubmit]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'idle': return 'bg-green-400';
            case 'busy': return 'bg-yellow-400';
            case 'error': return 'bg-red-400';
            default: return 'bg-gray-400';
        }
    };

    const getSuccessRateColor = (rate: number) => {
        if (rate >= 90) return 'text-green-400';
        if (rate >= 70) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="h-full flex flex-col bg-gray-950">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-neon-cyan flex items-center gap-2">
                        🤖 Agent Selector
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                            {agents.filter(a => a.status === 'idle').length}/{agents.length} available
                        </span>
                    </div>
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:border-neon-cyan/50 focus:outline-none text-gray-300 placeholder-gray-600"
                />

                {/* Filter */}
                <div className="flex gap-2 mt-3">
                    {(['all', 'idle', 'busy'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${filter === f
                                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                <AnimatePresence>
                    {filteredAgents.map((agent, index) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleAgentSelect(agent)}
                            className={`p-4 rounded-lg cursor-pointer transition-all ${selectedAgent?.id === agent.id
                                    ? 'bg-neon-cyan/10 border border-neon-cyan/50'
                                    : 'bg-gray-900/50 border border-gray-800 hover:border-gray-700'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{agent.icon}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{agent.name}</span>
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{agent.specialty}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-medium ${getSuccessRateColor(agent.successRate)}`}>
                                        {agent.successRate}%
                                    </span>
                                    <p className="text-xs text-gray-500">{agent.tasksCompleted} tasks</p>
                                </div>
                            </div>

                            {/* Capabilities */}
                            {(selectedAgent?.id === agent.id || isExpanded) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="mt-3 flex flex-wrap gap-1"
                                >
                                    {agent.capabilities.map((cap, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                                        >
                                            {cap}
                                        </span>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredAgents.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No agents match your search
                    </div>
                )}
            </div>

            {/* Task Input */}
            <div className="p-4 border-t border-gray-800">
                <div className="mb-2">
                    {selectedAgent ? (
                        <span className="text-xs text-gray-400">
                            Assign to: <span className="text-neon-cyan">{selectedAgent.name}</span>
                        </span>
                    ) : (
                        <span className="text-xs text-gray-500">
                            Select an agent or let the system choose
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitTask()}
                        placeholder="Describe your task..."
                        className="flex-1 px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:border-neon-cyan/50 focus:outline-none text-gray-300"
                    />
                    <button
                        onClick={handleSubmitTask}
                        disabled={!taskInput.trim()}
                        className="cyber-button px-4 py-2 disabled:opacity-50"
                    >
                        Execute
                    </button>
                </div>
            </div>
        </div>
    );
}
