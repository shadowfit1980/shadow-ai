/**
 * SafetyDashboard Component
 * 
 * UI for managing safety policies and operating modes
 */

import React, { useState, useEffect } from 'react';

interface Policy {
    id: string;
    name: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    enabled: boolean;
    conditions: any;
    action: string;
}

interface Violation {
    id: string;
    policyId: string;
    policyName: string;
    timestamp: Date;
    status: 'pending' | 'approved' | 'rejected';
    context: any;
}

interface ModeConfig {
    safeBoundaries: string[];
    approvalRequired: any[];
    auditLevel: string;
}

const SafetyDashboard: React.FC = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [violations, setViolations] = useState<Violation[]>([]);
    const [currentMode, setCurrentMode] = useState<string>('autonomous');
    const [modeConfig, setModeConfig] = useState<ModeConfig | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'policies' | 'violations' | 'modes'>('policies');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setError(null);
        setLoading(true);
        try {
            // Check if shadowAPI is available
            const api = (window as any).shadowAPI;
            if (!api?.safety || !api?.mode) {
                throw new Error('Safety API not available. Please restart the application.');
            }

            const [policiesData, violationsData, mode, config, violationStats] = await Promise.all([
                api.safety.getAllPolicies().catch(() => []),
                api.safety.getRecentViolations(20).catch(() => []),
                api.mode.getMode().catch(() => 'autonomous'),
                api.mode.getConfig().catch(() => ({ safeBoundaries: [], approvalRequired: [], auditLevel: 'low' })),
                api.safety.getViolationStats().catch(() => ({ total: 0 })),
            ]);

            // Apply null checks with safe defaults
            setPolicies(policiesData || []);
            setViolations((violationsData || []).map((v: any) => ({
                ...v,
                timestamp: v?.timestamp ? new Date(v.timestamp) : new Date()
            })));
            setCurrentMode(mode || 'autonomous');
            setModeConfig(config || { safeBoundaries: [], approvalRequired: [], auditLevel: 'low' });
            setStats(violationStats || { total: 0 });
        } catch (error) {
            console.error('Failed to load safety data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load safety data');
            // Set safe defaults
            setPolicies([]);
            setViolations([]);
            setCurrentMode('autonomous');
            setModeConfig({ safeBoundaries: [], approvalRequired: [], auditLevel: 'low' });
            setStats({ total: 0 });
        } finally {
            setLoading(false);
        }
    };


    const togglePolicy = async (policyId: string, enabled: boolean) => {
        await (window as any).shadowAPI.safety.setPolicyEnabled(policyId, enabled);
        loadData();
    };

    const changeMode = async (mode: string) => {
        await (window as any).shadowAPI.mode.setMode(mode);
        setCurrentMode(mode);
        loadData();
    };

    const approveViolation = async (violationId: string) => {
        await (window as any).shadowAPI.safety.approveViolation(violationId, 'user');
        loadData();
    };

    const rejectViolation = async (violationId: string) => {
        await (window as any).shadowAPI.safety.rejectViolation(violationId, 'Policy violation');
        loadData();
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ff4757';
            case 'high': return '#ff6b6b';
            case 'medium': return '#ffa502';
            case 'low': return '#7bed9f';
            default: return '#a4b0be';
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading safety data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorContainer}>
                    <h3 style={styles.errorTitle}>⚠️ Failed to Load Safety Dashboard</h3>
                    <p style={styles.errorMessage}>{error}</p>
                    <button onClick={loadData} style={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>🛡️ Safety Dashboard</h2>
                <div style={styles.modeSelector}>
                    <span style={styles.modeLabel}>Mode:</span>
                    {['autonomous', 'assist', 'audit'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => changeMode(mode)}
                            style={{
                                ...styles.modeButton,
                                ...(currentMode === mode ? styles.modeButtonActive : {}),
                            }}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{policies.length}</div>
                    <div style={styles.statLabel}>Policies</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statValue}>{policies.filter(p => p.enabled).length}</div>
                    <div style={styles.statLabel}>Active</div>
                </div>
                <div style={{ ...styles.statCard, borderColor: '#ff4757' }}>
                    <div style={styles.statValue}>{stats?.total || 0}</div>
                    <div style={styles.statLabel}>Violations</div>
                </div>
                <div style={{ ...styles.statCard, borderColor: '#ffa502' }}>
                    <div style={styles.statValue}>
                        {violations.filter(v => v.status === 'pending').length}
                    </div>
                    <div style={styles.statLabel}>Pending</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
                {(['policies', 'violations', 'modes'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab ? styles.tabActive : {}),
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {activeTab === 'policies' && (
                    <div style={styles.policyList}>
                        {policies.map((policy) => (
                            <div key={policy.id} style={styles.policyCard}>
                                <div style={styles.policyHeader}>
                                    <span
                                        style={{
                                            ...styles.severityBadge,
                                            backgroundColor: getSeverityColor(policy.severity),
                                        }}
                                    >
                                        {policy.severity}
                                    </span>
                                    <span style={styles.policyName}>{policy.name}</span>
                                    <label style={styles.toggle}>
                                        <input
                                            type="checkbox"
                                            checked={policy.enabled}
                                            onChange={(e) => togglePolicy(policy.id, e.target.checked)}
                                        />
                                        <span style={styles.toggleSlider}></span>
                                    </label>
                                </div>
                                <p style={styles.policyDescription}>{policy.description}</p>
                                <div style={styles.policyAction}>
                                    Action: <code style={styles.code}>{policy.action}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'violations' && (
                    <div style={styles.violationList}>
                        {violations.length === 0 ? (
                            <div style={styles.emptyState}>No violations recorded</div>
                        ) : (
                            violations.map((violation) => (
                                <div key={violation.id} style={styles.violationCard}>
                                    <div style={styles.violationHeader}>
                                        <span style={styles.violationPolicy}>{violation.policyName}</span>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: violation.status === 'pending' ? '#ffa502' :
                                                violation.status === 'approved' ? '#7bed9f' : '#ff4757'
                                        }}>
                                            {violation.status}
                                        </span>
                                    </div>
                                    <div style={styles.violationTime}>
                                        {violation.timestamp.toLocaleString()}
                                    </div>
                                    {violation.status === 'pending' && (
                                        <div style={styles.violationActions}>
                                            <button
                                                onClick={() => approveViolation(violation.id)}
                                                style={styles.approveButton}
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => rejectViolation(violation.id)}
                                                style={styles.rejectButton}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'modes' && modeConfig && (
                    <div style={styles.modesContent}>
                        <div style={styles.modeInfo}>
                            <h3>Current Mode: {currentMode.toUpperCase()}</h3>
                            <div style={styles.modeDescription}>
                                {currentMode === 'autonomous' && 'Agent acts within safe boundaries with minimal intervention.'}
                                {currentMode === 'assist' && 'Agent suggests actions, human approves each step.'}
                                {currentMode === 'audit' && 'Agent acts freely but logs extensively for review.'}
                            </div>
                        </div>
                        <div style={styles.modeDetails}>
                            <h4>Safe Boundaries</h4>
                            <ul style={styles.boundaryList}>
                                {modeConfig.safeBoundaries.map((boundary, i) => (
                                    <li key={i}>{boundary}</li>
                                ))}
                            </ul>
                            <h4>Audit Level: {modeConfig.auditLevel}</h4>
                        </div>
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
        marginBottom: '20px',
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
    modeSelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    modeLabel: {
        marginRight: '8px',
        color: '#a4b0be',
    },
    modeButton: {
        padding: '8px 16px',
        border: '1px solid #3d3d5c',
        backgroundColor: 'transparent',
        color: '#a4b0be',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    modeButtonActive: {
        backgroundColor: '#4a90d9',
        borderColor: '#4a90d9',
        color: 'white',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px',
    },
    statCard: {
        backgroundColor: '#16213e',
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center',
        borderLeft: '4px solid #4a90d9',
    },
    statValue: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: '14px',
        color: '#a4b0be',
        marginTop: '4px',
    },
    tabs: {
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        borderBottom: '1px solid #3d3d5c',
        paddingBottom: '4px',
    },
    tab: {
        padding: '10px 20px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#a4b0be',
        cursor: 'pointer',
        borderRadius: '6px 6px 0 0',
        transition: 'all 0.2s',
    },
    tabActive: {
        backgroundColor: '#16213e',
        color: 'white',
    },
    content: {
        backgroundColor: '#16213e',
        borderRadius: '12px',
        padding: '20px',
    },
    policyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    policyCard: {
        backgroundColor: '#1a1a2e',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #3d3d5c',
    },
    policyHeader: {
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
    policyName: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: '16px',
    },
    toggle: {
        position: 'relative',
        display: 'inline-block',
        width: '48px',
        height: '24px',
    },
    toggleSlider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#3d3d5c',
        borderRadius: '24px',
        transition: '0.4s',
    },
    policyDescription: {
        color: '#a4b0be',
        fontSize: '14px',
        margin: '8px 0',
    },
    policyAction: {
        fontSize: '13px',
        color: '#a4b0be',
    },
    code: {
        backgroundColor: '#3d3d5c',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
    },
    violationList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    violationCard: {
        backgroundColor: '#1a1a2e',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #3d3d5c',
    },
    violationHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    violationPolicy: {
        fontWeight: 'bold',
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'white',
    },
    violationTime: {
        fontSize: '13px',
        color: '#a4b0be',
    },
    violationActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
    },
    approveButton: {
        padding: '8px 16px',
        backgroundColor: '#7bed9f',
        border: 'none',
        borderRadius: '6px',
        color: '#1a1a2e',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    rejectButton: {
        padding: '8px 16px',
        backgroundColor: '#ff4757',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        color: '#a4b0be',
    },
    modesContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    modeInfo: {
        textAlign: 'center',
    },
    modeDescription: {
        color: '#a4b0be',
        marginTop: '8px',
    },
    modeDetails: {
        backgroundColor: '#1a1a2e',
        padding: '16px',
        borderRadius: '8px',
    },
    boundaryList: {
        color: '#a4b0be',
        paddingLeft: '20px',
    },
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
    },
    errorTitle: {
        color: '#ff4757',
        fontSize: '20px',
        marginBottom: '12px',
    },
    errorMessage: {
        color: '#a4b0be',
        fontSize: '14px',
        marginBottom: '20px',
        maxWidth: '400px',
    },
    retryButton: {
        padding: '12px 24px',
        backgroundColor: '#4a90d9',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
    },
};

export default SafetyDashboard;
