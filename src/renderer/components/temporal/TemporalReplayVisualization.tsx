/**
 * ⏰ Temporal Replay Visualization
 * 
 * Interactive time-travel debugging for AI decisions:
 * - Decision timeline visualization
 * - Branching timelines
 * - Replay sessions
 * - Rollback functionality
 */

import React, { useState, useEffect } from 'react';

interface DecisionPoint {
    id: string;
    timestamp: string;
    agent: string;
    action: string;
    decision: {
        type: string;
        choice: string;
        reasoning: string;
        confidence: number;
    };
    outcome?: {
        success: boolean;
        error?: string;
    };
}

interface Timeline {
    id: string;
    name: string;
    status: string;
    decisionCount: number;
}

export const TemporalReplayVisualization: React.FC = () => {
    const [projectId] = useState('demo-project');
    const [decisions, setDecisions] = useState<DecisionPoint[]>([]);
    const [timelines, setTimelines] = useState<Timeline[]>([]);
    const [selectedDecision, setSelectedDecision] = useState<DecisionPoint | null>(null);
    const [replaySession, setReplaySession] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'timeline' | 'grid'>('timeline');

    const loadData = async () => {
        try {
            setLoading(true);
            const [decisionsResult, visualResult] = await Promise.all([
                (window as any).shadowAPI.temporalReplay?.getDecisionHistory(projectId, 50) || [],
                (window as any).shadowAPI.temporalReplay?.getVisualization(projectId) || { timelines: [] }
            ]);
            setDecisions(decisionsResult);
            setTimelines(visualResult.timelines || []);
        } catch (error) {
            console.error('Failed to load temporal data:', error);
        } finally {
            setLoading(false);
        }
    };

    const startReplay = async (decisionId: string) => {
        try {
            const session = await (window as any).shadowAPI.temporalReplay.startReplay(decisionId);
            setReplaySession(session.id);
        } catch (error) {
            console.error('Failed to start replay:', error);
        }
    };

    const rollback = async (decisionId: string) => {
        if (!confirm('Are you sure you want to rollback to this decision?')) return;

        try {
            setLoading(true);
            await (window as any).shadowAPI.temporalReplay.rollbackToDecision(decisionId);
            loadData();
        } catch (error) {
            console.error('Failed to rollback:', error);
        } finally {
            setLoading(false);
        }
    };

    const analyzeFailure = async (decisionId: string) => {
        try {
            const analysis = await (window as any).shadowAPI.temporalReplay.analyzeFailure(decisionId);
            alert(`Root Cause Analysis:\n\n${analysis.possibleCauses.join('\n')}\n\nSuggested Fixes:\n${analysis.suggestedFixes.join('\n')}`);
        } catch (error) {
            console.error('Failed to analyze failure:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [projectId]);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2d1b4e 100%)',
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
                        ⏰ Temporal Replay Engine
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Time-travel through AI decisions
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setView('timeline')}
                        style={{
                            background: view === 'timeline' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setView('grid')}
                        style={{
                            background: view === 'grid' ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Grid
                    </button>
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
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <StatCard
                    icon="📊"
                    label="Total Decisions"
                    value={decisions.length}
                />
                <StatCard
                    icon="✅"
                    label="Successful"
                    value={decisions.filter(d => d.outcome?.success).length}
                    color="#10b981"
                />
                <StatCard
                    icon="❌"
                    label="Failed"
                    value={decisions.filter(d => d.outcome?.success === false).length}
                    color="#ef4444"
                />
                <StatCard
                    icon="🌿"
                    label="Timelines"
                    value={timelines.length}
                    color="#8b5cf6"
                />
            </div>

            {/* Timelines */}
            {timelines.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', opacity: 0.8 }}>
                        🌿 Active Timelines
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {timelines.map(timeline => (
                            <div
                                key={timeline.id}
                                style={{
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '8px',
                                    padding: '12px 16px'
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>{timeline.name}</div>
                                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                                    {timeline.decisionCount} decisions • {timeline.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTop: '3px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <div style={{ opacity: 0.6 }}>Loading temporal data...</div>
                </div>
            ) : view === 'timeline' ? (
                <TimelineView
                    decisions={decisions}
                    onSelect={setSelectedDecision}
                    onReplay={startReplay}
                    onRollback={rollback}
                    onAnalyze={analyzeFailure}
                />
            ) : (
                <GridView
                    decisions={decisions}
                    onSelect={setSelectedDecision}
                />
            )}

            {/* Decision Detail Modal */}
            {selectedDecision && (
                <DecisionDetailModal
                    decision={selectedDecision}
                    onClose={() => setSelectedDecision(null)}
                    onReplay={() => startReplay(selectedDecision.id)}
                    onRollback={() => rollback(selectedDecision.id)}
                />
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
    icon, label, value, color = '#8b5cf6'
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: `3px solid ${color}`
    }}>
        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
        <div style={{ fontSize: '24px', fontWeight: 600, color }}>{value}</div>
        <div style={{ fontSize: '12px', opacity: 0.6 }}>{label}</div>
    </div>
);

const TimelineView: React.FC<{
    decisions: DecisionPoint[];
    onSelect: (d: DecisionPoint) => void;
    onReplay: (id: string) => void;
    onRollback: (id: string) => void;
    onAnalyze: (id: string) => void;
}> = ({ decisions, onSelect, onReplay, onRollback, onAnalyze }) => (
    <div style={{ position: 'relative', paddingLeft: '30px' }}>
        {/* Timeline line */}
        <div style={{
            position: 'absolute',
            left: '10px',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(to bottom, #8b5cf6, #6366f1)'
        }} />

        {decisions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏰</div>
                <div>No decisions recorded yet</div>
            </div>
        ) : (
            decisions.map((decision, i) => (
                <div
                    key={decision.id}
                    style={{
                        position: 'relative',
                        marginBottom: '16px',
                        paddingLeft: '20px'
                    }}
                >
                    {/* Timeline dot */}
                    <div style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '20px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: decision.outcome?.success === false ? '#ef4444' :
                            decision.outcome?.success ? '#10b981' : '#8b5cf6',
                        border: '2px solid #1e1e2e'
                    }} />

                    <div
                        onClick={() => onSelect(decision)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: '1px solid transparent'
                        }}
                        onMouseEnter={e => {
                            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                            (e.target as HTMLElement).style.borderColor = 'rgba(139, 92, 246, 0.3)';
                        }}
                        onMouseLeave={e => {
                            (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                            (e.target as HTMLElement).style.borderColor = 'transparent';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                                    {decision.action}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>
                                    {decision.decision.choice}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: 'rgba(139, 92, 246, 0.2)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {decision.agent}
                                    </span>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {(decision.decision.confidence * 100).toFixed(0)}% confidence
                                    </span>
                                    {decision.outcome && (
                                        <span style={{
                                            background: decision.outcome.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {decision.outcome.success ? '✅ Success' : '❌ Failed'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReplay(decision.id); }}
                                    title="Replay from here"
                                    style={{
                                        background: 'rgba(139, 92, 246, 0.2)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ▶️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRollback(decision.id); }}
                                    title="Rollback to here"
                                    style={{
                                        background: 'rgba(251, 146, 60, 0.2)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '6px 10px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    ⏪
                                </button>
                                {decision.outcome?.success === false && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onAnalyze(decision.id); }}
                                        title="Analyze failure"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        🔍
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
                            {new Date(decision.timestamp).toLocaleString()}
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

const GridView: React.FC<{
    decisions: DecisionPoint[];
    onSelect: (d: DecisionPoint) => void;
}> = ({ decisions, onSelect }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
    }}>
        {decisions.map(decision => (
            <div
                key={decision.id}
                onClick={() => onSelect(decision)}
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${decision.outcome?.success === false ? '#ef4444' :
                            decision.outcome?.success ? '#10b981' : '#8b5cf6'
                        }`
                }}
            >
                <div style={{ fontWeight: 500, marginBottom: '8px' }}>{decision.action}</div>
                <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>
                    {decision.decision.choice.substring(0, 80)}...
                </div>
                <div style={{ fontSize: '12px', opacity: 0.5 }}>
                    {decision.agent} • {new Date(decision.timestamp).toLocaleString()}
                </div>
            </div>
        ))}
    </div>
);

const DecisionDetailModal: React.FC<{
    decision: DecisionPoint;
    onClose: () => void;
    onReplay: () => void;
    onRollback: () => void;
}> = ({ decision, onClose, onReplay, onRollback }) => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}
        onClick={onClose}
    >
        <div
            style={{
                background: '#1e1e2e',
                borderRadius: '16px',
                padding: '24px',
                width: '600px',
                maxWidth: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Decision Details</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        fontSize: '20px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Action</label>
                <div style={{ fontWeight: 500 }}>{decision.action}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Agent</label>
                <div>{decision.agent}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Choice</label>
                <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    {decision.decision.choice}
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Reasoning</label>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                    {decision.decision.reasoning}
                </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Confidence</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        flex: 1,
                        height: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${decision.decision.confidence * 100}%`,
                            height: '100%',
                            background: '#8b5cf6'
                        }} />
                    </div>
                    <span>{(decision.decision.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>

            {decision.outcome && (
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', opacity: 0.6, fontSize: '12px', marginBottom: '4px' }}>Outcome</label>
                    <div style={{
                        background: decision.outcome.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        padding: '12px',
                        borderRadius: '8px'
                    }}>
                        {decision.outcome.success ? '✅ Success' : `❌ Failed: ${decision.outcome.error || 'Unknown error'}`}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                    onClick={onReplay}
                    style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    ▶️ Replay from Here
                </button>
                <button
                    onClick={onRollback}
                    style={{
                        flex: 1,
                        background: 'rgba(251, 146, 60, 0.2)',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    ⏪ Rollback to Here
                </button>
            </div>
        </div>
    </div>
);

export default TemporalReplayVisualization;
