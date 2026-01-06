/**
 * Project Health Dashboard Component
 * 
 * Displays comprehensive project health metrics using Kimi K2 enhancements:
 * - Evolution report (dependencies, tech debt)
 * - Self-healing status
 * - Developer burnout indicator
 * - Analytics metrics
 */

import React, { useState, useEffect } from 'react';
import { useEvolution, useSelfHealing, usePredictive, useDevAnalytics } from '../hooks/useKimiK2';
import './ProjectHealthDashboard.css';

interface HealthScore {
    score: number;
    label: string;
    color: string;
}

function getHealthColor(score: number): HealthScore {
    if (score >= 80) return { score, label: 'Excellent', color: '#10b981' };
    if (score >= 60) return { score, label: 'Good', color: '#3b82f6' };
    if (score >= 40) return { score, label: 'Needs Attention', color: '#f59e0b' };
    return { score, label: 'Critical', color: '#ef4444' };
}

export const ProjectHealthDashboard: React.FC = () => {
    const { loading: evolLoading, report, generateReport } = useEvolution();
    const { result: healingResult, runFull } = useSelfHealing();
    const { burnout, detectBurnout } = usePredictive();
    const { metrics, bottlenecks, loadMetrics, loadBottlenecks } = useDevAnalytics();

    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Load initial data
        generateReport();
        loadMetrics();
        loadBottlenecks();
        detectBurnout();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            generateReport(),
            loadMetrics(),
            loadBottlenecks(),
            detectBurnout(),
        ]);
        setIsRefreshing(false);
    };

    const handleAutoHeal = async () => {
        await runFull();
        await generateReport(); // Refresh after healing
    };

    const health = report ? getHealthColor(report.healthScore) : { score: 0, label: 'Loading', color: '#6b7280' };

    return (
        <div className="health-dashboard">
            <header className="health-header">
                <h2>🏥 Project Health Dashboard</h2>
                <button
                    className="refresh-btn"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
                </button>
            </header>

            {/* Health Score Circle */}
            <div className="health-score-section">
                <div
                    className="health-circle"
                    style={{ borderColor: health.color }}
                >
                    <span className="score" style={{ color: health.color }}>
                        {evolLoading ? '...' : health.score}
                    </span>
                    <span className="label">{health.label}</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <span className="stat-icon">📦</span>
                    <span className="stat-value">
                        {report?.dependencyUpdates.length || 0}
                    </span>
                    <span className="stat-label">Outdated Deps</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🔧</span>
                    <span className="stat-value">
                        {report?.technicalDebt.length || 0}
                    </span>
                    <span className="stat-label">Tech Debt Items</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📈</span>
                    <span className="stat-value">
                        {metrics?.codingVelocity.toFixed(0) || 0}
                    </span>
                    <span className="stat-label">Lines/Hour</span>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">🐛</span>
                    <span className="stat-value">
                        {metrics?.bugIntroductionRate.toFixed(2) || 0}
                    </span>
                    <span className="stat-label">Bugs/Commit</span>
                </div>
            </div>

            {/* Burnout Indicator */}
            {burnout && (
                <div className={`burnout-card ${burnout.level}`}>
                    <h3>
                        {burnout.level === 'normal' ? '😊' : burnout.level === 'elevated' ? '😐' : '😓'}
                        {' '}Developer Wellness
                    </h3>
                    <p className="burnout-level">Level: {burnout.level.toUpperCase()}</p>
                    {burnout.indicators.length > 0 && (
                        <ul className="burnout-indicators">
                            {burnout.indicators.map((ind, i) => (
                                <li key={i}>{ind}</li>
                            ))}
                        </ul>
                    )}
                    {burnout.recommendations.length > 0 && (
                        <div className="burnout-recommendations">
                            <strong>Recommendations:</strong>
                            <ul>
                                {burnout.recommendations.map((rec, i) => (
                                    <li key={i}>{rec}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Bottlenecks */}
            {bottlenecks && bottlenecks.length > 0 && (
                <div className="bottlenecks-card">
                    <h3>⚠️ Bottlenecks Detected</h3>
                    <ul>
                        {bottlenecks.map((b, i) => (
                            <li key={i}>{b}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Self-Healing Section */}
            <div className="healing-section">
                <h3>🔧 Auto-Healing</h3>
                <button
                    className="heal-btn"
                    onClick={handleAutoHeal}
                >
                    Run Full Healing
                </button>
                {healingResult && (
                    <div className="healing-result">
                        <p>✅ Fixed: {healingResult.issuesFixed}</p>
                        <p>❌ Failed: {healingResult.issuesFailed}</p>
                        <p>⏱️ Duration: {healingResult.duration}ms</p>
                    </div>
                )}
            </div>

            {/* Dependency Updates */}
            {report?.dependencyUpdates && report.dependencyUpdates.length > 0 && (
                <div className="deps-section">
                    <h3>📦 Dependency Updates Available</h3>
                    <div className="deps-list">
                        {report.dependencyUpdates.slice(0, 5).map((dep, i) => (
                            <div key={i} className={`dep-item ${dep.breaking ? 'breaking' : ''}`}>
                                <span className="dep-name">{dep.name}</span>
                                <span className="dep-version">
                                    {dep.currentVersion} → {dep.latestVersion}
                                </span>
                                {dep.breaking && <span className="breaking-badge">Breaking</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectHealthDashboard;
