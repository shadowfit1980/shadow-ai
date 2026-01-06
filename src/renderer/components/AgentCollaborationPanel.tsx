/**
 * Agent Collaboration Panel
 * 
 * UI for multi-agent collaboration features:
 * - Debate between agents
 * - Parallel execution
 * - View collaboration results
 */

import React, { useState } from 'react';
import { useAgentCollaboration } from '../hooks/useKimiK2';
import './AgentCollaborationPanel.css';

const AVAILABLE_AGENTS = [
    { id: 'ArchitectAgent', name: 'Architect', emoji: '🏗️' },
    { id: 'SecurityAgent', name: 'Security', emoji: '🔐' },
    { id: 'PerformanceAgent', name: 'Performance', emoji: '⚡' },
    { id: 'TestWriterAgent', name: 'Test Writer', emoji: '🧪' },
    { id: 'RefactorAgent', name: 'Refactor', emoji: '♻️' },
    { id: 'APIArchitect', name: 'API Architect', emoji: '🔌' },
    { id: 'DatabaseAgent', name: 'Database', emoji: '💾' },
    { id: 'AccessibilityAgent', name: 'Accessibility', emoji: '♿' },
];

export const AgentCollaborationPanel: React.FC = () => {
    const { loading, result, debate, parallelExecute } = useAgentCollaboration();

    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    const [topic, setTopic] = useState('');
    const [mode, setMode] = useState<'debate' | 'parallel'>('debate');

    const toggleAgent = (agentId: string) => {
        setSelectedAgents(prev =>
            prev.includes(agentId)
                ? prev.filter(id => id !== agentId)
                : [...prev, agentId]
        );
    };

    const handleSubmit = async () => {
        if (selectedAgents.length < 2) {
            alert('Select at least 2 agents');
            return;
        }
        if (!topic.trim()) {
            alert('Enter a topic or task');
            return;
        }

        if (mode === 'debate') {
            await debate(topic, selectedAgents);
        } else {
            await parallelExecute(selectedAgents, { task: topic, spec: '' });
        }
    };

    return (
        <div className="collab-panel">
            <header className="collab-header">
                <h2>🤝 Agent Collaboration</h2>
                <p>Have multiple AI agents work together</p>
            </header>

            {/* Mode Selection */}
            <div className="mode-toggle">
                <button
                    className={mode === 'debate' ? 'active' : ''}
                    onClick={() => setMode('debate')}
                >
                    💬 Debate
                </button>
                <button
                    className={mode === 'parallel' ? 'active' : ''}
                    onClick={() => setMode('parallel')}
                >
                    ⚡ Parallel Execute
                </button>
            </div>

            {/* Agent Selection */}
            <div className="agent-selection">
                <h3>Select Agents ({selectedAgents.length} selected)</h3>
                <div className="agent-grid">
                    {AVAILABLE_AGENTS.map(agent => (
                        <button
                            key={agent.id}
                            className={`agent-chip ${selectedAgents.includes(agent.id) ? 'selected' : ''}`}
                            onClick={() => toggleAgent(agent.id)}
                        >
                            <span className="agent-emoji">{agent.emoji}</span>
                            <span className="agent-name">{agent.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Topic Input */}
            <div className="topic-input">
                <label>
                    {mode === 'debate' ? 'Debate Topic' : 'Task Description'}
                </label>
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={
                        mode === 'debate'
                            ? "e.g., What's the best authentication approach for our app?"
                            : "e.g., Analyze the codebase for improvements"
                    }
                    rows={3}
                />
            </div>

            {/* Submit Button */}
            <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading || selectedAgents.length < 2 || !topic.trim()}
            >
                {loading ? '⟳ Processing...' : mode === 'debate' ? '🎯 Start Debate' : '🚀 Execute'}
            </button>

            {/* Results */}
            {result && (
                <div className="collab-result">
                    <h3>Result</h3>
                    {result.consensus && (
                        <div className="consensus-section">
                            <div className={`consensus-badge ${result.consensus.agreed ? 'agreed' : 'disagreed'}`}>
                                {result.consensus.agreed ? '✅ Consensus Reached' : '⚠️ No Consensus'}
                            </div>
                            <p className="confidence">
                                Confidence: {(result.consensus.confidence * 100).toFixed(0)}%
                            </p>
                            <div className="supporting-agents">
                                Supporting: {result.consensus.supportingAgents.join(', ')}
                            </div>
                            {result.consensus.finalDecision && (
                                <div className="final-decision">
                                    <strong>Decision:</strong>
                                    <pre>{JSON.stringify(result.consensus.finalDecision, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                    {result.results && (
                        <div className="parallel-results">
                            <strong>Agent Results:</strong>
                            <pre>{JSON.stringify(Object.fromEntries(result.results), null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AgentCollaborationPanel;
