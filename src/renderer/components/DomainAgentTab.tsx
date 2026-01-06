/**
 * DomainAgentTab
 * 
 * Tab component for AgenticDashboard showing domain-specific agent status
 * and quick actions for Mobile, Game, and Desktop development.
 */

import React, { useState, useEffect } from 'react';
import { useMobileAgent, useGameAgent, useDesktopAgent, useHiveMind } from '../hooks/useDomainAgents';
import './DomainAgentTab.css';

interface DomainAgentTabProps {
    onExecute?: (result: any) => void;
}

export const DomainAgentTab: React.FC<DomainAgentTabProps> = ({ onExecute }) => {
    const mobile = useMobileAgent();
    const game = useGameAgent();
    const desktop = useDesktopAgent();
    const hivemind = useHiveMind();

    const [selectedDomain, setSelectedDomain] = useState<'mobile' | 'game' | 'desktop'>('mobile');
    const [taskInput, setTaskInput] = useState('');
    const [executing, setExecuting] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    const domains = [
        {
            id: 'mobile' as const,
            name: 'Mobile',
            icon: '📱',
            color: '#667eea',
            capabilities: mobile.capabilities.length,
            loading: mobile.loading
        },
        {
            id: 'game' as const,
            name: 'Game',
            icon: '🎮',
            color: '#f093fb',
            capabilities: game.capabilities.length,
            loading: game.loading
        },
        {
            id: 'desktop' as const,
            name: 'Desktop',
            icon: '🖥️',
            color: '#4facfe',
            capabilities: desktop.capabilities.length,
            loading: desktop.loading
        },
    ];

    const currentDomain = domains.find(d => d.id === selectedDomain)!;

    const handleExecute = async () => {
        if (!taskInput.trim()) return;

        setExecuting(true);
        setLastResult(null);

        try {
            let result;
            const task = { task: taskInput, spec: taskInput };

            switch (selectedDomain) {
                case 'mobile':
                    result = await mobile.execute(task);
                    break;
                case 'game':
                    result = await game.execute(task);
                    break;
                case 'desktop':
                    result = await desktop.execute(task);
                    break;
            }

            setLastResult(result);
            onExecute?.(result);
        } catch (error: any) {
            setLastResult({ success: false, error: error.message });
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="domain-agent-tab">
            {/* Domain Selector */}
            <div className="domain-selector">
                {domains.map(domain => (
                    <button
                        key={domain.id}
                        className={`domain-btn ${selectedDomain === domain.id ? 'active' : ''}`}
                        style={{ '--accent-color': domain.color } as any}
                        onClick={() => setSelectedDomain(domain.id)}
                    >
                        <span className="domain-icon">{domain.icon}</span>
                        <span className="domain-name">{domain.name}</span>
                        <span className="capabilities-count">{domain.capabilities}</span>
                    </button>
                ))}
            </div>

            {/* Task Input */}
            <div className="task-input-section">
                <div className="input-header">
                    <span className="domain-label" style={{ color: currentDomain.color }}>
                        {currentDomain.icon} {currentDomain.name} Agent
                    </span>
                </div>
                <div className="input-row">
                    <input
                        type="text"
                        placeholder={`Describe your ${currentDomain.name.toLowerCase()} task...`}
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                        disabled={executing}
                    />
                    <button
                        className="execute-btn"
                        onClick={handleExecute}
                        disabled={executing || !taskInput.trim()}
                        style={{ background: currentDomain.color }}
                    >
                        {executing ? '⏳' : '▶️'} Execute
                    </button>
                </div>
            </div>

            {/* Quick Tasks */}
            <div className="quick-tasks">
                <h4>Quick Tasks</h4>
                <div className="quick-task-grid">
                    {getQuickTasks(selectedDomain).map(task => (
                        <button
                            key={task.id}
                            className="quick-task-btn"
                            onClick={() => setTaskInput(task.prompt)}
                        >
                            <span className="task-icon">{task.icon}</span>
                            <span className="task-label">{task.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Result Display */}
            {lastResult && (
                <div className={`result-display ${lastResult.success ? 'success' : 'error'}`}>
                    <div className="result-header">
                        {lastResult.success ? '✅ Success' : '❌ Error'}
                    </div>
                    <pre className="result-content">
                        {JSON.stringify(lastResult, null, 2)}
                    </pre>
                </div>
            )}

            {/* HiveMind Stats */}
            <div className="hivemind-stats">
                <span className="stat">
                    🧠 {hivemind.stats?.localPatterns || 0} patterns learned
                </span>
                <span className="stat">
                    🔍 {hivemind.stats?.queriesMade || 0} queries
                </span>
            </div>
        </div>
    );
};

function getQuickTasks(domain: 'mobile' | 'game' | 'desktop') {
    const tasks = {
        mobile: [
            { id: 'detect', icon: '🔍', label: 'Detect Platform', prompt: 'Detect the mobile platform and framework' },
            { id: 'component', icon: '🧩', label: 'Gen Component', prompt: 'Generate a mobile UI component' },
            { id: 'aso', icon: '📈', label: 'ASO Optimize', prompt: 'Generate app store metadata' },
            { id: 'perf', icon: '⚡', label: 'Analyze Perf', prompt: 'Analyze mobile app performance' },
        ],
        game: [
            { id: 'detect', icon: '🎮', label: 'Detect Engine', prompt: 'Detect the game engine' },
            { id: 'procedural', icon: '🌍', label: 'Procedural Gen', prompt: 'Generate procedural content' },
            { id: 'multiplayer', icon: '👥', label: 'Multiplayer', prompt: 'Design multiplayer architecture' },
            { id: 'balance', icon: '⚖️', label: 'Balance', prompt: 'Analyze game balance' },
        ],
        desktop: [
            { id: 'detect', icon: '🔍', label: 'Detect Framework', prompt: 'Detect the desktop framework' },
            { id: 'installer', icon: '📦', label: 'Gen Installer', prompt: 'Generate installer configuration' },
            { id: 'native', icon: '🔗', label: 'Native Binding', prompt: 'Generate native API bindings' },
            { id: 'cross', icon: '🌐', label: 'Cross-Platform', prompt: 'Analyze cross-platform compatibility' },
        ],
    };
    return tasks[domain];
}

export default DomainAgentTab;
