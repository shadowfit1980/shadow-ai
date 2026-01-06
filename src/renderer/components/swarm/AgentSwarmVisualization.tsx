/**
 * 🐝 AgentSwarmVisualization - Real-Time Agent Swarm Visualization
 * 
 * Displays live agent swarm activity:
 * - Agent network graph
 * - Task bidding in real-time
 * - Agent debates and decisions
 * - Performance metrics
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface Agent {
    id: string;
    name: string;
    specialization: string;
    status: 'idle' | 'working' | 'bidding' | 'debating';
    currentTask?: string;
    confidence: number;
    position: { x: number; y: number };
}

interface Task {
    id: string;
    description: string;
    status: 'pending' | 'bidding' | 'assigned' | 'completed';
    assignedTo?: string;
    bids: { agentId: string; confidence: number; reasoning: string }[];
}

interface Debate {
    id: string;
    topic: string;
    participants: string[];
    arguments: { agentId: string; position: string; points: string[] }[];
    consensus?: string;
    status: 'active' | 'resolved';
}

interface SwarmState {
    agents: Agent[];
    tasks: Task[];
    debates: Debate[];
    activeConnections: { from: string; to: string; type: string }[];
}

export const AgentSwarmVisualization: React.FC = () => {
    const [swarmState, setSwarmState] = useState<SwarmState>({
        agents: [],
        tasks: [],
        debates: [],
        activeConnections: []
    });
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [view, setView] = useState<'network' | 'tasks' | 'debates'>('network');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const loadSwarmState = async () => {
        try {
            const result = await (window as any).shadowAPI?.agentSwarm?.getState?.();
            if (result?.success) {
                setSwarmState(result.state);
            } else {
                // Mock data for visualization
                setSwarmState(generateMockSwarmState());
            }
        } catch (err) {
            console.error('Failed to load swarm state:', err);
            setSwarmState(generateMockSwarmState());
        }
    };

    const generateMockSwarmState = (): SwarmState => {
        const agents: Agent[] = [
            { id: 'architect', name: 'Architect', specialization: 'System Design', status: 'working', confidence: 0.92, position: { x: 200, y: 150 } },
            { id: 'coder', name: 'Coder', specialization: 'Implementation', status: 'bidding', confidence: 0.88, position: { x: 350, y: 100 } },
            { id: 'reviewer', name: 'Reviewer', specialization: 'Code Review', status: 'idle', confidence: 0.85, position: { x: 350, y: 200 } },
            { id: 'tester', name: 'Tester', specialization: 'Testing', status: 'debating', confidence: 0.90, position: { x: 500, y: 150 } },
            { id: 'deployer', name: 'Deployer', specialization: 'Deployment', status: 'idle', confidence: 0.82, position: { x: 450, y: 250 } },
            { id: 'optimizer', name: 'Optimizer', specialization: 'Performance', status: 'working', confidence: 0.87, position: { x: 250, y: 250 } }
        ];

        const tasks: Task[] = [
            {
                id: 'task-1',
                description: 'Implement user authentication',
                status: 'assigned',
                assignedTo: 'architect',
                bids: [
                    { agentId: 'architect', confidence: 0.95, reasoning: 'Strong security background' },
                    { agentId: 'coder', confidence: 0.80, reasoning: 'Can implement quickly' }
                ]
            },
            {
                id: 'task-2',
                description: 'Optimize database queries',
                status: 'bidding',
                bids: [
                    { agentId: 'optimizer', confidence: 0.92, reasoning: 'Performance specialist' },
                    { agentId: 'coder', confidence: 0.75, reasoning: 'General implementation skills' }
                ]
            }
        ];

        const debates: Debate[] = [
            {
                id: 'debate-1',
                topic: 'Testing strategy: Unit vs Integration',
                participants: ['tester', 'architect'],
                arguments: [
                    { agentId: 'tester', position: 'Integration first', points: ['Catches more bugs', 'More realistic'] },
                    { agentId: 'architect', position: 'Unit first', points: ['Faster feedback', 'Easier to debug'] }
                ],
                status: 'active'
            }
        ];

        return {
            agents,
            tasks,
            debates,
            activeConnections: [
                { from: 'architect', to: 'coder', type: 'delegation' },
                { from: 'tester', to: 'architect', type: 'debate' }
            ]
        };
    };

    const drawNetwork = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        swarmState.activeConnections.forEach(conn => {
            const from = swarmState.agents.find(a => a.id === conn.from);
            const to = swarmState.agents.find(a => a.id === conn.to);
            if (from && to) {
                ctx.beginPath();
                ctx.moveTo(from.position.x, from.position.y);
                ctx.lineTo(to.position.x, to.position.y);
                ctx.strokeStyle = conn.type === 'debate' ? '#F59E0B' : '#3B82F6';
                ctx.lineWidth = 2;
                ctx.setLineDash(conn.type === 'debate' ? [5, 5] : []);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        // Draw agents
        swarmState.agents.forEach(agent => {
            const { x, y } = agent.position;

            // Status color
            const colors: Record<string, string> = {
                'idle': '#6B7280',
                'working': '#10B981',
                'bidding': '#3B82F6',
                'debating': '#F59E0B'
            };

            // Glow effect for active agents
            if (agent.status !== 'idle') {
                ctx.beginPath();
                ctx.arc(x, y, 35, 0, Math.PI * 2);
                ctx.fillStyle = colors[agent.status] + '30';
                ctx.fill();
            }

            // Agent circle
            ctx.beginPath();
            ctx.arc(x, y, 25, 0, Math.PI * 2);
            ctx.fillStyle = selectedAgent?.id === agent.id ? '#8B5CF6' : colors[agent.status];
            ctx.fill();
            ctx.strokeStyle = '#1F2937';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Confidence ring
            ctx.beginPath();
            ctx.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * agent.confidence));
            ctx.strokeStyle = '#10B981';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Agent initial
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(agent.name[0], x, y);

            // Agent name
            ctx.fillStyle = '#D1D5DB';
            ctx.font = '12px sans-serif';
            ctx.fillText(agent.name, x, y + 45);
        });
    }, [swarmState, selectedAgent]);

    useEffect(() => {
        loadSwarmState();
        const interval = setInterval(loadSwarmState, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (view === 'network') {
            drawNetwork();
        }
    }, [view, swarmState, drawNetwork]);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'idle': '#6B7280',
            'working': '#10B981',
            'bidding': '#3B82F6',
            'debating': '#F59E0B',
            'pending': '#6B7280',
            'assigned': '#10B981',
            'completed': '#8B5CF6',
            'active': '#F59E0B',
            'resolved': '#10B981'
        };
        return colors[status] || '#6B7280';
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>🐝 Agent Swarm</h2>
                <div style={styles.viewToggle}>
                    {(['network', 'tasks', 'debates'] as const).map(v => (
                        <button
                            key={v}
                            style={{
                                ...styles.viewButton,
                                ...(view === v ? styles.viewButtonActive : {})
                            }}
                            onClick={() => setView(v)}
                        >
                            {v === 'network' && '🔗'} {v === 'tasks' && '📋'} {v === 'debates' && '💬'} {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div style={styles.statsBar}>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{swarmState.agents.length}</span>
                    <span style={styles.statLabel}>Agents</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{swarmState.agents.filter(a => a.status === 'working').length}</span>
                    <span style={styles.statLabel}>Working</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{swarmState.tasks.filter(t => t.status === 'bidding').length}</span>
                    <span style={styles.statLabel}>Bidding</span>
                </div>
                <div style={styles.stat}>
                    <span style={styles.statValue}>{swarmState.debates.filter(d => d.status === 'active').length}</span>
                    <span style={styles.statLabel}>Debates</span>
                </div>
            </div>

            {/* Content */}
            <div style={styles.content}>
                {view === 'network' && (
                    <div style={styles.networkView}>
                        <canvas
                            ref={canvasRef}
                            width={700}
                            height={350}
                            style={styles.canvas}
                            onClick={(e) => {
                                const rect = canvasRef.current!.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                const clicked = swarmState.agents.find(a =>
                                    Math.sqrt((a.position.x - x) ** 2 + (a.position.y - y) ** 2) < 30
                                );
                                setSelectedAgent(clicked || null);
                            }}
                        />
                        {selectedAgent && (
                            <div style={styles.agentDetails}>
                                <h4>{selectedAgent.name}</h4>
                                <p>Specialization: {selectedAgent.specialization}</p>
                                <p>Status: <span style={{ color: getStatusColor(selectedAgent.status) }}>{selectedAgent.status}</span></p>
                                <p>Confidence: {(selectedAgent.confidence * 100).toFixed(0)}%</p>
                            </div>
                        )}
                    </div>
                )}

                {view === 'tasks' && (
                    <div style={styles.taskList}>
                        {swarmState.tasks.map(task => (
                            <div key={task.id} style={styles.taskCard} onClick={() => setSelectedTask(task)}>
                                <div style={styles.taskHeader}>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getStatusColor(task.status) + '30',
                                        color: getStatusColor(task.status)
                                    }}>{task.status}</span>
                                    <span style={styles.taskId}>{task.id}</span>
                                </div>
                                <p style={styles.taskDesc}>{task.description}</p>
                                <div style={styles.bidsContainer}>
                                    <strong>Bids ({task.bids.length}):</strong>
                                    {task.bids.map((bid, i) => (
                                        <div key={i} style={styles.bid}>
                                            <span>{swarmState.agents.find(a => a.id === bid.agentId)?.name}</span>
                                            <span>{(bid.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'debates' && (
                    <div style={styles.debateList}>
                        {swarmState.debates.map(debate => (
                            <div key={debate.id} style={styles.debateCard}>
                                <div style={styles.debateHeader}>
                                    <h4>{debate.topic}</h4>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getStatusColor(debate.status) + '30',
                                        color: getStatusColor(debate.status)
                                    }}>{debate.status}</span>
                                </div>
                                <div style={styles.arguments}>
                                    {debate.arguments.map((arg, i) => (
                                        <div key={i} style={styles.argument}>
                                            <div style={styles.argHeader}>
                                                <strong>{swarmState.agents.find(a => a.id === arg.agentId)?.name}</strong>
                                                <span style={styles.position}>{arg.position}</span>
                                            </div>
                                            <ul style={styles.points}>
                                                {arg.points.map((point, j) => (
                                                    <li key={j}>{point}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                {debate.consensus && (
                                    <div style={styles.consensus}>
                                        <strong>Consensus:</strong> {debate.consensus}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111827',
        color: '#F9FAFB',
        borderRadius: '12px',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #374151'
    },
    title: { margin: 0 },
    viewToggle: {
        display: 'flex',
        gap: '4px',
        backgroundColor: '#1F2937',
        padding: '4px',
        borderRadius: '8px'
    },
    viewButton: {
        padding: '8px 16px',
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    viewButtonActive: {
        backgroundColor: '#3B82F6',
        color: 'white'
    },
    statsBar: {
        display: 'flex',
        gap: '24px',
        padding: '12px 20px',
        backgroundColor: '#1F2937'
    },
    stat: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    statValue: {
        fontSize: '20px',
        fontWeight: 'bold'
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: '13px'
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '20px'
    },
    networkView: {
        display: 'flex',
        gap: '20px'
    },
    canvas: {
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        cursor: 'pointer'
    },
    agentDetails: {
        padding: '16px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        minWidth: '200px'
    },
    taskList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    taskCard: {
        padding: '16px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        cursor: 'pointer'
    },
    taskHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        textTransform: 'capitalize'
    },
    taskId: { color: '#6B7280', fontSize: '12px' },
    taskDesc: { margin: '8px 0' },
    bidsContainer: { marginTop: '12px' },
    bid: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: '#374151',
        borderRadius: '4px',
        marginTop: '4px',
        fontSize: '13px'
    },
    debateList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    debateCard: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px'
    },
    debateHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    arguments: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
    },
    argument: {
        padding: '12px',
        backgroundColor: '#374151',
        borderRadius: '8px'
    },
    argHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px'
    },
    position: {
        color: '#F59E0B',
        fontSize: '12px'
    },
    points: {
        margin: 0,
        paddingLeft: '16px',
        fontSize: '13px'
    },
    consensus: {
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#10B981' + '20',
        borderRadius: '8px',
        color: '#10B981'
    }
};

export default AgentSwarmVisualization;
