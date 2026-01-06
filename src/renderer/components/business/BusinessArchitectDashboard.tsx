/**
 * 🏢 Business Architect Dashboard
 * 
 * Business context understanding and BRD generation:
 * - BRD generation from intent
 * - Feasibility validation
 * - Requirements tracking
 * - Risk assessment
 */

import React, { useState, useEffect } from 'react';

interface BRD {
    id: string;
    projectId: string;
    generatedAt: string;
    executiveSummary: string;
    problemStatement: string;
    targetAudience: string[];
    goals: { description: string; kpis: string[] }[];
    features: { name: string; priority: string }[];
    risks: { description: string; severity: string; mitigation: string }[];
    estimatedTimeline: string;
    estimatedCost: string;
}

interface FeasibilityResult {
    overall: string;
    score: number;
    technical: { score: number; challenges: string[] };
    business: { score: number; challenges: string[] };
    resource: { score: number; challenges: string[] };
    recommendation: string;
}

export const BusinessArchitectDashboard: React.FC = () => {
    const [brds, setBrds] = useState<BRD[]>([]);
    const [selectedBrd, setSelectedBrd] = useState<BRD | null>(null);
    const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [projectDesc, setProjectDesc] = useState('');

    const loadBRDs = async () => {
        try {
            setLoading(true);
            const result = await (window as any).shadowAPI.businessArchitect?.getAllBRDs('demo-project') || [];
            setBrds(result);
        } catch (error) {
            console.error('Failed to load BRDs:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateBRD = async () => {
        if (!projectDesc.trim()) return;

        try {
            setGenerating(true);
            // First parse intent
            const intent = await (window as any).shadowAPI.intentAlignment.parse(projectDesc);
            // Then generate BRD
            const brd = await (window as any).shadowAPI.businessArchitect.generateBRD(intent, 'demo-project');
            setBrds([brd, ...brds]);
            setSelectedBrd(brd);
            setProjectDesc('');
        } catch (error) {
            console.error('Failed to generate BRD:', error);
        } finally {
            setGenerating(false);
        }
    };

    const validateFeasibility = async (brd: BRD) => {
        try {
            const result = await (window as any).shadowAPI.businessArchitect.validateFeasibility(brd);
            setFeasibility(result);
        } catch (error) {
            console.error('Failed to validate feasibility:', error);
        }
    };

    useEffect(() => {
        loadBRDs();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return '#10b981';
        if (score >= 0.6) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2a4a 100%)',
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
                        🏢 Business-Aware Architect
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Generate BRDs and validate project feasibility
                    </p>
                </div>
                <button
                    onClick={loadBRDs}
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

            {/* Generate BRD */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Generate Business Requirements Document</h3>
                <textarea
                    placeholder="Describe your project idea... (e.g., 'Build a fintech mobile app for peer-to-peer payments')"
                    value={projectDesc}
                    onChange={e => setProjectDesc(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        marginBottom: '12px'
                    }}
                />
                <button
                    onClick={generateBRD}
                    disabled={generating || !projectDesc.trim()}
                    style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 500,
                        opacity: generating || !projectDesc.trim() ? 0.5 : 1
                    }}
                >
                    {generating ? '📝 Generating BRD...' : '📝 Generate BRD'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* BRD List */}
                <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>📋 Your BRDs</h3>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>Loading...</div>
                    ) : brds.length === 0 ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            padding: '20px',
                            textAlign: 'center',
                            opacity: 0.6
                        }}>
                            No BRDs yet. Generate one above!
                        </div>
                    ) : (
                        brds.map(brd => (
                            <div
                                key={brd.id}
                                onClick={() => {
                                    setSelectedBrd(brd);
                                    setFeasibility(null);
                                }}
                                style={{
                                    background: selectedBrd?.id === brd.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    borderLeft: selectedBrd?.id === brd.id ? '3px solid #8b5cf6' : '3px solid transparent'
                                }}
                            >
                                <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                                    {brd.executiveSummary.substring(0, 50)}...
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.6 }}>
                                    {new Date(brd.generatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* BRD Detail */}
                <div>
                    {selectedBrd ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px' }}>Business Requirements Document</h3>
                                <button
                                    onClick={() => validateFeasibility(selectedBrd)}
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✅ Validate Feasibility
                                </button>
                            </div>

                            <Section title="Executive Summary" content={selectedBrd.executiveSummary} />
                            <Section title="Problem Statement" content={selectedBrd.problemStatement} />

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>Target Audience</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {selectedBrd.targetAudience.map((a, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(139, 92, 246, 0.2)',
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            fontSize: '13px'
                                        }}>
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>Features</div>
                                {selectedBrd.features.map((f, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        marginBottom: '4px'
                                    }}>
                                        <span>{f.name}</span>
                                        <span style={{
                                            background: f.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' :
                                                f.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {f.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>Risks</div>
                                {selectedBrd.risks.map((r, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 500 }}>{r.description}</span>
                                            <span style={{
                                                background: r.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}>
                                                {r.severity}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.8 }}>💡 {r.mitigation}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '12px',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Estimated Timeline</div>
                                    <div style={{ fontWeight: 500 }}>{selectedBrd.estimatedTimeline}</div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '12px',
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>Estimated Cost</div>
                                    <div style={{ fontWeight: 500 }}>{selectedBrd.estimatedCost}</div>
                                </div>
                            </div>

                            {/* Feasibility Results */}
                            {feasibility && (
                                <div style={{
                                    marginTop: '20px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '12px',
                                    padding: '16px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <h4 style={{ margin: 0 }}>Feasibility Analysis</h4>
                                        <span style={{
                                            background: getScoreColor(feasibility.score),
                                            padding: '4px 12px',
                                            borderRadius: '4px',
                                            fontWeight: 600
                                        }}>
                                            {feasibility.overall.toUpperCase()}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                                        <ScoreCard title="Technical" score={feasibility.technical.score} />
                                        <ScoreCard title="Business" score={feasibility.business.score} />
                                        <ScoreCard title="Resources" score={feasibility.resource.score} />
                                    </div>

                                    <div style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '12px',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Recommendation</div>
                                        <div>{feasibility.recommendation}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '40px',
                            textAlign: 'center',
                            opacity: 0.6
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                            <div>Select a BRD to view details</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Section: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>{title}</div>
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '8px'
        }}>
            {content}
        </div>
    </div>
);

const ScoreCard: React.FC<{ title: string; score: number }> = ({ title, score }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '12px',
        borderRadius: '8px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>{title}</div>
        <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: score >= 0.7 ? '#10b981' : score >= 0.5 ? '#f59e0b' : '#ef4444'
        }}>
            {(score * 100).toFixed(0)}%
        </div>
    </div>
);

export default BusinessArchitectDashboard;
