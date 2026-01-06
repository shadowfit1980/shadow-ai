/**
 * EvolutionDashboard - v6.0 Systems Monitoring
 * 
 * Unified dashboard for all v6.0 evolution systems:
 * - Execution Sandbox status
 * - Retry Engine health
 * - Code Verifier metrics
 * - Vector Store stats
 * - Active Learning insights
 * - HTN Planner overview
 * - Agent Process status
 * - Message Bus activity
 */

import React, { useState, useEffect, useCallback } from 'react';

interface SandboxStatus {
    dockerAvailable: boolean;
    activeContainers: number;
}

interface RetryHealth {
    totalEndpoints: number;
    healthyEndpoints: number;
    degradedEndpoints: number;
    unhealthyEndpoints: number;
}

interface VectorStats {
    totalDocuments: number;
    totalFiles: number;
    dbSizeBytes: number;
}

interface LearningStats {
    totalOutcomes: number;
    successRate: number;
    totalVariants: number;
    promotedVariants: number;
    agentCount: number;
}

interface PlannerStats {
    totalPlans: number;
    completedPlans: number;
    failedPlans: number;
    registeredMethods: number;
    registeredExecutors: number;
}

interface AgentStats {
    totalAgents: number;
    idleAgents: number;
    busyAgents: number;
    queuedTasks: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
}

interface MessageStats {
    totalSent: number;
    totalReceived: number;
    deliveryRate: number;
}

