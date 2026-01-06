/**
 * 🛡️ Security Fortress Dashboard
 * 
 * Security management and threat monitoring:
 * - Credential management
 * - Threat scanning
 * - Permission contexts
 * - Security reports
 */

import React, { useState, useEffect } from 'react';

interface ThreatDetection {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location: { line: number; column: number };
    remediation: string;
}

interface SecurityReport {
    totalScans: number;
    threatsDetected: number;
    criticalThreats: number;
    resolvedThreats: number;
    lastScan: string;
}

export const SecurityFortressDashboard: React.FC = () => {
    const [report, setReport] = useState<SecurityReport | null>(null);
    const [scanResults, setScanResults] = useState<ThreatDetection[]>([]);
    const [codeToScan, setCodeToScan] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'scan' | 'credentials'>('overview');

    // Credential management
    const [credKey, setCredKey] = useState('');
    const [credValue, setCredValue] = useState('');
    const [savedCreds, setSavedCreds] = useState<string[]>([]);

    const loadReport = async () => {
        try {
            setLoading(true);
            const result = await (window as any).shadowAPI.securityFortress?.getReport();
            if (result) setReport(result);
        } catch (error) {
            console.error('Failed to load security report:', error);
        } finally {
            setLoading(false);
        }
    };

    const scanCode = async () => {
        if (!codeToScan.trim()) return;

        try {
            setScanning(true);
            const result = await (window as any).shadowAPI.securityFortress.scanForThreats(codeToScan);
            setScanResults(result.threats || []);
        } catch (error) {
            console.error('Failed to scan code:', error);
        } finally {
            setScanning(false);
        }
    };

    const storeCredential = async () => {
        if (!credKey.trim() || !credValue.trim()) return;

        try {
            await (window as any).shadowAPI.securityFortress.storeCredential(credKey, credValue);
            setSavedCreds([...savedCreds, credKey]);
            setCredKey('');
            setCredValue('');
            alert('Credential stored securely!');
        } catch (error) {
            console.error('Failed to store credential:', error);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 100%)',
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
                        🛡️ Security Fortress
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Zero-trust security with threat detection
                    </p>
                </div>
                <button
                    onClick={loadReport}
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

            {/* Security Overview */}
            {report && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <StatCard icon="🔍" label="Total Scans" value={report.totalScans} />
                    <StatCard icon="⚠️" label="Threats Found" value={report.threatsDetected} color="#f59e0b" />
                    <StatCard icon="🚨" label="Critical" value={report.criticalThreats} color="#ef4444" />
                    <StatCard icon="✅" label="Resolved" value={report.resolvedThreats} color="#10b981" />
                    <StatCard icon="🕐" label="Last Scan" value={report.lastScan ? 'Today' : 'Never'} />
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '20px'
            }}>
                {(['overview', 'scan', 'credentials'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #ef4444' : '2px solid transparent',
                            padding: '12px 20px',
                            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: 500
                        }}
                    >
                        {tab === 'overview' && '📊 '}{tab === 'scan' && '🔍 '}{tab === 'credentials' && '🔑 '}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Threat Detection Patterns</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        {[
                            { name: 'SQL Injection', icon: '💉', severity: 'critical' },
                            { name: 'XSS', icon: '🌐', severity: 'high' },
                            { name: 'Command Injection', icon: '💻', severity: 'critical' },
                            { name: 'Path Traversal', icon: '📁', severity: 'high' },
                            { name: 'Hardcoded Secrets', icon: '🔐', severity: 'high' },
                            { name: 'Weak Crypto', icon: '🔓', severity: 'medium' },
                            { name: 'Insecure Deserialization', icon: '📦', severity: 'critical' },
                            { name: 'XXE', icon: '📄', severity: 'high' },
                            { name: 'SSRF', icon: '🌍', severity: 'high' }
                        ].map((pattern, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                borderLeft: `3px solid ${getSeverityColor(pattern.severity)}`
                            }}>
                                <span style={{ fontSize: '20px' }}>{pattern.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{pattern.name}</div>
                                    <div style={{
                                        fontSize: '11px',
                                        textTransform: 'capitalize',
                                        color: getSeverityColor(pattern.severity)
                                    }}>
                                        {pattern.severity}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'scan' && (
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <textarea
                            placeholder="Paste code to scan for vulnerabilities..."
                            value={codeToScan}
                            onChange={e => setCodeToScan(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '200px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <button
                        onClick={scanCode}
                        disabled={scanning || !codeToScan.trim()}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 500,
                            opacity: scanning || !codeToScan.trim() ? 0.5 : 1,
                            marginBottom: '20px'
                        }}
                    >
                        {scanning ? '🔍 Scanning...' : '🔍 Scan for Threats'}
                    </button>

                    {scanResults.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>
                                Found {scanResults.length} potential threats
                            </h3>
                            {scanResults.map((threat, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    borderLeft: `3px solid ${getSeverityColor(threat.severity)}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontWeight: 500 }}>{threat.type}</div>
                                        <span style={{
                                            background: `${getSeverityColor(threat.severity)}33`,
                                            color: getSeverityColor(threat.severity),
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {threat.severity}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                                        {threat.description}
                                    </div>
                                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                                        📍 Line {threat.location.line}, Column {threat.location.column}
                                    </div>
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        fontSize: '13px'
                                    }}>
                                        💡 <strong>Fix:</strong> {threat.remediation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'credentials' && (
                <div>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ fontSize: '16px', margin: '0 0 16px' }}>Store New Credential</h3>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                placeholder="Key (e.g., API_KEY)"
                                value={credKey}
                                onChange={e => setCredKey(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff'
                                }}
                            />
                            <input
                                type="password"
                                placeholder="Value (will be encrypted)"
                                value={credValue}
                                onChange={e => setCredValue(e.target.value)}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff'
                                }}
                            />
                            <button
                                onClick={storeCredential}
                                style={{
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '12px 24px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                🔐 Store
                            </button>
                        </div>
                        <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>
                            Credentials are encrypted with AES-256-GCM and stored securely using the system keychain when available.
                        </p>
                    </div>

                    {savedCreds.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Stored Credentials</h3>
                            {savedCreds.map((key, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '12px 16px',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>🔑 {key}</span>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        ✅ Encrypted
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ icon: string; label: string; value: number | string; color?: string }> = ({
    icon, label, value, color = '#ef4444'
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        padding: '12px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color }}>{value}</div>
        <div style={{ fontSize: '11px', opacity: 0.6 }}>{label}</div>
    </div>
);

export default SecurityFortressDashboard;
