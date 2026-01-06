/**
 * MetricsDashboard Component
 * 
 * UI for viewing correctness, safety, productivity metrics and calibration
 */

import React, { useState, useEffect } from 'react';

interface MetricsSummary {
    correctness: {
        testPassRate: number;
        runtimeErrors: number;
        successfulCompletions: number;
    };
    safety: {
        policyViolations: number;
        humanApprovalsRequired: number;
        blockedActions: number;
    };
    productivity: {
        tasksCompleted: number;
        averageTimeToFirstPR: number;
        codeGeneratedLines: number;
    };
    quality: {
        bugsPreRelease: number;
        codeChurnPrevented: number;
        refactoringSuggestions: number;
    };
    confidence: {
        averagePredicted: number;
        averageActual: number;
        calibrationError: number;
    };
}

interface CalibrationPoint {
    predicted: number;
    actual: number;
    count: number;
}

const MetricsDashboard: React.FC = () => {
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [calibrationData, setCalibrationData] = useState<CalibrationPoint[]>([]);
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        try {
            const since = new Date();
            switch (timeRange) {
                case 'day': since.setDate(since.getDate() - 1); break;
                case 'week': since.setDate(since.getDate() - 7); break;
                case 'month': since.setDate(since.getDate() - 30); break;
            }

            const [summaryData, calibration] = await Promise.all([
                (window as any).shadowAPI.metrics.getSummary(since.toISOString()),
                (window as any).shadowAPI.metrics.getCalibrationData(),
            ]);

            setSummary(summaryData);
            setCalibrationData(calibration);
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
    const formatNumber = (value: number) => value.toLocaleString();

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading metrics...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>📊 Metrics Dashboard</h2>
                <div style={styles.timeSelector}>
                    {(['day', 'week', 'month'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            style={{
                                ...styles.timeButton,
                                ...(timeRange === range ? styles.timeButtonActive : {}),
                            }}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {summary && (
                <>
                    {/* Correctness */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>✅ Correctness</h3>
                        <div style={styles.metricsGrid}>
                            <MetricCard
                                label="Test Pass Rate"
                                value={formatPercent(summary.correctness.testPassRate)}
                                trend={summary.correctness.testPassRate > 0.9 ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Runtime Errors"
                                value={formatNumber(summary.correctness.runtimeErrors)}
                                trend={summary.correctness.runtimeErrors < 5 ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Completions"
                                value={formatNumber(summary.correctness.successfulCompletions)}
                                trend="up"
                            />
                        </div>
                    </div>

                    {/* Safety */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🛡️ Safety</h3>
                        <div style={styles.metricsGrid}>
                            <MetricCard
                                label="Violations"
                                value={formatNumber(summary.safety.policyViolations)}
                                trend={summary.safety.policyViolations === 0 ? 'up' : 'down'}
                            />
                            <MetricCard
                                label="Approvals Required"
                                value={formatNumber(summary.safety.humanApprovalsRequired)}
                            />
                            <MetricCard
                                label="Blocked Actions"
                                value={formatNumber(summary.safety.blockedActions)}
                            />
                        </div>
                    </div>

                    {/* Productivity */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🚀 Productivity</h3>
                        <div style={styles.metricsGrid}>
                            <MetricCard
                                label="Tasks Completed"
                                value={formatNumber(summary.productivity.tasksCompleted)}
                                trend="up"
                            />
                            <MetricCard
                                label="Code Generated"
                                value={`${formatNumber(summary.productivity.codeGeneratedLines)} lines`}
                            />
                        </div>
                    </div>

                    {/* Calibration Chart */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🎯 Confidence Calibration</h3>
                        <div style={styles.calibrationContainer}>
                            <div style={styles.calibrationChart}>
                                {/* Perfect calibration line */}
                                <div style={styles.perfectLine}></div>

                                {/* Calibration points */}
                                {calibrationData.map((point, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            ...styles.calibrationPoint,
                                            left: `${point.predicted * 100}%`,
                                            bottom: `${point.actual * 100}%`,
                                            width: `${Math.min(point.count * 2, 20)}px`,
                                            height: `${Math.min(point.count * 2, 20)}px`,
                                        }}
                                        title={`Predicted: ${formatPercent(point.predicted)}, Actual: ${formatPercent(point.actual)} (${point.count} samples)`}
                                    />
                                ))}
                            </div>
                            <div style={styles.calibrationLabels}>
                                <span>Predicted Confidence →</span>
                            </div>
                            <div style={styles.calibrationStats}>
                                <div>Avg Predicted: {formatPercent(summary.confidence.averagePredicted)}</div>
                                <div>Avg Actual: {formatPercent(summary.confidence.averageActual)}</div>
                                <div>Calibration Error: {formatPercent(summary.confidence.calibrationError)}</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const MetricCard: React.FC<{
    label: string;
    value: string;
    trend?: 'up' | 'down';
}> = ({ label, value, trend }) => (
    <div style={styles.metricCard}>
        <div style={styles.metricValue}>
            {value}
            {trend && (
                <span style={{
                    ...styles.trendIcon,
                    color: trend === 'up' ? '#7bed9f' : '#ff6b6b'
                }}>
                    {trend === 'up' ? '↑' : '↓'}
                </span>
            )}
        </div>
        <div style={styles.metricLabel}>{label}</div>
    </div>
);

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '20px',
        backgroundColor: '#1a1a2e',
        minHeight: '100%',
        color: '#eaeaea',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        margin: 0,
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#a4b0be',
    },
    timeSelector: {
        display: 'flex',
        gap: '4px',
    },
    timeButton: {
        padding: '8px 16px',
        border: '1px solid #3d3d5c',
        backgroundColor: 'transparent',
        color: '#a4b0be',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    timeButtonActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
        color: 'white',
    },
    section: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '18px',
        marginBottom: '12px',
        color: '#a4b0be',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
    },
    metricCard: {
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
    },
    metricValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
    },
    metricLabel: {
        fontSize: '14px',
        color: '#a4b0be',
        marginTop: '8px',
    },
    trendIcon: {
        fontSize: '20px',
    },
    calibrationContainer: {
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '12px',
    },
    calibrationChart: {
        position: 'relative',
        height: '200px',
        border: '1px solid #3d3d5c',
        borderRadius: '8px',
        backgroundColor: '#1a1a2e',
    },
    perfectLine: {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(45deg, transparent 49%, #4a90d9 49%, #4a90d9 51%, transparent 51%)',
        opacity: 0.3,
    },
    calibrationPoint: {
        position: 'absolute',
        backgroundColor: '#7bed9f',
        borderRadius: '50%',
        transform: 'translate(-50%, 50%)',
    },
    calibrationLabels: {
        textAlign: 'center',
        marginTop: '8px',
        color: '#a4b0be',
        fontSize: '12px',
    },
    calibrationStats: {
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '16px',
        color: '#a4b0be',
        fontSize: '14px',
    },
};

export default MetricsDashboard;
