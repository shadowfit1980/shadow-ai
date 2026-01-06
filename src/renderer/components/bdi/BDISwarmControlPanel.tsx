/**
 * 🐝 BDI Swarm Control Panel
 * 
 * Advanced visualization and control for the BDI Agent Orchestrator:
 * - Agent status and capabilities
 * - Task submission and tracking
 * - Debate visualization
 * - Swarm analytics
 */

import React, { useState, useEffect } from 'react';

interface Agent {
    id: string;
    role: string;
    displayName: string;
    status: 'idle' | 'busy' | 'offline';
    expertise: string[];
    currentTask?: string;
    performance: {
        tasksCompleted: number;
        successRate: number;
    };
}

interface Task {
    id: string;
    description: string;
    status: 'pending' | 'decomposed' | 'bidding' | 'assigned' | 'in_progress' | 'completed' | 'failed';
    assignedAgent?: string;
    steps: any[];
    priority: string;
}

interface Debate {
    id: string;
    topic: string;
    status: 'active' | 'resolved';
    winner?: string;
    participants: { agentRole: string; argument: string }[];
}

interface SwarmStatus {
    totalAgents: number;
    activeAgents: number;
    pendingTasks: number;
    activeTasks: number;
    completedTasks: number;
    activeDebates: number;
}