export const EvolutionDashboard: React.FC = () => {
    const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus | null>(null);
    const [retryHealth, setRetryHealth] = useState<RetryHealth | null>(null);
    const [vectorStats, setVectorStats] = useState<VectorStats | null>(null);
    const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
    const [plannerStats, setPlannerStats] = useState<PlannerStats | null>(null);
    const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
    const [messageStats, setMessageStats] = useState<MessageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        try {
            setLoading(true);
            const api = (window as any).shadowAPI;

            const [sandbox, retry, vectors, learning, planner, agents, bus] = await Promise.all([
                api?.dockerSandbox?.getStatus?.().catch(() => null),
                api?.retry?.getHealth?.().catch(() => null),
                api?.vectors?.getStats?.().catch(() => null),
                api?.activeLearning?.getStats?.().catch(() => null),
                api?.planner?.getStats?.().catch(() => null),
                api?.agentProcess?.getStats?.().catch(() => null),
                api?.messageBus?.getStats?.().catch(() => null),
            ]);

            setSandboxStatus(sandbox);
            setRetryHealth(retry);
            setVectorStats(vectors);
            setLearningStats(learning);
            setPlannerStats(planner);
            setAgentStats(agents);
            setMessageStats(bus);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 10000);
        return () => clearInterval(interval);
    }, [loadStats]);

    const styles: Record<string, React.CSSProperties> = {
        container: {
            padding: '24px',
            backgroundColor: '#0a0a0f',
            minHeight: '100%',
            color: '#e0e0e0',
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        badge: {
            backgroundColor: '#10b981',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
        },
        card: {
            backgroundColor: '#1a1a2e',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #2a2a3e',
        },
        cardHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
        },
        cardIcon: {
            fontSize: '24px',
        },
        cardTitle: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#fff',
        },
        statRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid #2a2a3e',
        },
        statLabel: {
            color: '#888',
            fontSize: '14px',
        },
        statValue: {
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
        },
        statusBadge: {
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
        },
        healthy: {
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            color: '#10b981',
        },
        warning: {
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
        },
        error: {
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
        },
        refreshButton: {
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
        },
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getHealthStatus = (health: RetryHealth | null) => {
        if (!health) return { text: 'Unknown', style: styles.warning };
        if (health.unhealthyEndpoints > 0) return { text: 'Degraded', style: styles.error };
        if (health.degradedEndpoints > 0) return { text: 'Warning', style: styles.warning };
        return { text: 'Healthy', style: styles.healthy };
    };

    if (loading && !sandboxStatus) {
        return (
            <div style={styles.container}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '16px' }}>⚡</div>
                    <div>Loading v6.0 Evolution Systems...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.title}>
                    <span>🧬</span>
                    Evolution Dashboard
                    <span style={styles.badge}>v6.0</span>
                </div>
                <button style={styles.refreshButton} onClick={loadStats}>
                    🔄 Refresh
                </button>
            </div>

            {error && (
                <div style={{ ...styles.card, borderColor: '#ef4444', marginBottom: '20px' }}>
                    <div style={{ color: '#ef4444' }}>⚠️ {error}</div>
                </div>
            )}

            <div style={styles.grid}>
                {/* Execution Sandbox */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>🐳</span>
                        <span style={styles.cardTitle}>Execution Sandbox</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Docker Available</span>
                        <span style={{ ...styles.statusBadge, ...(sandboxStatus?.dockerAvailable ? styles.healthy : styles.error) }}>
                            {sandboxStatus?.dockerAvailable ? 'Yes' : 'No'}
                        </span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Active Containers</span>
                        <span style={styles.statValue}>{sandboxStatus?.activeContainers ?? 0}</span>
                    </div>
                </div>

                {/* Retry Engine */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>🔄</span>
                        <span style={styles.cardTitle}>Retry Engine</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Status</span>
                        <span style={{ ...styles.statusBadge, ...getHealthStatus(retryHealth).style }}>
                            {getHealthStatus(retryHealth).text}
                        </span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Endpoints</span>
                        <span style={styles.statValue}>
                            {retryHealth?.healthyEndpoints ?? 0} / {retryHealth?.totalEndpoints ?? 0}
                        </span>
                    </div>
                </div>

                {/* Vector Store */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>🔍</span>
                        <span style={styles.cardTitle}>Vector Store</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Documents</span>
                        <span style={styles.statValue}>{vectorStats?.totalDocuments ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Files Indexed</span>
                        <span style={styles.statValue}>{vectorStats?.totalFiles ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Database Size</span>
                        <span style={styles.statValue}>{formatBytes(vectorStats?.dbSizeBytes ?? 0)}</span>
                    </div>
                </div>

                {/* Active Learning */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>🧠</span>
                        <span style={styles.cardTitle}>Active Learning</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Success Rate</span>
                        <span style={styles.statValue}>
                            {learningStats ? `${(learningStats.successRate * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Outcomes Tracked</span>
                        <span style={styles.statValue}>{learningStats?.totalOutcomes ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Promoted Variants</span>
                        <span style={styles.statValue}>
                            {learningStats?.promotedVariants ?? 0} / {learningStats?.totalVariants ?? 0}
                        </span>
                    </div>
                </div>

                {/* HTN Planner */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>📋</span>
                        <span style={styles.cardTitle}>HTN Planner</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Total Plans</span>
                        <span style={styles.statValue}>{plannerStats?.totalPlans ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Completed</span>
                        <span style={styles.statValue}>{plannerStats?.completedPlans ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Methods / Executors</span>
                        <span style={styles.statValue}>
                            {plannerStats?.registeredMethods ?? 0} / {plannerStats?.registeredExecutors ?? 0}
                        </span>
                    </div>
                </div>

                {/* Agent Processes */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>⚡</span>
                        <span style={styles.cardTitle}>Agent Processes</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Active Agents</span>
                        <span style={styles.statValue}>
                            {agentStats?.busyAgents ?? 0} / {agentStats?.totalAgents ?? 0}
                        </span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Queued Tasks</span>
                        <span style={styles.statValue}>{agentStats?.queuedTasks ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Tasks Completed</span>
                        <span style={styles.statValue}>{agentStats?.totalTasksCompleted ?? 0}</span>
                    </div>
                </div>

                {/* Message Bus */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardIcon}>📨</span>
                        <span style={styles.cardTitle}>Message Bus</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Messages Sent</span>
                        <span style={styles.statValue}>{messageStats?.totalSent ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Messages Received</span>
                        <span style={styles.statValue}>{messageStats?.totalReceived ?? 0}</span>
                    </div>
                    <div style={styles.statRow}>
                        <span style={styles.statLabel}>Delivery Rate</span>
                        <span style={styles.statValue}>
                            {messageStats ? `${(messageStats.deliveryRate * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvolutionDashboard;
