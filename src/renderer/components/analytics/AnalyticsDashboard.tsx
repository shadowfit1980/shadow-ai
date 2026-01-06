/**
 * Analytics Dashboard Component
 * React component for predictive analytics and code insights
 */
import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

interface PredictionResult {
    id: string;
    type: string;
    confidence: number;
    prediction: string;
    probability: number;
    factors: { name: string; weight: number; value: number; impact: string }[];
    recommendations: string[];
}

interface ProjectForecast {
    id: string;
    projectName: string;
    timeHorizon: string;
    metrics: {
        bugs: { current: number; forecast: number; confidence: number };
        techDebt: { current: number; forecast: number; confidence: number };
        coverage: { current: number; forecast: number; confidence: number };
        velocity: { current: number; forecast: number; confidence: number };
    };
    opportunities: string[];
}

export const AnalyticsDashboard: React.FC = () => {
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [forecast, setForecast] = useState<ProjectForecast | null>(null);
    const [activeTab, setActiveTab] = useState<'predictions' | 'forecast' | 'trends'>('predictions');
    const [selectedHorizon, setSelectedHorizon] = useState<string>('1month');

    useEffect(() => {
        loadPredictions();
        loadForecast();
    }, []);

    const loadPredictions = async () => {
        try {
            const data = await window.shadowAPI?.invoke('analytics:get-predictions');
            if (data) setPredictions(data);
        } catch (error) {
            console.error('Failed to load predictions:', error);
        }
    };

    const loadForecast = async () => {
        try {
            const data = await window.shadowAPI?.invoke('analytics:generate-forecast', 'Current Project', selectedHorizon);
            if (data) setForecast(data);
        } catch (error) {
            console.error('Failed to load forecast:', error);
        }
    };

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'positive': return '#22c55e';
            case 'negative': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getTrendIcon = (current: number, forecast: number) => {
        if (forecast > current * 1.1) return '📈';
        if (forecast < current * 0.9) return '📉';
        return '➡️';
    };

    return (
        <div className="analytics-dashboard">
            <header className="analytics-header">
                <h1>📊 Predictive Analytics</h1>
                <div className="header-controls">
                    <select
                        value={selectedHorizon}
                        onChange={(e) => {
                            setSelectedHorizon(e.target.value);
                            loadForecast();
                        }}
                    >
                        <option value="1week">1 Week</option>
                        <option value="1month">1 Month</option>
                        <option value="3months">3 Months</option>
                        <option value="6months">6 Months</option>
                    </select>
                    <button onClick={loadForecast}>Refresh</button>
                </div>
            </header>

            <nav className="analytics-tabs">
                <button
                    className={activeTab === 'predictions' ? 'active' : ''}
                    onClick={() => setActiveTab('predictions')}
                >
                    🔮 Predictions
                </button>
                <button
                    className={activeTab === 'forecast' ? 'active' : ''}
                    onClick={() => setActiveTab('forecast')}
                >
                    📈 Forecast
                </button>
                <button
                    className={activeTab === 'trends' ? 'active' : ''}
                    onClick={() => setActiveTab('trends')}
                >
                    📉 Trends
                </button>
            </nav>

            <main className="analytics-content">
                {activeTab === 'predictions' && (
                    <div className="predictions-section">
                        {predictions.length > 0 ? (
                            predictions.map(pred => (
                                <div key={pred.id} className="prediction-card">
                                    <div className="prediction-header">
                                        <span className="prediction-type">{pred.type}</span>
                                        <span className="confidence">
                                            {Math.round(pred.confidence * 100)}% confidence
                                        </span>
                                    </div>
                                    <h3>{pred.prediction}</h3>
                                    <div className="probability-bar">
                                        <div
                                            className="probability-fill"
                                            style={{
                                                width: `${pred.probability * 100}%`,
                                                backgroundColor: pred.probability > 0.7 ? '#ef4444' : pred.probability > 0.4 ? '#eab308' : '#22c55e'
                                            }}
                                        />
                                    </div>
                                    <div className="factors">
                                        <h4>Contributing Factors</h4>
                                        {pred.factors.map((factor, idx) => (
                                            <div key={idx} className="factor-item">
                                                <span className="factor-name">{factor.name}</span>
                                                <span
                                                    className="factor-impact"
                                                    style={{ color: getImpactColor(factor.impact) }}
                                                >
                                                    {factor.impact === 'positive' ? '✓' : factor.impact === 'negative' ? '✗' : '○'}
                                                </span>
                                                <div className="factor-bar">
                                                    <div
                                                        className="factor-fill"
                                                        style={{
                                                            width: `${factor.value * 100}%`,
                                                            backgroundColor: getImpactColor(factor.impact)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="recommendations">
                                        <h4>Recommendations</h4>
                                        <ul>
                                            {pred.recommendations.map((rec, idx) => (
                                                <li key={idx}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <span className="emoji">🔮</span>
                                <p>No predictions yet. Analyze code to generate insights.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'forecast' && forecast && (
                    <div className="forecast-section">
                        <div className="forecast-header">
                            <h2>{forecast.projectName}</h2>
                            <span className="horizon">Forecast: {forecast.timeHorizon}</span>
                        </div>

                        <div className="metrics-grid">
                            <div className="metric-card">
                                <h3>🐛 Bugs</h3>
                                <div className="metric-values">
                                    <span className="current">{forecast.metrics.bugs.current}</span>
                                    <span className="arrow">{getTrendIcon(forecast.metrics.bugs.current, forecast.metrics.bugs.forecast)}</span>
                                    <span className="forecast">{forecast.metrics.bugs.forecast}</span>
                                </div>
                                <span className="confidence">{Math.round(forecast.metrics.bugs.confidence * 100)}% confidence</span>
                            </div>

                            <div className="metric-card">
                                <h3>💳 Tech Debt</h3>
                                <div className="metric-values">
                                    <span className="current">{forecast.metrics.techDebt.current}</span>
                                    <span className="arrow">{getTrendIcon(forecast.metrics.techDebt.current, forecast.metrics.techDebt.forecast)}</span>
                                    <span className="forecast">{forecast.metrics.techDebt.forecast}</span>
                                </div>
                                <span className="confidence">{Math.round(forecast.metrics.techDebt.confidence * 100)}% confidence</span>
                            </div>

                            <div className="metric-card">
                                <h3>✅ Coverage</h3>
                                <div className="metric-values">
                                    <span className="current">{forecast.metrics.coverage.current}%</span>
                                    <span className="arrow">{getTrendIcon(forecast.metrics.coverage.current, forecast.metrics.coverage.forecast)}</span>
                                    <span className="forecast">{forecast.metrics.coverage.forecast}%</span>
                                </div>
                                <span className="confidence">{Math.round(forecast.metrics.coverage.confidence * 100)}% confidence</span>
                            </div>

                            <div className="metric-card">
                                <h3>🚀 Velocity</h3>
                                <div className="metric-values">
                                    <span className="current">{forecast.metrics.velocity.current}</span>
                                    <span className="arrow">{getTrendIcon(forecast.metrics.velocity.current, forecast.metrics.velocity.forecast)}</span>
                                    <span className="forecast">{forecast.metrics.velocity.forecast}</span>
                                </div>
                                <span className="confidence">{Math.round(forecast.metrics.velocity.confidence * 100)}% confidence</span>
                            </div>
                        </div>

                        <div className="opportunities">
                            <h3>💡 Opportunities</h3>
                            <ul>
                                {forecast.opportunities.map((opp, idx) => (
                                    <li key={idx}>{opp}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'trends' && (
                    <div className="trends-section">
                        <div className="trend-chart-placeholder">
                            <span className="emoji">📊</span>
                            <p>Trend visualization coming soon</p>
                            <small>Historical data will power predictive charts</small>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnalyticsDashboard;
