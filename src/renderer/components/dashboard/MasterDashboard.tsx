/**
 * 🎛️ MasterDashboard - Unified Queen 3 Max Control Center
 * 
 * Central hub unifying all Queen 3 Max capabilities:
 * - Project Health overview
 * - AI Personality selector
 * - Plugin Marketplace
 * - Multi-Modal input
 * - Deployment status
 * - Collaboration sessions
 * - v5.1 Enhancement Systems
 */

import React, { useState, useEffect } from 'react';
import { ProjectHealthPanel } from '../health/ProjectHealthPanel';
import { PluginMarketplace } from '../plugins/PluginMarketplace';
import { PersonalitySelector } from '../personality/PersonalitySelector';
import { AgentSwarmVisualization } from '../swarm/AgentSwarmVisualization';
import { VoiceFirstInterface } from '../voice/VoiceFirstInterface';
// Revolutionary Components
import { KnowledgeGraphVisualization } from '../knowledge/KnowledgeGraphVisualization';
import { TemporalReplayVisualization } from '../temporal/TemporalReplayVisualization';
import { ModelRouterDashboard } from '../router/ModelRouterDashboard';
import { BDISwarmControlPanel } from '../bdi/BDISwarmControlPanel';
import { SecurityFortressDashboard } from '../security/SecurityFortressDashboard';
import { IntentAlignmentDashboard } from '../intent/IntentAlignmentDashboard';
import { BusinessArchitectDashboard } from '../business/BusinessArchitectDashboard';
// v5.1 Enhancement Components
import ReasoningChainVisualizer from '../reasoning/ReasoningChainVisualizer';
import { EvolutionDashboard } from './EvolutionDashboard';

// Types
interface DashboardStats {
    health: { score: number; grade: string; trend: string };
    plugins: { installed: number; total: number };
    personality: { current: string; stress: string };
    deployments: { active: number; recent: any[] };
    collaborations: { sessions: number; participants: number };
}

type TabId = 'overview' | 'health' | 'plugins' | 'personality' | 'multimodal' | 'deploy' | 'collab' | 'swarm' | 'voice' | 'knowledge' | 'temporal' | 'router' | 'bdi' | 'security' | 'intent' | 'business' | 'reasoning' | 'insights' | 'evolution';

