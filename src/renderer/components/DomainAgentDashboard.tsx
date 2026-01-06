/**
 * DomainAgentDashboard
 * 
 * Dashboard component showing status and capabilities of domain-specific agents
 */

import React, { useState, useEffect } from 'react';
import { useMobileAgent, useGameAgent, useDesktopAgent, useHiveMind, useSimulator } from '../hooks/useDomainAgents';
import './DomainAgentDashboard.css';

interface AgentStatus {
    name: string;
    type: 'mobile' | 'game' | 'desktop';
    icon: string;
    capabilities: number;
    status: 'ready' | 'busy' | 'error';
}

export const DomainAgentDashboard: React.FC = () => {
    const mobile = useMobileAgent();
    const game = useGameAgent();
    const desktop = useDesktopAgent();
    const hivemind = useHiveMind();
    const simulator = useSimulator();

    const [activeTab, setActiveTab] = useState<'agents' | 'hivemind' | 'simulator'>('agents');

    const agents: AgentStatus[] = [
        {
            name: 'Mobile Agent',
            type: 'mobile',
            icon: '📱',
            capabilities: mobile.capabilities.length,
            status: mobile.loading ? 'busy' : 'ready'
        },
        {
            name: 'Game Agent',
            type: 'game',
            icon: '🎮',
            capabilities: game.capabilities.length,
            status: game.loading ? 'busy' : 'ready'
        },
        {
            name: 'Desktop Agent',
            type: 'desktop',
            icon: '🖥️',
            capabilities: desktop.capabilities.length,
            status: desktop.loading ? 'busy' : 'ready'
        }
    ];

    return (
        <div className="domain-dashboard">
            <div className="dashboard-header">
                <h2>🚀 Domain Agents</h2>
                <div className="tab-buttons">
                    <button
                        className={activeTab === 'agents' ? 'active' : ''}
                        onClick={() => setActiveTab('agents')}
                    >
                        Agents
                    </button>
                    <button
                        className={activeTab === 'hivemind' ? 'active' : ''}
                        onClick={() => setActiveTab('hivemind')}
                    >
                        HiveMind
                    </button>
                    <button
                        className={activeTab === 'simulator' ? 'active' : ''}
                        onClick={() => setActiveTab('simulator')}
                    >
                        Simulator
                    </button>
                </div>
            </div>

            {activeTab === 'agents' && (
                <div className="agents-grid">
                    {agents.map(agent => (
                        <AgentCard key={agent.type} agent={agent} />
                    ))}
                </div>
            )}

            {activeTab === 'hivemind' && (
                <HiveMindPanel stats={hivemind.stats} onQuery={hivemind.query} />
            )}

            {activeTab === 'simulator' && (
                <SimulatorPanel stats={simulator.stats} onRunTest={simulator.runLoadTest} />
            )}
        </div>
    );
};

// Agent Card Component
const AgentCard: React.FC<{ agent: AgentStatus }> = ({ agent }) => {
    return (
        <div className={`agent-card ${agent.status}`}>
            <div className="agent-icon">{agent.icon}</div>
            <h3>{agent.name}</h3>
            <div className="agent-stats">
                <span className="capabilities">{agent.capabilities} capabilities</span>
                <span className={`status ${agent.status}`}>
                    {agent.status === 'ready' ? '● Ready' : agent.status === 'busy' ? '◌ Busy' : '✗ Error'}
                </span>
            </div>
        </div>
    );
};

// HiveMind Panel Component
const HiveMindPanel: React.FC<{
    stats: any;
    onQuery: (problem: string) => Promise<any>;
}> = ({ stats, onQuery }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const handleQuery = async () => {
        if (!query.trim()) return;
        const matches = await onQuery(query);
        setResults(matches || []);
    };

    return (
        <div className="hivemind-panel">
            <div className="stats-row">
                <div className="stat">
                    <span className="value">{stats?.localPatterns || 0}</span>
                    <span className="label">Patterns</span>
                </div>
                <div className="stat">
                    <span className="value">{stats?.queriesMade || 0}</span>
                    <span className="label">Queries</span>
                </div>
                <div className="stat">
                    <span className="value">{stats?.successfulMatches || 0}</span>
                    <span className="label">Matches</span>
                </div>
            </div>

            <div className="query-section">
                <input
                    type="text"
                    placeholder="Search patterns..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                />
                <button onClick={handleQuery}>Query</button>
            </div>

            {results.length > 0 && (
                <div className="results">
                    {results.map((r, i) => (
                        <div key={i} className="result-item">
                            <div className="relevance">{Math.round(r.relevance * 100)}%</div>
                            <div className="solution">{r.adaptedSolution}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Simulator Panel Component
const SimulatorPanel: React.FC<{
    stats: any;
    onRunTest: (options: any) => Promise<any>;
}> = ({ stats, onRunTest }) => {
    const [testConfig, setTestConfig] = useState({
        targetUrl: 'http://localhost:3000',
        requestsPerSecond: 10,
        duration: 5000
    });
    const [result, setResult] = useState<any>(null);

    const handleRunTest = async () => {
        const res = await onRunTest(testConfig);
        setResult(res);
    };

    return (
        <div className="simulator-panel">
            <div className="stats-row">
                <div className="stat">
                    <span className="value">{stats?.totalSimulations || 0}</span>
                    <span className="label">Simulations</span>
                </div>
                <div className="stat">
                    <span className="value">{stats?.activeSimulations || 0}</span>
                    <span className="label">Active</span>
                </div>
                <div className="stat">
                    <span className="value">{((1 - (stats?.avgErrorRate || 0)) * 100).toFixed(1)}%</span>
                    <span className="label">Success Rate</span>
                </div>
            </div>

            <div className="test-config">
                <h4>Load Test</h4>
                <div className="config-row">
                    <label>Target URL</label>
                    <input
                        type="text"
                        value={testConfig.targetUrl}
                        onChange={(e) => setTestConfig({ ...testConfig, targetUrl: e.target.value })}
                    />
                </div>
                <div className="config-row">
                    <label>RPS</label>
                    <input
                        type="number"
                        value={testConfig.requestsPerSecond}
                        onChange={(e) => setTestConfig({ ...testConfig, requestsPerSecond: Number(e.target.value) })}
                    />
                </div>
                <button onClick={handleRunTest}>Run Test</button>
            </div>

            {result && (
                <div className="test-result">
                    <h4>Results</h4>
                    <div className="metrics">
                        <span>Requests: {result.metrics?.requestCount}</span>
                        <span>P50: {result.metrics?.p50Latency}ms</span>
                        <span>P95: {result.metrics?.p95Latency}ms</span>
                        <span>Errors: {(result.metrics?.errorRate * 100).toFixed(1)}%</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DomainAgentDashboard;