export const BDISwarmControlPanel: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [debates, setDebates] = useState<Debate[]>([]);
    const [status, setStatus] = useState<SwarmStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
    const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'debates'>('agents');

    const loadData = async () => {
        try {
            setLoading(true);
            const [agentsResult, tasksResult, debatesResult, statusResult] = await Promise.all([
                (window as any).shadowAPI.bdiSwarm?.getAgents() || [],
                (window as any).shadowAPI.bdiSwarm?.getTasks() || [],
                (window as any).shadowAPI.bdiSwarm?.getDebates() || [],
                (window as any).shadowAPI.bdiSwarm?.getSwarmStatus() || null
            ]);
            setAgents(agentsResult);
            setTasks(tasksResult);
            setDebates(debatesResult);
            setStatus(statusResult);
        } catch (error) {
            console.error('Failed to load swarm data:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitTask = async () => {
        if (!newTaskDesc.trim()) return;

        try {
            await (window as any).shadowAPI.bdiSwarm.submitTask(
                newTaskDesc,
                'demo-project',
                newTaskPriority
            );
            setNewTaskDesc('');
            loadData();
        } catch (error) {
            console.error('Failed to submit task:', error);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const getRoleIcon = (role: string) => {
        const icons: Record<string, string> = {
            orchestrator: '🎭',
            requirements_engineer: '📋',
            system_architect: '🏗️',
            frontend_specialist: '🎨',
            backend_specialist: '⚙️',
            security_auditor: '🛡️',
            database_expert: '🗄️',
            devops_engineer: '🔧',
            sre: '📊',
            qa_engineer: '✅',
            performance_engineer: '⚡',
            technical_writer: '📝'
        };
        return icons[role] || '🤖';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'idle': return '#10b981';
            case 'busy': return '#f59e0b';
            case 'offline': return '#6b7280';
            default: return '#6366f1';
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
            borderRadius: '16px',
            padding: '24px',
            minHeight: '600px',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                        🐝 BDI Agent Swarm
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Belief-Desire-Intention based multi-agent orchestration
                    </p>
                </div>
                <button
                    onClick={loadData}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        color: '#fff',
                        cursor: 'pointer'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Status Overview */}
            {status && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <StatusCard label="Total Agents" value={status.totalAgents} icon="🤖" />
                    <StatusCard label="Active" value={status.activeAgents} icon="✨" color="#10b981" />
                    <StatusCard label="Pending Tasks" value={status.pendingTasks} icon="📋" />
                    <StatusCard label="In Progress" value={status.activeTasks} icon="⚡" color="#f59e0b" />
                    <StatusCard label="Completed" value={status.completedTasks} icon="✅" color="#10b981" />
                    <StatusCard label="Active Debates" value={status.activeDebates} icon="⚔️" color="#8b5cf6" />
                </div>
            )}

            {/* Task Submission */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                gap: '12px'
            }}>
                <input
                    type="text"
                    placeholder="Describe a task for the swarm..."
                    value={newTaskDesc}
                    onChange={e => setNewTaskDesc(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff'
                    }}
                    onKeyPress={e => e.key === 'Enter' && submitTask()}
                />
                <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff'
                    }}
                >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <button
                    onClick={submitTask}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    🚀 Submit Task
                </button>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '20px'
            }}>
                {(['agents', 'tasks', 'debates'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                            padding: '12px 20px',
                            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: 500
                        }}
                    >
                        {tab === 'agents' && '🤖 '}{tab === 'tasks' && '📋 '}{tab === 'debates' && '⚔️ '}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {activeTab === 'agents' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '16px'
                        }}>
                            {agents.map(agent => (
                                <AgentCard key={agent.id} agent={agent} getRoleIcon={getRoleIcon} getStatusColor={getStatusColor} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tasks.length === 0 ? (
                                <EmptyState message="No tasks yet. Submit one above!" />
                            ) : (
                                tasks.map(task => <TaskCard key={task.id} task={task} />)
                            )}
                        </div>
                    )}

                    {activeTab === 'debates' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {debates.length === 0 ? (
                                <EmptyState message="No debates yet" />
                            ) : (
                                debates.map(debate => <DebateCard key={debate.id} debate={debate} />)
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const StatusCard: React.FC<{ label: string; value: number; icon: string; color?: string }> = ({
    label, value, icon, color = '#6366f1'
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        padding: '12px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
        <div style={{ fontSize: '20px', fontWeight: 600, color }}>{value}</div>
        <div style={{ fontSize: '11px', opacity: 0.6 }}>{label}</div>
    </div>
);

const AgentCard: React.FC<{
    agent: Agent;
    getRoleIcon: (role: string) => string;
    getStatusColor: (status: string) => string;
}> = ({ agent, getRoleIcon, getStatusColor }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: `3px solid ${getStatusColor(agent.status)}`
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ fontSize: '24px' }}>{getRoleIcon(agent.role)}</div>
                <div>
                    <div style={{ fontWeight: 500 }}>{agent.displayName}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7, textTransform: 'capitalize' }}>
                        {agent.role.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: getStatusColor(agent.status)
            }} />
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {agent.expertise.slice(0, 3).map((e, i) => (
                <span key={i} style={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px'
                }}>
                    {e}
                </span>
            ))}
            {agent.expertise.length > 3 && (
                <span style={{ fontSize: '10px', opacity: 0.6 }}>+{agent.expertise.length - 3}</span>
            )}
        </div>

        <div style={{ fontSize: '12px', opacity: 0.7 }}>
            {agent.performance.tasksCompleted} tasks • {(agent.performance.successRate * 100).toFixed(0)}% success
        </div>
    </div>
);

const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontWeight: 500 }}>{task.description}</div>
            <div style={{
                background: task.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' :
                    task.status === 'in_progress' ? 'rgba(245, 158, 11, 0.2)' :
                        'rgba(99, 102, 241, 0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'capitalize'
            }}>
                {task.status.replace(/_/g, ' ')}
            </div>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Priority: {task.priority} • Steps: {task.steps.length}
            {task.assignedAgent && ` • Agent: ${task.assignedAgent}`}
        </div>
    </div>
);

const DebateCard: React.FC<{ debate: Debate }> = ({ debate }) => (
    <div style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '12px',
        padding: '16px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontWeight: 500 }}>⚔️ {debate.topic}</div>
            <div style={{
                background: debate.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                {debate.status}
            </div>
        </div>
        {debate.participants.map((p, i) => (
            <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '8px',
                borderLeft: debate.winner === p.agentRole ? '3px solid #10b981' : 'none'
            }}>
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                    {p.agentRole.replace(/_/g, ' ')}
                    {debate.winner === p.agentRole && ' 🏆'}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>{p.argument}</div>
            </div>
        ))}
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
        <div>{message}</div>
    </div>
);

const LoadingSpinner: React.FC = () => (
    <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
);

export default BDISwarmControlPanel;
