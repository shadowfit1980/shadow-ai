/**
 * Security Dashboard Component
 * React component for vulnerability scanning and security overview
 */
import React, { useState, useEffect } from 'react';
import './SecurityDashboard.css';

interface ScanResult {
    id: string;
    projectName: string;
    scannedAt: Date;
    totalDependencies: number;
    vulnerableDependencies: number;
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        total: number;
        score: number;
    };
    recommendations: string[];
}

interface Vulnerability {
    id: string;
    package: string;
    severity: string;
    title: string;
    patchedVersions?: string;
    recommendation: string;
}

export const SecurityDashboard: React.FC = () => {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [dbStats, setDbStats] = useState({ packages: 0, vulnerabilities: 0 });

    useEffect(() => {
        loadDbStats();
        loadLatestScan();
    }, []);

    const loadDbStats = async () => {
        try {
            const stats = await window.shadowAPI?.invoke('vulnscan:get-db-stats');
            if (stats) setDbStats(stats);
        } catch (error) {
            console.error('Failed to load database stats:', error);
        }
    };

    const loadLatestScan = async () => {
        try {
            const latest = await window.shadowAPI?.invoke('vulnscan:get-latest');
            if (latest) {
                setScanResult(latest);
                setVulnerabilities(latest.vulnerabilities || []);
            }
        } catch (error) {
            console.error('Failed to load latest scan:', error);
        }
    };

    const runScan = async () => {
        setIsScanning(true);
        try {
            // Read package.json from project
            const packageJson = await window.shadowAPI?.invoke('file:read', './package.json');
            if (packageJson) {
                const result = await window.shadowAPI?.invoke('vulnscan:scan-package', JSON.parse(packageJson));
                if (result) {
                    setScanResult(result);
                    setVulnerabilities(result.vulnerabilities || []);
                }
            }
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return '#dc2626';
            case 'high': return '#ea580c';
            case 'medium': return '#eab308';
            case 'low': return '#22c55e';
            default: return '#6b7280';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#eab308';
        if (score >= 40) return '#ea580c';
        return '#dc2626';
    };

    return (
        <div className="security-dashboard">
            <header className="security-header">
                <h1>🔐 Security Center</h1>
                <button
                    className="scan-btn"
                    onClick={runScan}
                    disabled={isScanning}
                >
                    {isScanning ? '⏳ Scanning...' : '🔍 Run Scan'}
                </button>
            </header>

            <div className="security-stats">
                <div className="stat-card">
                    <span className="stat-value">{dbStats.packages}</span>
                    <span className="stat-label">Known Packages</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{dbStats.vulnerabilities}</span>
                    <span className="stat-label">CVEs in Database</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value">{scanResult?.totalDependencies || '-'}</span>
                    <span className="stat-label">Dependencies</span>
                </div>
                <div className="stat-card">
                    <span className="stat-value" style={{ color: getScoreColor(scanResult?.summary.score || 0) }}>
                        {scanResult?.summary.score || '-'}/100
                    </span>
                    <span className="stat-label">Security Score</span>
                </div>
            </div>

            {scanResult && (
                <>
                    <div className="severity-breakdown">
                        <h2>Vulnerability Summary</h2>
                        <div className="severity-grid">
                            <div className="severity-item critical">
                                <span className="count">{scanResult.summary.critical}</span>
                                <span className="label">Critical</span>
                            </div>
                            <div className="severity-item high">
                                <span className="count">{scanResult.summary.high}</span>
                                <span className="label">High</span>
                            </div>
                            <div className="severity-item medium">
                                <span className="count">{scanResult.summary.medium}</span>
                                <span className="label">Medium</span>
                            </div>
                            <div className="severity-item low">
                                <span className="count">{scanResult.summary.low}</span>
                                <span className="label">Low</span>
                            </div>
                        </div>
                    </div>

                    <div className="vulnerabilities-section">
                        <h2>Vulnerabilities ({vulnerabilities.length})</h2>
                        <div className="vuln-list">
                            {vulnerabilities.map(vuln => (
                                <div
                                    key={vuln.id}
                                    className="vuln-card"
                                    style={{ borderLeftColor: getSeverityColor(vuln.severity) }}
                                >
                                    <div className="vuln-header">
                                        <span
                                            className="severity-badge"
                                            style={{ backgroundColor: getSeverityColor(vuln.severity) }}
                                        >
                                            {vuln.severity.toUpperCase()}
                                        </span>
                                        <span className="package-name">{vuln.package}</span>
                                    </div>
                                    <h3>{vuln.title}</h3>
                                    <p className="recommendation">{vuln.recommendation}</p>
                                    {vuln.patchedVersions && (
                                        <span className="patch-version">
                                            ✅ Fixed in: {vuln.patchedVersions}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {vulnerabilities.length === 0 && (
                                <div className="no-vulns">
                                    <span className="emoji">🎉</span>
                                    <p>No vulnerabilities found!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="recommendations-section">
                        <h2>Recommendations</h2>
                        <ul className="recommendations-list">
                            {scanResult.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {!scanResult && !isScanning && (
                <div className="empty-state">
                    <span className="emoji">🔒</span>
                    <h3>No Scan Results</h3>
                    <p>Click "Run Scan" to analyze your dependencies for vulnerabilities</p>
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
