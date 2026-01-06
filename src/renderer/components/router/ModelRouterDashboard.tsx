/**
 * 🔀 Model Router Dashboard
 * 
 * Visualize and manage intelligent model routing:
 * - Model performance metrics
 * - Cost optimization
 * - Routing decisions
 * - Fallback chains
 */

import React, { useState, useEffect } from 'react';

interface ModelConfig {
    id: string;
    provider: string;
    name: string;
    displayName: string;
    capabilities: {
        maxContext: number;
        supportsVision: boolean;
        supportsFunctionCalling: boolean;
    };
    performance: {
        averageLatency: number;
        reliability: number;
    };
    cost: {
        input: number;
        output: number;
    };
    strengths: string[];
    recommendedTasks: string[];
}

interface ModelMetrics {
    modelId: string;
    totalRequests: number;
    successfulRequests: number;
    averageLatency: number;
    totalCost: number;
    errorRate: number;
}

export const ModelRouterDashboard: React.FC = () => {
    const [models, setModels] = useState<ModelConfig[]>([]);
    const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
    const [costReport, setCostReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState<ModelConfig | null>(null);
    const [testTaskType, setTestTaskType] = useState('code_generation');

    const loadData = async () => {
        try {
            setLoading(true);
            const [modelsResult, metricsResult, costResult] = await Promise.all([
                (window as any).shadowAPI.modelRouter?.getModels() || [],
                (window as any).shadowAPI.modelRouter?.getAllMetrics() || [],
                (window as any).shadowAPI.modelRouter?.getCostReport() || null
            ]);
            setModels(modelsResult);
            setMetrics(metricsResult);
            setCostReport(costResult);
        } catch (error) {
            console.error('Failed to load model router data:', error);
        } finally {
            setLoading(false);
        }
    };

    const testRoute = async () => {
        try {
            const result = await (window as any).shadowAPI.modelRouter.route({
                taskType: testTaskType,
                inputTokens: 5000,
                priority: 'balanced'
            });
            alert(`Selected: ${result.selectedModel.displayName}\n\nReason: ${result.reasoning}\n\nEstimated Cost: $${result.estimatedCost.toFixed(4)}\nEstimated Latency: ${result.estimatedLatency}ms`);
        } catch (error) {
            console.error('Failed to test route:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getMetricsForModel = (modelId: string) =>
        metrics.find(m => m.modelId === modelId);

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'openai': return '#10a37f';
            case 'anthropic': return '#d97706';
            case 'google': return '#4285f4';
            case 'ollama': return '#e11d48';
            default: return '#6366f1';
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
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
                        🔀 Intelligent Model Router
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        Cost/quality/latency optimization for AI models
                    </p>
                </div>
                <button
                    onClick={loadData}
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTop: '3px solid #6366f1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <div style={{ opacity: 0.6 }}>Loading model data...</div>
                </div>
            ) : (
                <>
                    {/* Cost Summary */}
                    {costReport && (
                        <div style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', opacity: 0.7 }}>Total Cost</div>
                                    <div style={{ fontSize: '28px', fontWeight: 600 }}>
                                        ${costReport.totalCost.toFixed(2)}
                                    </div>
                                </div>
                                {costReport.potentialSavings > 0 && (
                                    <div style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        padding: '12px 20px',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontSize: '12px', opacity: 0.7 }}>Potential Savings</div>
                                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#10b981' }}>
                                            ${costReport.potentialSavings.toFixed(2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {costReport.recommendations?.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    {costReport.recommendations.slice(0, 2).map((rec: string, i: number) => (
                                        <div key={i} style={{
                                            fontSize: '13px',
                                            opacity: 0.8,
                                            padding: '4px 0'
                                        }}>
                                            💡 {rec}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Test Routing */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
                                Test Task Type
                            </label>
                            <select
                                value={testTaskType}
                                onChange={e => setTestTaskType(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff'
                                }}
                            >
                                <option value="code_generation">Code Generation</option>
                                <option value="code_review">Code Review</option>
                                <option value="debugging">Debugging</option>
                                <option value="documentation">Documentation</option>
                                <option value="chat">Chat</option>
                                <option value="analysis">Analysis</option>
                                <option value="vision">Vision</option>
                                <option value="fast_response">Fast Response</option>
                            </select>
                        </div>
                        <button
                            onClick={testRoute}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            🎯 Test Route
                        </button>
                    </div>

                    {/* Models Grid */}
                    <h3 style={{ fontSize: '16px', marginBottom: '16px', opacity: 0.8 }}>
                        Available Models ({models.length})
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {models.map(model => {
                            const modelMetrics = getMetricsForModel(model.id);
                            return (
                                <div
                                    key={model.id}
                                    onClick={() => setSelectedModel(model)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        borderLeft: `3px solid ${getProviderColor(model.provider)}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                {model.displayName}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                opacity: 0.7,
                                                textTransform: 'capitalize'
                                            }}>
                                                {model.provider}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: model.cost.input === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {model.cost.input === 0 ? '🆓 Free' : `$${(model.cost.input + model.cost.output).toFixed(2)}/M`}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginTop: '12px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <span style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px'
                                        }}>
                                            ⚡ {model.performance.averageLatency}ms
                                        </span>
                                        <span style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px'
                                        }}>
                                            📝 {(model.capabilities.maxContext / 1000).toFixed(0)}K ctx
                                        </span>
                                        {model.capabilities.supportsVision && (
                                            <span style={{
                                                background: 'rgba(99, 102, 241, 0.2)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '11px'
                                            }}>
                                                👁️ Vision
                                            </span>
                                        )}
                                    </div>

                                    {modelMetrics && modelMetrics.totalRequests > 0 && (
                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '12px',
                                            opacity: 0.7
                                        }}>
                                            {modelMetrics.totalRequests} requests •
                                            {((1 - modelMetrics.errorRate) * 100).toFixed(1)}% success •
                                            ${modelMetrics.totalCost.toFixed(2)} total
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Model Detail Modal */}
            {selectedModel && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setSelectedModel(null)}
                >
                    <div
                        style={{
                            background: '#0f172a',
                            borderRadius: '16px',
                            padding: '24px',
                            width: '500px',
                            maxWidth: '90%'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>{selectedModel.displayName}</h3>
                            <button
                                onClick={() => setSelectedModel(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '20px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Strengths</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedModel.strengths.map((s, i) => (
                                    <span key={i} style={{
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Recommended Tasks</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selectedModel.recommendedTasks.map((t, i) => (
                                    <span key={i} style={{
                                        background: 'rgba(99, 102, 241, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', opacity: 0.6 }}>Max Context</div>
                                <div style={{ fontSize: '18px', fontWeight: 500 }}>
                                    {(selectedModel.capabilities.maxContext / 1000).toFixed(0)}K
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', opacity: 0.6 }}>Avg Latency</div>
                                <div style={{ fontSize: '18px', fontWeight: 500 }}>
                                    {selectedModel.performance.averageLatency}ms
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', opacity: 0.6 }}>Reliability</div>
                                <div style={{ fontSize: '18px', fontWeight: 500 }}>
                                    {(selectedModel.performance.reliability * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', opacity: 0.6 }}>Cost</div>
                                <div style={{ fontSize: '18px', fontWeight: 500 }}>
                                    {selectedModel.cost.input === 0 ? 'Free' : `$${(selectedModel.cost.input + selectedModel.cost.output).toFixed(2)}/M`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ModelRouterDashboard;
