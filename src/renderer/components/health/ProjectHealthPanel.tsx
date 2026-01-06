/**
 * 📊 ProjectHealthPanel - React UI Component
 * 
 * Displays the Project Health Dashboard with:
 * - Overall health score and grade
 * - Architecture metrics
 * - Tech debt breakdown
 * - Auto-fix capabilities
 * - Recommendations
 */

import React, { useState, useEffect } from 'react';

// Types
interface ProjectHealth {
    projectPath: string;
    analyzedAt: Date;
    overall: {
        score: number;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        trend: 'improving' | 'stable' | 'declining';
    };
    architecture: {
        score: number;
        modularity: number;
        coupling: number;
        cohesion: number;
        antiPatterns: { name: string; location: string; severity: string }[];
    };
    techDebt: {
        total: number;
        breakdown: {
            codeSmells: number;
            complexity: number;
            duplication: number;
            coverage: number;
            outdated: number;
        };
    };
    security: {
        score: number;
        vulnerabilities: { critical: number; high: number; medium: number; low: number };
    };
    scalability: {
        score: number;
        currentCapacity: string;
    };
    cost: {
        monthly: number;
        currency: string;
    };
    recommendations: {
        id: string;
        category: string;
        title: string;
        description: string;
        impact: string;
        effort: string;
        autoFixAvailable: boolean;
    }[];
}

