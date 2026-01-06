/**
 * ImprovementDashboard Component
 * 
 * Displays A/B testing experiments and self-improvement metrics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Experiment {
    id: string;
    name: string;
    description: string;
    variants: Variant[];
    status: 'running' | 'completed' | 'paused';
    totalTrials: number;
    winner?: string;
    startedAt: Date;
}

interface Variant {
    id: string;
    name: string;
    trials: number;
    successes: number;
    failures: number;
    successRate: number;
    avgDuration: number;
}

const ImprovementDashboard: React.FC = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
    const [overallStats, setOverallStats] = useState({
        totalExperiments: 0,
        runningExperiments: 0,
        totalTrials: 0,
        overallSuccessRate: 0,
    });

    useEffect(() => {
        loadExperiments();
        loadStats();
    }, []);

    const loadExperiments = async () => {
        try {
            const result = await (window as any).shadowAPI?.improvement?.getExperiments?.();
            if (result) {
                setExperiments(result.map((e: any) => ({
                    ...e,
                    startedAt: new Date(e.startedAt),
                })));
            }
        } catch (err) {
            console.error('Failed to load experiments:', err);
        }
    };

    const loadStats = async () => {
        try {
            const result = await (window as any).shadowAPI?.improvement?.getStats?.();
            if (result) {
                setOverallStats(result);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const promoteVariant = async (experimentId: string, variantId: string) => {
        try {
            await (window as any).shadowAPI?.improvement?.promoteVariant?.(experimentId, variantId);
            loadExperiments();
        } catch (err) {
            console.error('Failed to promote variant:', err);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            running: '#3b82f6',
            completed: '#22c55e',
            paused: '#f59e0b',
        };
        return colors[status] || '#8b949e';
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h2 style={styles.title}>📈 Self-Improvement Dashboard</h2>
                <button onClick={loadExperiments} style={styles.refreshBtn}>
                    🔄 Refresh
                </button>
            </div>

            {/* Overall Stats */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{overallStats.totalExperiments}</span>
                    <span style={styles.statLabel}>Total Experiments</span>
                </div>
                <div style={styles.statCard}>
                    <span style={{ ...styles.statValue, color: '#3b82f6' }}>
                        {overallStats.runningExperiments}
                    </span>
                    <span style={styles.statLabel}>Running</span>
                </div>
                <div style={styles.statCard}>
                    <span style={styles.statValue}>{overallStats.totalTrials}</span>
                    <span style={styles.statLabel}>Total Trials</span>
                </div>
                <div style={styles.statCard}>
                    <span style={{ ...styles.statValue, color: '#22c55e' }}>
                        {(overallStats.overallSuccessRate * 100).toFixed(1)}%
                    </span>
                    <span style={styles.statLabel}>Success Rate</span>
                </div>
            </div>

            {/* Main Content */}
            <div style={styles.content}>
                {/* Experiment List */}
                <div style={styles.experimentList}>
                    <h3 style={styles.sectionTitle}>Experiments</h3>
                    <AnimatePresence>
                        {experiments.map((exp) => (
                            <motion.div
                                key={exp.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    ...styles.experimentCard,
                                    borderColor: selectedExperiment?.id === exp.id ? '#58a6ff' : '#30363d',
                                }}
                                onClick={() => setSelectedExperiment(exp)}
                            >
                                <div style={styles.expHeader}>
                                    <span style={styles.expName}>{exp.name}</span>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: getStatusColor(exp.status),
                                    }}>
                                        {exp.status}
                                    </span>
                                </div>
                                <p style={styles.expDesc}>{exp.description}</p>
                                <div style={styles.expMeta}>
                                    <span>{exp.variants.length} variants</span>
                                    <span>{exp.totalTrials} trials</span>
                                </div>
                                {exp.winner && (
                                    <div style={styles.winnerBadge}>
                                        🏆 Winner: {exp.winner}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {experiments.length === 0 && (
                        <div style={styles.empty}>
                            <span style={styles.emptyIcon}>🧪</span>
                            <p>No experiments yet</p>
                        </div>
                    )}
                </div>

                {/* Experiment Details */}
                <div style={styles.experimentDetails}>
                    {selectedExperiment ? (
                        <>
                            <h3 style={styles.sectionTitle}>
                                {selectedExperiment.name} - Variants
                            </h3>
                            <div style={styles.variantsList}>
                                {selectedExperiment.variants.map((variant) => {
                                    const isWinner = selectedExperiment.winner === variant.name;
                                    return (
                                        <div
                                            key={variant.id}
                                            style={{
                                                ...styles.variantCard,
                                                borderColor: isWinner ? '#22c55e' : '#30363d',
                                            }}
                                        >
                                            <div style={styles.variantHeader}>
                                                <span style={styles.variantName}>
                                                    {isWinner && '🏆 '}{variant.name}
                                                </span>
                                                <button
                                                    onClick={() => promoteVariant(selectedExperiment.id, variant.id)}
                                                    style={styles.promoteBtn}
                                                    disabled={isWinner}
                                                >
                                                    Promote
                                                </button>
                                            </div>

                                            <div style={styles.variantStats}>
                                                <div style={styles.variantStat}>
                                                    <span style={styles.variantStatValue}>{variant.trials}</span>
                                                    <span style={styles.variantStatLabel}>Trials</span>
                                                </div>
                                                <div style={styles.variantStat}>
                                                    <span style={{ ...styles.variantStatValue, color: '#22c55e' }}>
                                                        {variant.successes}
                                                    </span>
                                                    <span style={styles.variantStatLabel}>Successes</span>
                                                </div>
                                                <div style={styles.variantStat}>
                                                    <span style={{ ...styles.variantStatValue, color: '#ef4444' }}>
                                                        {variant.failures}
                                                    </span>
                                                    <span style={styles.variantStatLabel}>Failures</span>
                                                </div>
                                            </div>

                                            {/* Success Rate Bar */}
                                            <div style={styles.progressContainer}>
                                                <div style={styles.progressLabel}>
                                                    Success Rate: {(variant.successRate * 100).toFixed(1)}%
                                                </div>
                                                <div style={styles.progressBar}>
                                                    <div
                                                        style={{
                                                            ...styles.progressFill,
                                                            width: `${variant.successRate * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.avgDuration}>
                                                Avg Duration: {Math.round(variant.avgDuration)}ms
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={styles.noSelection}>
                            <span style={styles.noSelectionIcon}>🧪</span>
                            <p>Select an experiment to view variants</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0d1117',
        color: '#e6edf3',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
        backgroundColor: '#161b22',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
    },
    refreshBtn: {
        backgroundColor: '#21262d',
        color: '#e6edf3',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '6px 12px',
        cursor: 'pointer',
    },
    statsRow: {
        display: 'flex',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: '1px solid #30363d',
    },
    statCard: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#161b22',
        borderRadius: '8px',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: 600,
        color: '#58a6ff',
    },
    statLabel: {
        fontSize: '12px',
        color: '#8b949e',
    },
    content: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
    },
    experimentList: {
        width: '40%',
        borderRight: '1px solid #30363d',
        padding: '16px',
        overflow: 'auto',
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '14px',
        color: '#8b949e',
    },
    experimentCard: {
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '10px',
        border: '1px solid #30363d',
        cursor: 'pointer',
    },
    expHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
    },
    expName: {
        fontWeight: 600,
    },
    statusBadge: {
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '10px',
        textTransform: 'uppercase',
    },
    expDesc: {
        margin: '0 0 8px',
        fontSize: '13px',
        color: '#8b949e',
    },
    expMeta: {
        display: 'flex',
        gap: '16px',
        fontSize: '12px',
        color: '#6e7681',
    },
    winnerBadge: {
        marginTop: '8px',
        padding: '4px 8px',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#22c55e',
    },
    experimentDetails: {
        flex: 1,
        padding: '16px',
        overflow: 'auto',
    },
    variantsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    variantCard: {
        backgroundColor: '#161b22',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #30363d',
    },
    variantHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },
    variantName: {
        fontWeight: 600,
        fontSize: '16px',
    },
    promoteBtn: {
        backgroundColor: '#238636',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 12px',
        fontSize: '12px',
        cursor: 'pointer',
    },
    variantStats: {
        display: 'flex',
        gap: '24px',
        marginBottom: '12px',
    },
    variantStat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    variantStatValue: {
        fontSize: '20px',
        fontWeight: 600,
    },
    variantStatLabel: {
        fontSize: '11px',
        color: '#8b949e',
    },
    progressContainer: {
        marginBottom: '8px',
    },
    progressLabel: {
        fontSize: '12px',
        color: '#8b949e',
        marginBottom: '4px',
    },
    progressBar: {
        height: '6px',
        backgroundColor: '#21262d',
        borderRadius: '3px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#22c55e',
        borderRadius: '3px',
        transition: 'width 0.3s',
    },
    avgDuration: {
        fontSize: '12px',
        color: '#6e7681',
    },
    noSelection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: '#8b949e',
    },
    noSelectionIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
    empty: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#8b949e',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '12px',
    },
};

export default ImprovementDashboard;
