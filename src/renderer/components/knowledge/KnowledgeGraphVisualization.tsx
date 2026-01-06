/**
 * 🧠 Knowledge Graph Visualization
 * 
 * Interactive visualization of the Project Knowledge Graph showing:
 * - Design decisions with rationales
 * - Requirements and KPIs
 * - Code artifacts and metrics
 * - Temporal history of project evolution
 */

import React, { useState, useEffect } from 'react';

interface KnowledgeNode {
    id: string;
    type: 'decision' | 'requirement' | 'artifact' | 'metric';
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

interface ProjectStats {
    totalNodes: number;
    decisions: number;
    requirements: number;
    artifacts: number;
    metrics: number;
}

interface ProjectContext {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

export const KnowledgeGraphVisualization: React.FC = () => {
    const [projects, setProjects] = useState<ProjectContext[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [history, setHistory] = useState<KnowledgeNode[]>([]);
    const [decisions, setDecisions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'decisions' | 'history' | 'metrics'>('overview');

    const loadProjects = async () => {
        // In production, this would load from the backend
        // For now, we'll show the UI structure
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            setLoading(true);
            const result = await (window as any).shadowAPI.projectKnowledge.createProject(
                newProjectName,
                newProjectDesc
            );
            setProjects([...projects, result]);
            setSelectedProject(result.id);
            setShowCreateModal(false);
            setNewProjectName('');
            setNewProjectDesc('');
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectData = async (projectId: string) => {
        try {
            setLoading(true);

            const [statsResult, historyResult, decisionsResult] = await Promise.all([
                (window as any).shadowAPI.projectKnowledge.getStats(projectId),
                (window as any).shadowAPI.projectKnowledge.getHistory(projectId),
                (window as any).shadowAPI.projectKnowledge.getDecisionHistory(projectId)
            ]);

            setStats(statsResult);
            setHistory(historyResult || []);
            setDecisions(decisionsResult || []);
        } catch (error) {
            console.error('Failed to load project data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            loadProjectData(selectedProject);
        }
    }, [selectedProject]);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
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
                        🧠 Project Knowledge Graph
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Persistent semantic memory for your projects
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        color: '#fff',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    ➕ New Project
                </button>
            </div>

            {/* Project Selector */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                {projects.length === 0 ? (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        flex: 1
                    }}>
                        <p style={{ opacity: 0.6 }}>No projects yet. Create one to get started!</p>
                    </div>
                ) : (
                    projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setSelectedProject(project.id)}
                            style={{
                                background: selectedProject === project.id
                                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 500 }}>{project.name}</div>
                            <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Tab Navigation */}
            {selectedProject && (
                <>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        marginBottom: '20px'
                    }}>
                        {(['overview', 'decisions', 'history', 'metrics'] as const).map(tab => (
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
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner" style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(255,255,255,0.1)',
                                borderTop: '3px solid #6366f1',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto'
                            }} />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && stats && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                                    <StatCard icon="📊" label="Total Nodes" value={stats.totalNodes} />
                                    <StatCard icon="🎯" label="Decisions" value={stats.decisions} color="#10b981" />
                                    <StatCard icon="📋" label="Requirements" value={stats.requirements} color="#f59e0b" />
                                    <StatCard icon="📈" label="Metrics" value={stats.metrics} color="#6366f1" />
                                </div>
                            )}

                            {activeTab === 'decisions' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {decisions.length === 0 ? (
                                        <EmptyState message="No decisions recorded yet" />
                                    ) : (
                                        decisions.map((decision, i) => (
                                            <DecisionCard key={i} decision={decision} />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {history.length === 0 ? (
                                        <EmptyState message="No history yet" />
                                    ) : (
                                        history.map((node, i) => (
                                            <HistoryItem key={i} node={node} />
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'metrics' && (
                                <EmptyState message="Metrics visualization coming soon" />
                            )}
                        </>
                    )}
                </>
            )}

            {/* Create Project Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1a1a2e',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '400px',
                        maxWidth: '90%'
                    }}>
                        <h3 style={{ margin: '0 0 20px' }}>Create New Project</h3>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                marginBottom: '12px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <textarea
                            placeholder="Description (optional)"
                            value={newProjectDesc}
                            onChange={e => setNewProjectDesc(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                marginBottom: '16px',
                                minHeight: '80px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createProject}
                                disabled={!newProjectName.trim() || loading}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 20px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    opacity: !newProjectName.trim() || loading ? 0.5 : 1
                                }}
                            >
                                {loading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: number; color?: string }> = ({
    icon, label, value, color = '#6366f1'
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '20px',
        borderLeft: `3px solid ${color}`
    }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
        <div style={{ fontSize: '28px', fontWeight: 600, color }}>{value}</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>{label}</div>
    </div>
);

const DecisionCard: React.FC<{ decision: any }> = ({ decision }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: '3px solid #10b981'
    }}>
        <div style={{ fontWeight: 500, marginBottom: '8px' }}>
            ❓ {decision.decision?.question || 'Decision'}
        </div>
        <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            padding: '8px 12px',
            borderRadius: '6px',
            marginBottom: '8px'
        }}>
            ✅ {decision.decision?.answer || 'Answer'}
        </div>
        {decision.decision?.rationale && (
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
                💡 {decision.decision.rationale}
            </div>
        )}
    </div>
);

const HistoryItem: React.FC<{ node: KnowledgeNode }> = ({ node }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px'
    }}>
        <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: node.type === 'decision' ? '#10b981' :
                node.type === 'requirement' ? '#f59e0b' : '#6366f1'
        }} />
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px' }}>{node.content}</div>
            <div style={{ fontSize: '12px', opacity: 0.5 }}>
                {new Date(node.timestamp).toLocaleString()}
            </div>
        </div>
        <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            textTransform: 'capitalize'
        }}>
            {node.type}
        </div>
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div style={{
        textAlign: 'center',
        padding: '40px',
        opacity: 0.6
    }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
        <div>{message}</div>
    </div>
);

export default KnowledgeGraphVisualization;
