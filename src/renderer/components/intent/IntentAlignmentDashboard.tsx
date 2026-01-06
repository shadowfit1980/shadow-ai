/**
 * 🎯 Intent Alignment Dashboard
 * 
 * Visualize and manage user intent understanding:
 * - Intent parsing and validation
 * - Tradeoff analysis
 * - Skill level adaptation
 * - Intent history
 */

import React, { useState, useEffect } from 'react';

interface ParsedIntent {
    id: string;
    rawInput: string;
    category: string;
    action: string;
    target: string;
    context?: string[];
    constraints?: string[];
    ambiguities: { aspect: string; clarifyingQuestion: string }[];
    confidence: number;
    timestamp: string;
}

interface UserProfile {
    skillLevel: string;
    preferredExplanationDepth: string;
    domains: string[];
    languages: string[];
}

export const IntentAlignmentDashboard: React.FC = () => {
    const [userInput, setUserInput] = useState('');
    const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
    const [history, setHistory] = useState<ParsedIntent[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'analyze' | 'history' | 'profile'>('analyze');

    const loadData = async () => {
        try {
            const [historyResult, profileResult] = await Promise.all([
                (window as any).shadowAPI.intentAlignment?.getHistory() || [],
                (window as any).shadowAPI.intentAlignment?.getProfile() || null
            ]);
            setHistory(historyResult);
            setProfile(profileResult);
        } catch (error) {
            console.error('Failed to load intent data:', error);
        }
    };

    const parseIntent = async () => {
        if (!userInput.trim()) return;

        try {
            setLoading(true);
            const result = await (window as any).shadowAPI.intentAlignment.parse(userInput);
            setParsedIntent(result);
            loadData(); // Refresh history
        } catch (error) {
            console.error('Failed to parse intent:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            await (window as any).shadowAPI.intentAlignment.setProfile({
                ...profile,
                ...updates
            });
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            create: '🏗️',
            modify: '✏️',
            debug: '🐛',
            explain: '💡',
            review: '🔍',
            deploy: '🚀',
            test: '✅',
            optimize: '⚡',
            integrate: '🔗',
            migrate: '📦',
            document: '📝',
            chat: '💬',
            analyze: '📊'
        };
        return icons[category] || '🎯';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%)',
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
                        🎯 Intent Alignment Engine
                    </h2>
                    <p style={{ margin: '8px 0 0', opacity: 0.7, fontSize: '14px' }}>
                        TRUE goal understanding with tradeoff analysis
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '20px'
            }}>
                {(['analyze', 'history', 'profile'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                            padding: '12px 20px',
                            color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontWeight: 500
                        }}
                    >
                        {tab === 'analyze' && '🎯 '}{tab === 'history' && '📜 '}{tab === 'profile' && '👤 '}
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'analyze' && (
                <div>
                    {/* Input */}
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        <textarea
                            placeholder="Describe what you want to build or accomplish..."
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                marginBottom: '12px'
                            }}
                        />
                        <button
                            onClick={parseIntent}
                            disabled={loading || !userInput.trim()}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 500,
                                opacity: loading || !userInput.trim() ? 0.5 : 1
                            }}
                        >
                            {loading ? '🔍 Analyzing...' : '🎯 Analyze Intent'}
                        </button>
                    </div>

                    {/* Parsed Result */}
                    {parsedIntent && (
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '32px' }}>{getCategoryIcon(parsedIntent.category)}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '18px', textTransform: 'capitalize' }}>
                                            {parsedIntent.category}
                                        </div>
                                        <div style={{ opacity: 0.7 }}>{parsedIntent.action}</div>
                                    </div>
                                </div>
                                <div style={{
                                    background: `rgba(59, 130, 246, ${parsedIntent.confidence})`,
                                    padding: '8px 16px',
                                    borderRadius: '8px'
                                }}>
                                    {(parsedIntent.confidence * 100).toFixed(0)}% confident
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Target</div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '12px',
                                    borderRadius: '8px'
                                }}>
                                    {parsedIntent.target}
                                </div>
                            </div>

                            {parsedIntent.context && parsedIntent.context.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>Context</div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {parsedIntent.context.map((c, i) => (
                                            <span key={i} style={{
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                fontSize: '13px'
                                            }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {parsedIntent.ambiguities.length > 0 && (
                                <div style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '8px',
                                    padding: '16px'
                                }}>
                                    <div style={{ fontWeight: 500, marginBottom: '12px', color: '#f59e0b' }}>
                                        ⚠️ Clarifications Needed
                                    </div>
                                    {parsedIntent.ambiguities.map((amb, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '6px',
                                            padding: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <div style={{ fontSize: '12px', opacity: 0.7 }}>{amb.aspect}</div>
                                            <div style={{ fontWeight: 500 }}>{amb.clarifyingQuestion}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {history.length === 0 ? (
                        <EmptyState message="No intent history yet" />
                    ) : (
                        history.map((intent, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '16px',
                                borderLeft: `3px solid #3b82f6`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span>{getCategoryIcon(intent.category)}</span>
                                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{intent.category}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                                        {new Date(intent.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ opacity: 0.8 }}>{intent.rawInput}</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'profile' && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '20px'
                }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '16px' }}>👤 Your Profile</h3>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                            Skill Level
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                                <button
                                    key={level}
                                    onClick={() => updateProfile({ skillLevel: level })}
                                    style={{
                                        background: profile?.skillLevel === level ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 16px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', opacity: 0.7, marginBottom: '8px' }}>
                            Preferred Explanation Depth
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['brief', 'normal', 'detailed', 'comprehensive'].map(depth => (
                                <button
                                    key={depth}
                                    onClick={() => updateProfile({ preferredExplanationDepth: depth })}
                                    style={{
                                        background: profile?.preferredExplanationDepth === depth ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 16px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {depth}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p style={{ fontSize: '12px', opacity: 0.6, margin: 0 }}>
                        Shadow AI adapts its responses based on your profile, providing more or less detail as needed.
                    </p>
                </div>
            )}
        </div>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
        <div>{message}</div>
    </div>
);

export default IntentAlignmentDashboard;