export const ProjectHealthPanel: React.FC<{ projectPath?: string }> = ({ projectPath }) => {
    const [health, setHealth] = useState<ProjectHealth | null>(null);
    const [loading, setLoading] = useState(false);
    const [fixing, setFixing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeHealth = async () => {
        if (!projectPath) return;

        setLoading(true);
        setError(null);

        try {
            const result = await (window as any).shadowAPI.health.analyze(projectPath);
            if (result.success) {
                setHealth(result.health);
            } else {
                setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const autoFix = async () => {
        if (!projectPath) return;

        setFixing(true);
        try {
            const result = await (window as any).shadowAPI.health.autoFix(projectPath);
            if (result.success) {
                await analyzeHealth(); // Re-analyze after fix
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFixing(false);
        }
    };

    useEffect(() => {
        if (projectPath) {
            analyzeHealth();
        }
    }, [projectPath]);

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            'A': '#10B981',
            'B': '#3B82F6',
            'C': '#F59E0B',
            'D': '#F97316',
            'F': '#EF4444'
        };
        return colors[grade] || '#6B7280';
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return '📈';
            case 'declining': return '📉';
            default: return '➡️';
        }
    };

    if (!projectPath) {
        return (
            <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📊</div>
                <h3>Project Health Dashboard</h3>
                <p>Select a project to analyze its health</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.loading}>
                <div style={styles.spinner}>⏳</div>
                <p>Analyzing project health...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.error}>
                <span>⚠️</span>
                <p>{error}</p>
                <button onClick={analyzeHealth} style={styles.retryButton}>Retry</button>
            </div>
        );
    }

    if (!health) {
        return (
            <div style={styles.emptyState}>
                <button onClick={analyzeHealth} style={styles.analyzeButton}>
                    🔍 Analyze Project Health
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>📊 Project Health</h2>
                <div style={styles.actions}>
                    <button onClick={analyzeHealth} style={styles.refreshButton}>
                        🔄 Refresh
                    </button>
                    {health.recommendations.some(r => r.autoFixAvailable) && (
                        <button
                            onClick={autoFix}
                            style={styles.fixButton}
                            disabled={fixing}
                        >
                            {fixing ? '⏳ Fixing...' : '🔧 Auto-Fix Issues'}
                        </button>
                    )}
                </div>
            </div>

            {/* Overall Score */}
            <div style={styles.overallScore}>
                <div
                    style={{
                        ...styles.grade,
                        backgroundColor: getGradeColor(health.overall.grade)
                    }}
                >
                    {health.overall.grade}
                </div>
                <div style={styles.scoreDetails}>
                    <div style={styles.scoreValue}>{health.overall.score}/100</div>
                    <div style={styles.trend}>
                        {getTrendIcon(health.overall.trend)} {health.overall.trend}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div style={styles.metricsGrid}>
                <MetricCard
                    title="Architecture"
                    score={health.architecture.score}
                    icon="🏗️"
                    details={[
                        `Modularity: ${health.architecture.modularity}%`,
                        `Coupling: ${health.architecture.coupling}%`,
                        `Cohesion: ${health.architecture.cohesion}%`
                    ]}
                />
                <MetricCard
                    title="Security"
                    score={health.security.score}
                    icon="🔒"
                    details={[
                        `Critical: ${health.security.vulnerabilities.critical}`,
                        `High: ${health.security.vulnerabilities.high}`,
                        `Medium: ${health.security.vulnerabilities.medium}`
                    ]}
                />
                <MetricCard
                    title="Scalability"
                    score={health.scalability.score}
                    icon="📈"
                    details={[health.scalability.currentCapacity]}
                />
                <MetricCard
                    title="Monthly Cost"
                    score={null}
                    icon="💰"
                    value={`$${health.cost.monthly}`}
                    details={[]}
                />
            </div>

            {/* Tech Debt */}
            <div style={styles.section}>
                <h3>📋 Tech Debt: {health.techDebt.total} hours</h3>
                <div style={styles.debtBreakdown}>
                    <DebtBar label="Code Smells" value={health.techDebt.breakdown.codeSmells} />
                    <DebtBar label="Complexity" value={health.techDebt.breakdown.complexity} />
                    <DebtBar label="Duplication" value={health.techDebt.breakdown.duplication} />
                    <DebtBar label="Coverage" value={health.techDebt.breakdown.coverage} />
                    <DebtBar label="Outdated" value={health.techDebt.breakdown.outdated} />
                </div>
            </div>

            {/* Anti-Patterns */}
            {health.architecture.antiPatterns.length > 0 && (
                <div style={styles.section}>
                    <h3>⚠️ Anti-Patterns Detected</h3>
                    <div style={styles.antiPatterns}>
                        {health.architecture.antiPatterns.map((ap, i) => (
                            <div key={i} style={styles.antiPattern}>
                                <span style={styles.apName}>{ap.name}</span>
                                <span style={styles.apLocation}>{ap.location}</span>
                                <span style={{
                                    ...styles.apSeverity,
                                    backgroundColor: ap.severity === 'high' ? '#FEE2E2' : '#FEF3C7',
                                    color: ap.severity === 'high' ? '#DC2626' : '#D97706'
                                }}>
                                    {ap.severity}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div style={styles.section}>
                <h3>💡 Recommendations</h3>
                <div style={styles.recommendations}>
                    {health.recommendations.slice(0, 5).map((rec, i) => (
                        <div key={rec.id} style={styles.recommendation}>
                            <div style={styles.recHeader}>
                                <span style={styles.recTitle}>{rec.title}</span>
                                {rec.autoFixAvailable && (
                                    <span style={styles.autoFixBadge}>✨ Auto-fix</span>
                                )}
                            </div>
                            <p style={styles.recDescription}>{rec.description}</p>
                            <div style={styles.recMeta}>
                                <span>Impact: {rec.impact}</span>
                                <span>Effort: {rec.effort}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Sub-components
const MetricCard: React.FC<{
    title: string;
    score: number | null;
    icon: string;
    value?: string;
    details: string[];
}> = ({ title, score, icon, value, details }) => (
    <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
            <span>{icon}</span>
            <span>{title}</span>
        </div>
        {score !== null ? (
            <div style={styles.metricScore}>
                <span style={{ color: getScoreColor(score) }}>{score}</span>
                <span style={styles.metricMax}>/100</span>
            </div>
        ) : (
            <div style={styles.metricValue}>{value}</div>
        )}
        <div style={styles.metricDetails}>
            {details.map((d, i) => (
                <div key={i}>{d}</div>
            ))}
        </div>
    </div>
);

const DebtBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div style={styles.debtItem}>
        <div style={styles.debtLabel}>{label}</div>
        <div style={styles.debtBarContainer}>
            <div style={{
                ...styles.debtBarFill,
                width: `${Math.min(100, value * 5)}%`
            }} />
        </div>
        <div style={styles.debtValue}>{value}</div>
    </div>
);

// Helper function to get score color (used by MetricCard)
const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
};

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        color: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    actions: {
        display: 'flex',
        gap: '10px'
    },
    refreshButton: {
        padding: '8px 16px',
        backgroundColor: '#374151',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
    },
    fixButton: {
        padding: '8px 16px',
        backgroundColor: '#10B981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 600
    },
    overallScore: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#374151',
        borderRadius: '12px',
        marginBottom: '20px'
    },
    grade: {
        width: '80px',
        height: '80px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        fontWeight: 'bold',
        color: 'white'
    },
    scoreDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    scoreValue: {
        fontSize: '28px',
        fontWeight: 'bold'
    },
    trend: {
        fontSize: '14px',
        color: '#9CA3AF',
        textTransform: 'capitalize'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
    },
    metricCard: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '12px'
    },
    metricHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: 600
    },
    metricScore: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px'
    },
    metricMax: {
        fontSize: '14px',
        color: '#9CA3AF'
    },
    metricValue: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px'
    },
    metricDetails: {
        fontSize: '12px',
        color: '#9CA3AF'
    },
    section: {
        marginBottom: '20px'
    },
    debtBreakdown: {
        marginTop: '12px'
    },
    debtItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
    },
    debtLabel: {
        width: '100px',
        fontSize: '13px',
        color: '#D1D5DB'
    },
    debtBarContainer: {
        flex: 1,
        height: '8px',
        backgroundColor: '#4B5563',
        borderRadius: '4px',
        overflow: 'hidden'
    },
    debtBarFill: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: '4px'
    },
    debtValue: {
        width: '30px',
        textAlign: 'right',
        fontSize: '13px',
        color: '#9CA3AF'
    },
    antiPatterns: {
        marginTop: '12px'
    },
    antiPattern: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    apName: {
        fontWeight: 600
    },
    apLocation: {
        flex: 1,
        fontSize: '13px',
        color: '#9CA3AF'
    },
    apSeverity: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600
    },
    recommendations: {
        marginTop: '12px'
    },
    recommendation: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    recHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    recTitle: {
        fontWeight: 600
    },
    autoFixBadge: {
        padding: '4px 8px',
        backgroundColor: '#10B981',
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px'
    },
    recDescription: {
        fontSize: '14px',
        color: '#D1D5DB',
        marginBottom: '8px'
    },
    recMeta: {
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: '#9CA3AF'
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
        color: '#9CA3AF'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px'
    },
    analyzeButton: {
        padding: '12px 24px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        cursor: 'pointer'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: '#9CA3AF'
    },
    spinner: {
        fontSize: '32px',
        marginBottom: '16px',
        animation: 'spin 1s linear infinite'
    },
    error: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#FEE2E2',
        borderRadius: '8px',
        color: '#DC2626'
    },
    retryButton: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#DC2626',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    }
};

export default ProjectHealthPanel;
