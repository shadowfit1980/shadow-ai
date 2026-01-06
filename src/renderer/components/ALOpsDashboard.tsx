/**
 * ALOpsDashboard Component
 * 
 * UI for monitoring production health and managing incidents
 */

import React, { useState, useEffect } from 'react';

interface HealthStatus {
    healthy: boolean;
    timestamp: Date;
    metrics: {
        cpuUsage: number;
        memoryUsage: number;
        errorRate: number;
        latencyP95: number;
    };
    alerts: Alert[];
}

interface Alert {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    type: string;
    message: string;
    timestamp: Date;
    acknowledged: boolean;
}

interface Incident {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'investigating' | 'resolved' | 'closed';
    rootCause?: string;
    createdAt: Date;
    healingAttempts: any[];
}

const ALOpsDashboard: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        try {
            const [status, incidentList, alerts, monitoring] = await Promise.all([
                (window as any).shadowAPI.alops.getHealthStatus(),
                (window as any).shadowAPI.alops.getIncidents(),
                (window as any).shadowAPI.alops.getActiveAlerts(),
                (window as any).shadowAPI.alops.isActive(),
            ]);

            if (status) {
                setHealthStatus({
                    ...status,
                    timestamp: new Date(status.timestamp),
                });
            }
            setIncidents(incidentList.map((i: any) => ({
                ...i,
                createdAt: new Date(i.createdAt),
            })));
            setActiveAlerts(alerts);
            setIsMonitoring(monitoring);
        } catch (error) {
            console.error('Failed to load ALOps data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMonitoring = async () => {
        if (isMonitoring) {
            await (window as any).shadowAPI.alops.stopMonitoring();
        } else {
            await (window as any).shadowAPI.alops.startMonitoring();
        }
        setIsMonitoring(!isMonitoring);
    };

    const acknowledgeAlert = async (alertId: string) => {
        await (window as any).shadowAPI.alops.acknowledgeAlert(alertId);
        loadData();
    };

    const resolveIncident = async (incidentId: string) => {
        await (window as any).shadowAPI.alops.resolveIncident(incidentId, 'Manually resolved');
        loadData();
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ff4757';
            case 'high': case 'warning': return '#ffa502';
            case 'medium': case 'info': return '#3498db';
            case 'low': return '#7bed9f';
            default: return '#a4b0be';
        }
    };

    const getUsageColor = (value: number, threshold: number) => {
        if (value >= threshold) return '#ff4757';
        if (value >= threshold * 0.8) return '#ffa502';
        return '#7bed9f';
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading ALOps data...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🚀 ALOps Dashboard</h2>
                <button
                    onClick={toggleMonitoring}
                    style={{
                        ...styles.monitorButton,
                        backgroundColor: isMonitoring ? '#ff6b6b' : '#7bed9f',
                    }}
                >
                    {isMonitoring ? '⏹ Stop Monitoring' : '▶ Start Monitoring'}
                </button>
            </div>

            {/* Health Status */}
            <div style={styles.healthSection}>
                <div style={{
                    ...styles.healthIndicator,
                    backgroundColor: healthStatus?.healthy ? '#7bed9f' : '#ff4757',
                }}>
                    {healthStatus?.healthy ? '✓ Healthy' : '✗ Unhealthy'}
                </div>

                {healthStatus && (
                    <div style={styles.metricsRow}>
                        <div style={styles.metricBox}>
                            <div style={styles.metricLabel}>CPU</div>
                            <div style={{
                                ...styles.metricValue,
                                color: getUsageColor(healthStatus.metrics.cpuUsage, 80),
                            }}>
                                {healthStatus.metrics.cpuUsage.toFixed(1)}%
                            </div>
                            <div style={styles.progressBar}>
                                <div style={{
                                    ...styles.progressFill,
                                    width: `${healthStatus.metrics.cpuUsage}%`,
                                    backgroundColor: getUsageColor(healthStatus.metrics.cpuUsage, 80),
                                }} />
                            </div>
                        </div>

                        <div style={styles.metricBox}>
                            <div style={styles.metricLabel}>Memory</div>
                            <div style={{
                                ...styles.metricValue,
                                color: getUsageColor(healthStatus.metrics.memoryUsage, 85),
                            }}>
                                {healthStatus.metrics.memoryUsage.toFixed(1)}%
                            </div>
                            <div style={styles.progressBar}>
                                <div style={{
                                    ...styles.progressFill,
                                    width: `${healthStatus.metrics.memoryUsage}%`,
                                    backgroundColor: getUsageColor(healthStatus.metrics.memoryUsage, 85),
                                }} />
                            </div>
                        </div>

                        <div style={styles.metricBox}>
                            <div style={styles.metricLabel}>Error Rate</div>
                            <div style={{
                                ...styles.metricValue,
                                color: getUsageColor(healthStatus.metrics.errorRate * 100, 5),
                            }}>
                                {(healthStatus.metrics.errorRate * 100).toFixed(2)}%
                            </div>
                        </div>

                        <div style={styles.metricBox}>
                            <div style={styles.metricLabel}>P95 Latency</div>
                            <div style={styles.metricValue}>
                                {healthStatus.metrics.latencyP95.toFixed(0)}ms
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Alerts */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    🔔 Active Alerts ({activeAlerts.length})
                </h3>
                {activeAlerts.length === 0 ? (
                    <div style={styles.emptyState}>No active alerts</div>
                ) : (
                    <div style={styles.alertList}>
                        {activeAlerts.map((alert) => (
                            <div key={alert.id} style={{
                                ...styles.alertCard,
                                borderLeftColor: getSeverityColor(alert.severity),
                            }}>
                                <div style={styles.alertHeader}>
                                    <span style={{
                                        ...styles.severityBadge,
                                        backgroundColor: getSeverityColor(alert.severity),
                                    }}>
                                        {alert.severity}
                                    </span>
                                    <span style={styles.alertType}>{alert.type}</span>
                                </div>
                                <div style={styles.alertMessage}>{alert.message}</div>
                                <button
                                    onClick={() => acknowledgeAlert(alert.id)}
                                    style={styles.ackButton}
                                >
                                    Acknowledge
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Incidents */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>
                    🚨 Incidents ({incidents.filter(i => i.status !== 'closed').length} open)
                </h3>
                {incidents.length === 0 ? (
                    <div style={styles.emptyState}>No incidents recorded</div>
                ) : (
                    <div style={styles.incidentList}>
                        {incidents.slice(0, 5).map((incident) => (
                            <div key={incident.id} style={styles.incidentCard}>
                                <div style={styles.incidentHeader}>
                                    <span style={{
                                        ...styles.severityBadge,
                                        backgroundColor: getSeverityColor(incident.severity),
                                    }}>
                                        {incident.severity}
                                    </span>
                                    <span style={styles.incidentTitle}>{incident.title}</span>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: incident.status === 'resolved' ? '#7bed9f' : '#ffa502',
                                    }}>
                                        {incident.status}
                                    </span>
                                </div>
                                {incident.rootCause && (
                                    <div style={styles.rootCause}>
                                        Root Cause: {incident.rootCause}
                                    </div>
                                )}
                                <div style={styles.incidentFooter}>
                                    <span>Healing Attempts: {incident.healingAttempts.length}</span>
                                    <span>{incident.createdAt.toLocaleString()}</span>
                                    {incident.status !== 'resolved' && incident.status !== 'closed' && (
                                        <button
                                            onClick={() => resolveIncident(incident.id)}
                                            style={styles.resolveButton}
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

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
    monitorButton: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        color: '#1a1a2e',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
    },
    healthSection: {
        backgroundColor: '#16213e',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
    },
    healthIndicator: {
        display: 'inline-block',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: '16px',
    },
    metricsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
    },
    metricBox: {
        backgroundColor: '#1a1a2e',
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center',
    },
    metricLabel: {
        fontSize: '12px',
        color: '#a4b0be',
        marginBottom: '8px',
    },
    metricValue: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
    },
    progressBar: {
        height: '4px',
        backgroundColor: '#3d3d5c',
        borderRadius: '2px',
        marginTop: '8px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.3s ease',
    },
    section: {
        marginBottom: '24px',
    },
    sectionTitle: {
        fontSize: '18px',
        marginBottom: '12px',
    },
    emptyState: {
        backgroundColor: '#16213e',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#a4b0be',
    },
    alertList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    alertCard: {
        backgroundColor: '#16213e',
        padding: '16px',
        borderRadius: '8px',
        borderLeft: '4px solid',
    },
    alertHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    severityBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: 'white',
    },
    alertType: {
        color: '#a4b0be',
        fontSize: '14px',
    },
    alertMessage: {
        fontSize: '14px',
        marginBottom: '12px',
    },
    ackButton: {
        padding: '6px 12px',
        backgroundColor: '#3d3d5c',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },
    incidentList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    incidentCard: {
        backgroundColor: '#16213e',
        padding: '16px',
        borderRadius: '8px',
    },
    incidentHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
    },
    incidentTitle: {
        flex: 1,
        fontWeight: 'bold',
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1a1a2e',
    },
    rootCause: {
        fontSize: '13px',
        color: '#a4b0be',
        marginBottom: '12px',
        fontStyle: 'italic',
    },
    incidentFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#a4b0be',
    },
    resolveButton: {
        padding: '6px 12px',
        backgroundColor: '#7bed9f',
        border: 'none',
        borderRadius: '4px',
        color: '#1a1a2e',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
};

export default ALOpsDashboard;