export const MasterDashboard: React.FC<{ projectPath?: string }> = ({ projectPath }) => {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Load health stats
            let healthStats = { score: 0, grade: 'N/A', trend: 'unknown' };
            if (projectPath) {
                const healthResult = await (window as any).shadowAPI?.health?.get?.(projectPath);
                if (healthResult?.success) {
                    healthStats = {
                        score: healthResult.health.overall.score,
                        grade: healthResult.health.overall.grade,
                        trend: healthResult.health.overall.trend
                    };
                }
            }

            // Load plugin stats
            let pluginStats = { installed: 0, total: 0 };
            const pluginResult = await (window as any).shadowAPI?.pluginMarketplace?.getInstalled?.();
            if (pluginResult?.success) {
                pluginStats.installed = pluginResult.plugins?.length || 0;
            }
            const allPlugins = await (window as any).shadowAPI?.pluginMarketplace?.search?.('');
            if (allPlugins?.success) {
                pluginStats.total = allPlugins.total || 8;
            }

            // Load personality stats
            let personalityStats = { current: 'Default', stress: 'calm' };
            const personalityResult = await (window as any).shadowAPI?.personality?.getCurrent?.();
            if (personalityResult?.success) {
                personalityStats.current = personalityResult.personality?.name || 'Default';
            }
            const stressResult = await (window as any).shadowAPI?.personality?.detectStress?.();
            if (stressResult?.success) {
                personalityStats.stress = stressResult.stress?.level || 'calm';
            }

            // Load deployment stats
            let deployStats = { active: 0, recent: [] };
            const deployResult = await (window as any).shadowAPI?.deploy?.getHistory?.();
            if (deployResult?.success) {
                deployStats = {
                    active: deployResult.active || 0,
                    recent: deployResult.recent || []
                };
            }

            // Load collaboration stats
            let collabStats = { sessions: 0, participants: 0 };
            const collabResult = await (window as any).shadowAPI?.collabEngine?.getSessions?.();
            if (collabResult?.success) {
                collabStats = {
                    sessions: collabResult.sessions?.length || 0,
                    participants: collabResult.totalParticipants || 0
                };
            }

            setStats({
                health: healthStats,
                plugins: pluginStats,
                personality: personalityStats,
                deployments: deployStats,
                collaborations: collabStats
            });
        } catch (err) {
            console.error('Failed to load dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // Refresh every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, [projectPath]);

    const tabs: { id: TabId; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'health', label: 'Health', icon: '💊' },
        { id: 'plugins', label: 'Plugins', icon: '🔌' },
        { id: 'personality', label: 'AI Persona', icon: '🎭' },
        { id: 'swarm', label: 'Agent Swarm', icon: '🐝' },
        { id: 'voice', label: 'Voice', icon: '🎤' },
        { id: 'multimodal', label: 'Multi-Modal', icon: '🎨' },
        { id: 'deploy', label: 'Deploy', icon: '🚀' },
        { id: 'collab', label: 'Collaborate', icon: '👥' },
        // Revolutionary Systems
        { id: 'knowledge', label: 'Knowledge', icon: '🧠' },
        { id: 'bdi', label: 'BDI Swarm', icon: '🤖' },
        { id: 'security', label: 'Security', icon: '🛡️' },
        { id: 'intent', label: 'Intent', icon: '🎯' },
        { id: 'temporal', label: 'Temporal', icon: '⏰' },
        { id: 'business', label: 'Business', icon: '🏢' },
        { id: 'router', label: 'Router', icon: '🔀' },
        // v5.1 Enhancement Systems
        { id: 'reasoning', label: 'Reasoning', icon: '💭' },
        { id: 'insights', label: 'Insights', icon: '💡' },
        { id: 'evolution', label: 'Evolution', icon: '🧬' }
    ];

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            'A': '#10B981', 'B': '#3B82F6', 'C': '#F59E0B', 'D': '#F97316', 'F': '#EF4444'
        };
        return colors[grade] || '#6B7280';
    };

    const getStressColor = (level: string) => {
        const colors: Record<string, string> = {
            'calm': '#10B981', 'focused': '#3B82F6', 'frustrated': '#F59E0B', 'overwhelmed': '#EF4444'
        };
        return colors[level] || '#6B7280';
    };

    const renderOverview = () => (
        <div style={styles.overview}>
            <h2 style={styles.overviewTitle}>🎛️ Queen 3 Max Control Center</h2>

            {loading ? (
                <div style={styles.loading}>⏳ Loading dashboard...</div>
            ) : stats ? (
                <div style={styles.statsGrid}>
                    {/* Health Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('health')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>💊</span>
                            <span>Project Health</span>
                        </div>
                        <div style={styles.cardValue}>
                            <span style={{
                                ...styles.grade,
                                backgroundColor: getGradeColor(stats.health.grade)
                            }}>
                                {stats.health.grade}
                            </span>
                            <span style={styles.score}>{stats.health.score}/100</span>
                        </div>
                        <div style={styles.cardMeta}>
                            Trend: {stats.health.trend}
                        </div>
                    </div>

                    {/* Plugins Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('plugins')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>🔌</span>
                            <span>Plugins</span>
                        </div>
                        <div style={styles.cardValue}>
                            <span style={styles.bigNumber}>{stats.plugins.installed}</span>
                            <span style={styles.cardSuffix}>of {stats.plugins.total} installed</span>
                        </div>
                        <div style={styles.cardMeta}>
                            Click to browse marketplace
                        </div>
                    </div>

                    {/* Personality Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('personality')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>🎭</span>
                            <span>AI Persona</span>
                        </div>
                        <div style={styles.cardValue}>
                            <span style={styles.personaName}>{stats.personality.current}</span>
                        </div>
                        <div style={{
                            ...styles.stressBadge,
                            backgroundColor: getStressColor(stats.personality.stress) + '20',
                            color: getStressColor(stats.personality.stress)
                        }}>
                            Stress: {stats.personality.stress}
                        </div>
                    </div>

                    {/* Deployments Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('deploy')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>🚀</span>
                            <span>Deployments</span>
                        </div>
                        <div style={styles.cardValue}>
                            <span style={styles.bigNumber}>{stats.deployments.active}</span>
                            <span style={styles.cardSuffix}>active</span>
                        </div>
                        <div style={styles.cardMeta}>
                            25+ deployment targets
                        </div>
                    </div>

                    {/* Collaboration Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('collab')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>👥</span>
                            <span>Collaboration</span>
                        </div>
                        <div style={styles.cardValue}>
                            <span style={styles.bigNumber}>{stats.collaborations.sessions}</span>
                            <span style={styles.cardSuffix}>sessions</span>
                        </div>
                        <div style={styles.cardMeta}>
                            {stats.collaborations.participants} participants
                        </div>
                    </div>

                    {/* Multi-Modal Card */}
                    <div style={styles.statCard} onClick={() => setActiveTab('multimodal')}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardIcon}>🎨</span>
                            <span>Multi-Modal</span>
                        </div>
                        <div style={styles.featureList}>
                            <span style={styles.featureItem}>✓ Sketch to Code</span>
                            <span style={styles.featureItem}>✓ Voice Commands</span>
                            <span style={styles.featureItem}>✓ Figma Import</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={styles.noData}>No data available</div>
            )}

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                <h3>⚡ Quick Actions</h3>
                <div style={styles.actionButtons}>
                    <button style={styles.actionButton} onClick={() => loadStats()}>
                        🔄 Refresh Dashboard
                    </button>
                    <button style={styles.actionButton} onClick={() => setActiveTab('health')}>
                        🔍 Analyze Health
                    </button>
                    <button style={styles.actionButton} onClick={() => setActiveTab('plugins')}>
                        📦 Install Plugins
                    </button>
                    <button style={styles.actionButton} onClick={() => setActiveTab('personality')}>
                        🎭 Switch Persona
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMultiModal = () => (
        <div style={styles.tabContent}>
            <h3>🎨 Multi-Modal Input</h3>
            <div style={styles.featureCards}>
                <div style={styles.featureCard}>
                    <h4>✏️ Sketch to Code</h4>
                    <p>Upload wireframes or mockups and generate working code</p>
                    <button style={styles.featureButton}>Upload Sketch</button>
                </div>
                <div style={styles.featureCard}>
                    <h4>🎤 Voice Commands</h4>
                    <p>Speak your code requests and let AI generate</p>
                    <button style={styles.featureButton}>Start Voice</button>
                </div>
                <div style={styles.featureCard}>
                    <h4>🎨 Figma Import</h4>
                    <p>Import designs directly from Figma</p>
                    <button style={styles.featureButton}>Connect Figma</button>
                </div>
                <div style={styles.featureCard}>
                    <h4>📸 Screenshot to Component</h4>
                    <p>Convert screenshots into React components</p>
                    <button style={styles.featureButton}>Upload Screenshot</button>
                </div>
            </div>
        </div>
    );

    const renderDeploy = () => (
        <div style={styles.tabContent}>
            <h3>🚀 Deployment Orchestrator</h3>
            <p style={styles.subtitle}>Deploy to 25+ platforms with a single click</p>
            <div style={styles.deployCategories}>
                {['Web', 'Mobile', 'Desktop', 'Serverless', 'Container'].map(cat => (
                    <div key={cat} style={styles.deployCategory}>
                        <h4>{cat}</h4>
                        <div style={styles.deployTargets}>
                            {cat === 'Web' && ['Vercel', 'Netlify', 'Firebase'].map(t => (
                                <button key={t} style={styles.deployTarget}>{t}</button>
                            ))}
                            {cat === 'Mobile' && ['App Store', 'Play Store', 'TestFlight'].map(t => (
                                <button key={t} style={styles.deployTarget}>{t}</button>
                            ))}
                            {cat === 'Desktop' && ['Steam', 'itch.io', 'Mac App Store'].map(t => (
                                <button key={t} style={styles.deployTarget}>{t}</button>
                            ))}
                            {cat === 'Serverless' && ['Lambda', 'Workers', 'Deno'].map(t => (
                                <button key={t} style={styles.deployTarget}>{t}</button>
                            ))}
                            {cat === 'Container' && ['Docker Hub', 'GCR', 'ECR'].map(t => (
                                <button key={t} style={styles.deployTarget}>{t}</button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCollab = () => (
        <div style={styles.tabContent}>
            <h3>👥 Real-Time Collaboration</h3>
            <p style={styles.subtitle}>CRDT-based multi-user editing</p>
            <div style={styles.collabActions}>
                <button style={styles.collabButton}>🆕 Create Session</button>
                <button style={styles.collabButton}>🔗 Join Session</button>
            </div>
            <div style={styles.collabInfo}>
                <p>• Real-time cursor tracking</p>
                <p>• AI-powered conflict resolution</p>
                <p>• Voice messages with transcription</p>
                <p>• Change summaries</p>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            {/* Tab Navigation */}
            <div style={styles.tabBar}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab.id ? styles.tabActive : {})
                        }}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={styles.content}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'health' && <ProjectHealthPanel projectPath={projectPath} />}
                {activeTab === 'plugins' && <PluginMarketplace />}
                {activeTab === 'personality' && <PersonalitySelector />}
                {activeTab === 'multimodal' && renderMultiModal()}
                {activeTab === 'deploy' && renderDeploy()}
                {activeTab === 'collab' && renderCollab()}
                {activeTab === 'swarm' && <AgentSwarmVisualization />}
                {activeTab === 'voice' && <VoiceFirstInterface />}
                {/* Revolutionary Systems */}
                {activeTab === 'knowledge' && <KnowledgeGraphVisualization />}
                {activeTab === 'bdi' && <BDISwarmControlPanel />}
                {activeTab === 'security' && <SecurityFortressDashboard />}
                {activeTab === 'intent' && <IntentAlignmentDashboard />}
                {activeTab === 'temporal' && <TemporalReplayVisualization />}
                {activeTab === 'business' && <BusinessArchitectDashboard />}
                {activeTab === 'router' && <ModelRouterDashboard />}
                {/* v5.1 Enhancement Systems */}
                {activeTab === 'reasoning' && <ReasoningChainVisualizer />}
                {activeTab === 'insights' && <InsightsDashboard />}
                {activeTab === 'evolution' && <EvolutionDashboard />}
            </div>
        </div>
    );
};

// v5.1 Insights Dashboard Component
const InsightsDashboard: React.FC = () => {
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadInsights = async () => {
            try {
                const result = await (window as any).shadowAPI?.proactive?.getInsights?.();
                if (result) {
                    setInsights(result);
                }
            } catch (err) {
                console.error('Failed to load insights:', err);
            } finally {
                setLoading(false);
            }
        };
        loadInsights();
    }, []);

    const getImpactColor = (impact: string) => {
        return impact === 'high' ? '#EF4444' : impact === 'medium' ? '#F59E0B' : '#10B981';
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>💡</span> Proactive Insights
            </h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                    Loading insights...
                </div>
            ) : insights.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {insights.map((insight, idx) => (
                        <div key={idx} style={{
                            padding: '16px',
                            backgroundColor: '#1F2937',
                            borderRadius: '12px',
                            borderLeft: `4px solid ${getImpactColor(insight.impact)}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>{insight.title}</h4>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    backgroundColor: getImpactColor(insight.impact) + '20',
                                    color: getImpactColor(insight.impact)
                                }}>
                                    {insight.impact} impact
                                </span>
                            </div>
                            <p style={{ color: '#9CA3AF', marginTop: '8px', marginBottom: '8px' }}>
                                {insight.description}
                            </p>
                            {insight.suggestedAction && (
                                <button style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#3B82F6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}>
                                    {insight.suggestedAction}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '60px',
                    backgroundColor: '#1F2937',
                    borderRadius: '12px'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
                    <h3>All Clear!</h3>
                    <p style={{ color: '#9CA3AF' }}>No proactive insights at the moment. Keep coding!</p>
                </div>
            )}
        </div>
    );
};

// v6.0 Evolution Dashboard is now imported from './EvolutionDashboard'

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111827',
        color: '#F9FAFB',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        borderRadius: '12px',
        overflow: 'hidden'
    },
    tabBar: {
        display: 'flex',
        gap: '4px',
        padding: '12px',
        backgroundColor: '#1F2937',
        borderBottom: '1px solid #374151',
        overflowX: 'auto'
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        backgroundColor: 'transparent',
        color: '#9CA3AF',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
    },
    tabActive: {
        backgroundColor: '#3B82F6',
        color: 'white'
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: '20px'
    },
    overview: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    overviewTitle: {
        margin: 0,
        marginBottom: '8px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
    },
    statCard: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        cursor: 'pointer',
        border: '1px solid #374151',
        transition: 'transform 0.2s, border-color 0.2s'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '14px',
        color: '#9CA3AF'
    },
    cardIcon: {
        fontSize: '20px'
    },
    cardValue: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
    },
    grade: {
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white'
    },
    score: {
        fontSize: '18px',
        fontWeight: 600
    },
    bigNumber: {
        fontSize: '32px',
        fontWeight: 'bold'
    },
    cardSuffix: {
        color: '#9CA3AF',
        fontSize: '14px'
    },
    cardMeta: {
        fontSize: '12px',
        color: '#6B7280'
    },
    personaName: {
        fontSize: '20px',
        fontWeight: 600
    },
    stressBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '13px',
        marginTop: '8px'
    },
    featureList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    featureItem: {
        fontSize: '13px',
        color: '#10B981'
    },
    quickActions: {
        marginTop: '16px'
    },
    actionButtons: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        marginTop: '12px'
    },
    actionButton: {
        padding: '12px 20px',
        backgroundColor: '#374151',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    tabContent: {
        padding: '20px',
        backgroundColor: '#1F2937',
        borderRadius: '12px'
    },
    subtitle: {
        color: '#9CA3AF',
        marginBottom: '20px'
    },
    featureCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '16px'
    },
    featureCard: {
        padding: '20px',
        backgroundColor: '#374151',
        borderRadius: '12px'
    },
    featureButton: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
    },
    deployCategories: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    deployCategory: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '12px'
    },
    deployTargets: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '12px'
    },
    deployTarget: {
        padding: '8px 16px',
        backgroundColor: '#4B5563',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer'
    },
    collabActions: {
        display: 'flex',
        gap: '12px',
        marginBottom: '20px'
    },
    collabButton: {
        padding: '12px 24px',
        backgroundColor: '#3B82F6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    collabInfo: {
        padding: '16px',
        backgroundColor: '#374151',
        borderRadius: '8px'
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#9CA3AF'
    },
    noData: {
        textAlign: 'center',
        padding: '40px',
        color: '#6B7280'
    }
};

export default MasterDashboard;
