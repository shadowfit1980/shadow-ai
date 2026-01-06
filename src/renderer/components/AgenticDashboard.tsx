/**
 * Agentic Dashboard
 * 
 * Real-time visualization of agentic loops, goals, terminal output,
 * git operations, and evolution status.
 */

import React, { useState, useEffect, useCallback } from 'react';

interface Goal {
    id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    priority: string;
    subGoals: Goal[];
}

interface ExecutionStep {
    action: string;
    success: boolean;
    timestamp: Date;
}

interface TerminalHistory {
    command: string;
    success: boolean;
    stdout: string;
    stderr: string;
    executionTime: number;
}

interface EvolutionStats {
    totalTasks: number;
    successRate: number;
    learnedPatterns: number;
    improvementScore: number;
}

const AgenticDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'goals' | 'terminal' | 'git' | 'evolution' | 'code'>('goals');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [executionHistory, setExecutionHistory] = useState<ExecutionStep[]>([]);
    const [terminalHistory, setTerminalHistory] = useState<TerminalHistory[]>([]);
    const [evolutionStats, setEvolutionStats] = useState<EvolutionStats | null>(null);
    const [terminalInput, setTerminalInput] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [codeLanguage, setCodeLanguage] = useState('javascript');
    const [codeOutput, setCodeOutput] = useState<{ stdout: string; stderr: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [gitStatus, setGitStatus] = useState<any>(null);

    // Load initial data
    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const api = (window as any).shadowAPI?.agentic;
            if (!api) return;

            const [goalsData, historyData, termHistory, evoStats] = await Promise.all([
                api.getAllGoals?.() || [],
                api.getHistory?.() || [],
                api.terminal?.getHistory?.() || [],
                api.evolution?.getStats?.() || null
            ]);

            setGoals(goalsData);
            setExecutionHistory(historyData);
            setTerminalHistory(termHistory);
            setEvolutionStats(evoStats);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    };

    // Execute terminal command
    const executeTerminalCommand = async () => {
        if (!terminalInput.trim()) return;

        setLoading(true);
        try {
            const api = (window as any).shadowAPI?.agentic?.terminal;
            const result = await api?.execute(terminalInput);

            setTerminalHistory(prev => [...prev, {
                command: terminalInput,
                success: result?.success || false,
                stdout: result?.stdout || '',
                stderr: result?.stderr || '',
                executionTime: result?.executionTime || 0
            }]);
            setTerminalInput('');
        } catch (error) {
            console.error('Terminal execution failed:', error);
        }
        setLoading(false);
    };

    // Execute code
    const executeCode = async () => {
        if (!codeInput.trim()) return;

        setLoading(true);
        setCodeOutput(null);
        try {
            const api = (window as any).shadowAPI?.agentic?.code;
            const result = await api?.execute(codeInput, codeLanguage);
            setCodeOutput({
                stdout: result?.stdout || '',
                stderr: result?.stderr || result?.error || ''
            });
        } catch (error) {
            setCodeOutput({
                stdout: '',
                stderr: (error as Error).message
            });
        }
        setLoading(false);
    };

    // Load git status
    const loadGitStatus = async () => {
        try {
            const api = (window as any).shadowAPI?.agentic?.git;
            const result = await api?.status();
            setGitStatus(result?.status || null);
        } catch (error) {
            console.error('Failed to load git status:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'git') {
            loadGitStatus();
        }
    }, [activeTab]);

    // Render goal tree
    const renderGoal = (goal: Goal, depth = 0) => (
        <div
            key={goal.id}
            style={{
                marginLeft: depth * 20,
                padding: '8px 12px',
                marginBottom: '8px',
                background: goal.status === 'completed' ? 'rgba(34, 197, 94, 0.1)'
                    : goal.status === 'failed' ? 'rgba(239, 68, 68, 0.1)'
                        : goal.status === 'in_progress' ? 'rgba(59, 130, 246, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '6px',
                borderLeft: `3px solid ${goal.status === 'completed' ? '#22c55e'
                        : goal.status === 'failed' ? '#ef4444'
                            : goal.status === 'in_progress' ? '#3b82f6'
                                : '#6b7280'
                    }`
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{goal.description.slice(0, 60)}...</span>
                <span style={{
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: goal.status === 'completed' ? '#22c55e'
                        : goal.status === 'failed' ? '#ef4444'
                            : goal.status === 'in_progress' ? '#3b82f6'
                                : '#6b7280',
                    color: 'white'
                }}>
                    {goal.progress}%
                </span>
            </div>
            {goal.subGoals?.map(sg => renderGoal(sg, depth + 1))}
        </div>
    );

    return (
        <div style={{
            padding: '20px',
            height: '100%',
            overflow: 'auto',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            color: '#e2e8f0'
        }}>
            <h2 style={{
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#f1f5f9'
            }}>
                🤖 Agentic Dashboard
            </h2>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px'
            }}>
                {(['goals', 'terminal', 'git', 'evolution', 'code'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px',
                            background: activeTab === tab
                                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: activeTab === tab ? 600 : 400,
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'goals' && '🎯 '}
                        {tab === 'terminal' && '💻 '}
                        {tab === 'git' && '📦 '}
                        {tab === 'evolution' && '🧬 '}
                        {tab === 'code' && '⚡ '}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Goals Tab */}
            {activeTab === 'goals' && (
                <div>
                    <h3 style={{ marginBottom: '16px', color: '#94a3b8' }}>Active Goals</h3>
                    {goals.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No active goals. Start an agentic task to see goals here.</p>
                    ) : (
                        goals.map(goal => renderGoal(goal))
                    )}

                    <h3 style={{ marginTop: '24px', marginBottom: '16px', color: '#94a3b8' }}>Execution History</h3>
                    <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                        {executionHistory.slice(-20).reverse().map((step, i) => (
                            <div key={i} style={{
                                padding: '8px 12px',
                                marginBottom: '4px',
                                background: step.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '4px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>{step.success ? '✅' : '❌'}</span>
                                <span>{step.action.slice(0, 80)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Terminal Tab */}
            {activeTab === 'terminal' && (
                <div>
                    <div style={{
                        background: '#0d1117',
                        borderRadius: '8px',
                        padding: '16px',
                        fontFamily: 'monospace',
                        maxHeight: '400px',
                        overflow: 'auto',
                        marginBottom: '16px'
                    }}>
                        {terminalHistory.map((item, i) => (
                            <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ color: '#58a6ff' }}>$ {item.command}</div>
                                {item.stdout && (
                                    <pre style={{ color: '#8b949e', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                        {item.stdout}
                                    </pre>
                                )}
                                {item.stderr && (
                                    <pre style={{ color: '#f85149', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                        {item.stderr}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && executeTerminalCommand()}
                            placeholder="Enter command..."
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: '#0d1117',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={executeTerminalCommand}
                            disabled={loading}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            {loading ? '...' : 'Run'}
                        </button>
                    </div>
                </div>
            )}

            {/* Git Tab */}
            {activeTab === 'git' && (
                <div>
                    {!gitStatus ? (
                        <p style={{ color: '#64748b' }}>Loading git status...</p>
                    ) : (
                        <>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '16px'
                            }}>
                                <h4 style={{ marginBottom: '12px', color: '#f1f5f9' }}>
                                    📍 Branch: <span style={{ color: '#3b82f6' }}>{gitStatus.branch}</span>
                                </h4>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <span>↑ {gitStatus.ahead} ahead</span>
                                    <span>↓ {gitStatus.behind} behind</span>
                                </div>
                            </div>

                            {gitStatus.staged?.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#22c55e', marginBottom: '8px' }}>Staged ({gitStatus.staged.length})</h4>
                                    {gitStatus.staged.map((f: string, i: number) => (
                                        <div key={i} style={{ color: '#22c55e', fontSize: '13px' }}>+ {f}</div>
                                    ))}
                                </div>
                            )}

                            {gitStatus.unstaged?.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>Modified ({gitStatus.unstaged.length})</h4>
                                    {gitStatus.unstaged.map((f: string, i: number) => (
                                        <div key={i} style={{ color: '#f59e0b', fontSize: '13px' }}>M {f}</div>
                                    ))}
                                </div>
                            )}

                            {gitStatus.untracked?.length > 0 && (
                                <div>
                                    <h4 style={{ color: '#64748b', marginBottom: '8px' }}>Untracked ({gitStatus.untracked.length})</h4>
                                    {gitStatus.untracked.slice(0, 10).map((f: string, i: number) => (
                                        <div key={i} style={{ color: '#64748b', fontSize: '13px' }}>? {f}</div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Evolution Tab */}
            {activeTab === 'evolution' && (
                <div>
                    {evolutionStats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px',
                            marginBottom: '20px'
                        }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                                    {evolutionStats.totalTasks}
                                </div>
                                <div style={{ color: '#94a3b8', marginTop: '4px' }}>Total Tasks</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                                    {(evolutionStats.successRate * 100).toFixed(1)}%
                                </div>
                                <div style={{ color: '#94a3b8', marginTop: '4px' }}>Success Rate</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                    {evolutionStats.learnedPatterns}
                                </div>
                                <div style={{ color: '#94a3b8', marginTop: '4px' }}>Learned Patterns</div>
                            </div>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                                    {(evolutionStats.improvementScore * 100).toFixed(0)}%
                                </div>
                                <div style={{ color: '#94a3b8', marginTop: '4px' }}>Improvement Score</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Code Execution Tab */}
            {activeTab === 'code' && (
                <div>
                    <div style={{ marginBottom: '12px' }}>
                        <select
                            value={codeLanguage}
                            onChange={(e) => setCodeLanguage(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: 'white'
                            }}
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="shell">Shell</option>
                        </select>
                    </div>

                    <textarea
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Enter code to execute..."
                        style={{
                            width: '100%',
                            height: '200px',
                            padding: '12px',
                            background: '#0d1117',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#e6edf3',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            resize: 'vertical'
                        }}
                    />

                    <button
                        onClick={executeCode}
                        disabled={loading}
                        style={{
                            marginTop: '12px',
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {loading ? 'Executing...' : '▶ Execute'}
                    </button>

                    {codeOutput && (
                        <div style={{
                            marginTop: '16px',
                            background: '#0d1117',
                            borderRadius: '8px',
                            padding: '16px',
                            fontFamily: 'monospace'
                        }}>
                            {codeOutput.stdout && (
                                <pre style={{ color: '#8b949e', whiteSpace: 'pre-wrap' }}>
                                    {codeOutput.stdout}
                                </pre>
                            )}
                            {codeOutput.stderr && (
                                <pre style={{ color: '#f85149', whiteSpace: 'pre-wrap' }}>
                                    {codeOutput.stderr}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AgenticDashboard;
