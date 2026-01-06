import { useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import AutonomousChatV2 from './components/AutonomousChatV2';
import CodeEditor from './components/CodeEditor';
import FlowchartViewer from './components/FlowchartViewer';
import ModelDashboard from './components/ModelDashboard';
import PreviewArea from './components/PreviewArea';
import SettingsPanel from './components/SettingsPanel';
const VoiceControl = lazy(() => import('./components/VoiceControl'));
import ErrorBoundary from './components/ErrorBoundary';
import CollaborationPanel from './components/CollaborationPanel';
import PluginMarketplace from './components/PluginMarketplace';
import AgentActivityMonitor from './components/AgentActivityMonitor';
import TaskQueuePanel from './components/TaskQueuePanel';
import DesignStudio from './components/DesignStudio';
import TestingPanel from './components/TestingPanel';
import { AutonomousWorkflowPanel } from './components/AutonomousWorkflowPanel';
// New Dashboard Components
import SafetyDashboard from './components/SafetyDashboard';
import MetricsDashboard from './components/MetricsDashboard';
import ALOpsDashboard from './components/ALOpsDashboard';
import PatternLibrary from './components/PatternLibrary';
import SnapshotManager from './components/SnapshotManager';
// Agent Enhancement Components
import NotificationCenter from './components/NotificationCenter';
import AutomationDashboard from './components/AutomationDashboard';
import AuditLogViewer from './components/AuditLogViewer';
import MemoryManager from './components/MemoryManager';
import OrchestrationPanel from './components/OrchestrationPanel';
import ImprovementDashboard from './components/ImprovementDashboard';
// Code Intelligence
import ContextGraphViewer from './components/ContextGraphViewer';
// Workflow Builder
import VisualWorkflowBuilder from './components/VisualWorkflowBuilder';
// Analytics
import AnalyticsDashboard from './components/AnalyticsDashboard';
// New Features
import ModelSelector from './components/ModelSelector';
import ProjectGenerator from './components/ProjectGenerator';
import CodeSnippets from './components/CodeSnippets';
import QuickActions from './components/QuickActions';
// Revolutionary v5.0 Dashboard
import { MasterDashboard } from './components/dashboard';
// Files Panel
import FilesPanel from './components/FilesPanel';
// Model Exploration
import ExploreModelsPage from './components/ExploreModelsPage';
// IDE Layout
import IDELayout from './components/IDELayout';
// UESE Dashboard
import UESEDashboard from './components/UESEDashboard';
// Template Gallery & Theme Editor
import TemplateGallery from './components/TemplateGallery';
import ThemeEditor from './components/ThemeEditor';

function App() {
    const {
        models,
        currentModel,
        setModels,
        setCurrentModel,
        activeTab,
        setActiveTab,
        showSettings,
        setShowSettings,
        showPluginMarketplace,
        setShowPluginMarketplace,
        showCollaboration,
        setShowCollaboration,
        voiceEnabled,
        setVoiceEnabled,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
    } = useAppStore();

    // Initial load
    useEffect(() => {
        refreshModels();
        window.shadowAPI.listPlugins().then(useAppStore.getState().setPlugins);
    }, []);

    const refreshModels = async () => {
        setIsLoading(true);
        setLoadingMessage('Loading AI models...');
        try {
            const availableModels = await window.shadowAPI.listModels();
            // Safety: ensure we have an array even if API returns null
            const modelList = Array.isArray(availableModels) ? availableModels : [];
            setModels(modelList);
            if (modelList.length > 0 && !currentModel) {
                setCurrentModel(modelList[0]);
            }
        } catch (error) {
            console.error('Failed to load models:', error);
            setModels([]); // Ensure empty array on error
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleModelSelect = async (modelId: string) => {
        const model = models.find((m) => m.id === modelId);
        if (model) {
            setCurrentModel(model);
            await window.shadowAPI.selectModel(modelId);
        }
    };

    const handleVoiceCommand = async (text: string) => {
        try {
            // Show processing state
            setIsLoading(true);
            setLoadingMessage('Processing voice command...');

            // Process via backend
            const result = await window.shadowAPI.processVoiceCommand(text);

            if (result.type === 'action') {
                // Speak response
                const { useSpeech } = await import('./components/VoiceControl');
                const { speak } = useSpeech();
                speak(result.content);

                // Add to chat
                const userMsg = { role: 'user' as const, content: text, timestamp: new Date() };
                const agentMsg = { role: 'agent' as const, content: result.content, timestamp: new Date() };
                // Note: We need to update messages state, but it's inside PromptEditor. 
                // For now, we just speak it. Ideally, we should have a global message store.
                // Since we moved state to store.ts, we can use that!
                useAppStore.getState().addMessage(userMsg);
                useAppStore.getState().addMessage(agentMsg);

            } else if (result.type === 'chat') {
                // Treat as chat message
                const userMsg = { role: 'user' as const, content: text, timestamp: new Date() };
                useAppStore.getState().addMessage(userMsg);

                const response = await window.shadowAPI.chat([userMsg]);
                const agentMsg = { role: 'agent' as const, content: response, timestamp: new Date() };
                useAppStore.getState().addMessage(agentMsg);

                // Speak response (optional, maybe too long)
                // const { useSpeech } = await import('./components/VoiceControl');
                // const { speak } = useSpeech();
                // speak(response.substring(0, 100) + '...');
            }
        } catch (error) {
            console.error('Voice command failed:', error);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-neon-cyan/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                    <motion.h1
                        className="text-2xl font-bold glow-text"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        Shadow AI v5
                    </motion.h1>
                    <span className="text-xs text-gray-500">Autonomous Engineering Agent</span>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Model Selector - New Dropdown */}
                    <ModelSelector compact onModelChange={handleModelSelect} />

                    {/* Voice Control Toggle */}
                    <button
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`cyber-button-secondary text-xs px-3 py-1 ${voiceEnabled ? 'bg-neon-cyan/20 border-neon-cyan' : ''
                            }`}
                        title="Toggle Voice Control"
                    >
                        🎤 {voiceEnabled ? 'Voice On' : 'Voice Off'}
                    </button>

                    {/* Collaboration */}
                    <button
                        onClick={() => setShowCollaboration(!showCollaboration)}
                        className="cyber-button-secondary text-xs px-3 py-1"
                        title="Collaboration"
                    >
                        👥 Collaborate
                    </button>

                    {/* Plugins */}
                    <button
                        onClick={() => setShowPluginMarketplace(!showPluginMarketplace)}
                        className="cyber-button-secondary text-xs px-3 py-1"
                        title="Plugin Marketplace"
                    >
                        🔌 Plugins
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="cyber-button-secondary text-xs px-3 py-1"
                    >
                        ⚙️ Settings
                    </button>

                    {/* Refresh Models */}
                    <button
                        onClick={refreshModels}
                        className="cyber-button-secondary text-xs px-3 py-1"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Interactive Chat (Bottom Left) */}
                <div className="h-full bg-gray-950 border-r border-gray-800">
                    <AutonomousChatV2 />
                </div>

                {/* Center Panel - Tabs */}
                <div className="flex-1 flex flex-col">
                    {/* Tab Navigation */}
                    <div className="h-12 border-b border-neon-cyan/20 bg-gray-900/50 flex items-center px-4 space-x-2 overflow-x-auto">
                        {['dashboard', 'models', 'ide', 'uese', 'templates', 'themes', 'files', 'code', 'flowchart', 'preview', 'design', 'testing', 'autonomous', 'projects', 'snippets', 'safety', 'metrics', 'ops', 'patterns', 'snapshots', 'workflow', 'analytics'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                {tab === 'dashboard' ? '🎛️ Dashboard' :
                                    tab === 'models' ? '🤖 Models' :
                                        tab === 'ide' ? '💻 IDE' :
                                            tab === 'uese' ? '🌌 UESE' :
                                                tab === 'templates' ? '📦 Templates' :
                                                    tab === 'themes' ? '🎨 Themes' :
                                                        tab === 'files' ? '📎 Files' :
                                                            tab === 'design' ? '🎨 Design' :
                                                                tab === 'testing' ? '🧪 Testing' :
                                                                    tab === 'autonomous' ? '🤖 Auto' :
                                                                        tab === 'projects' ? '🚀 Projects' :
                                                                            tab === 'snippets' ? '📋 Snippets' :
                                                                                tab === 'safety' ? '🛡️ Safety' :
                                                                                    tab === 'metrics' ? '📊 Metrics' :
                                                                                        tab === 'ops' ? '🚀 ALOps' :
                                                                                            tab === 'patterns' ? '📚 Patterns' :
                                                                                                tab === 'snapshots' ? '📸 Snapshots' :
                                                                                                    tab === 'workflow' ? '🔄 Workflow' :
                                                                                                        tab === 'analytics' ? '📊 Analytics' :
                                                                                                            tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {activeTab === 'dashboard' && (
                                <motion.div
                                    key="dashboard"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ErrorBoundary>
                                        <MasterDashboard />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'models' && (
                                <motion.div
                                    key="models"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ErrorBoundary>
                                        <ExploreModelsPage
                                            onBack={() => setActiveTab('dashboard')}
                                            onInstall={(providerId, config) => {
                                                console.log('Installing provider:', providerId, config);
                                                refreshModels();
                                            }}
                                        />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'ide' && (
                                <motion.div
                                    key="ide"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <ErrorBoundary>
                                        <IDELayout />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'uese' && (
                                <motion.div
                                    key="uese"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <ErrorBoundary>
                                        <UESEDashboard />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'templates' && (
                                <motion.div
                                    key="templates"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <ErrorBoundary>
                                        <TemplateGallery />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'themes' && (
                                <motion.div
                                    key="themes"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <ErrorBoundary>
                                        <ThemeEditor />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'files' && (
                                <motion.div
                                    key="files"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <ErrorBoundary>
                                        <FilesPanel />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'code' && (
                                <motion.div
                                    key="code"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <CodeEditor />
                                </motion.div>
                            )}
                            {activeTab === 'flowchart' && (
                                <motion.div
                                    key="flowchart"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <FlowchartViewer />
                                </motion.div>
                            )}
                            {activeTab === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <PreviewArea />
                                </motion.div>
                            )}
                            {activeTab === 'design' && (
                                <motion.div
                                    key="design"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <DesignStudio />
                                </motion.div>
                            )}
                            {activeTab === 'testing' && (
                                <motion.div
                                    key="testing"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full"
                                >
                                    <TestingPanel />
                                </motion.div>
                            )}
                            {activeTab === 'autonomous' && (
                                <motion.div
                                    key="autonomous"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <AutonomousWorkflowPanel />
                                </motion.div>
                            )}
                            {activeTab === 'projects' && (
                                <motion.div
                                    key="projects"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto p-4"
                                >
                                    <ProjectGenerator />
                                </motion.div>
                            )}
                            {activeTab === 'snippets' && (
                                <motion.div
                                    key="snippets"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-hidden"
                                >
                                    <CodeSnippets />
                                </motion.div>
                            )}
                            {activeTab === 'safety' && (
                                <motion.div
                                    key="safety"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ErrorBoundary>
                                        <SafetyDashboard />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'metrics' && (
                                <motion.div
                                    key="metrics"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ErrorBoundary>
                                        <MetricsDashboard />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'ops' && (
                                <motion.div
                                    key="ops"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ErrorBoundary>
                                        <ALOpsDashboard />
                                    </ErrorBoundary>
                                </motion.div>
                            )}
                            {activeTab === 'patterns' && (
                                <motion.div
                                    key="patterns"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <PatternLibrary />
                                </motion.div>
                            )}
                            {activeTab === 'snapshots' && (
                                <motion.div
                                    key="snapshots"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <SnapshotManager />
                                </motion.div>
                            )}
                            {activeTab === 'workflow' && (
                                <motion.div
                                    key="workflow"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <VisualWorkflowBuilder />
                                </motion.div>
                            )}
                            {activeTab === 'analytics' && (
                                <motion.div
                                    key="analytics"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <AnalyticsDashboard />
                                </motion.div>
                            )}
                            {activeTab === 'context' && (
                                <motion.div
                                    key="context"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ContextGraphViewer />
                                </motion.div>
                            )}
                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <NotificationCenter />
                                </motion.div>
                            )}
                            {activeTab === 'automation' && (
                                <motion.div
                                    key="automation"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <AutomationDashboard />
                                </motion.div>
                            )}
                            {activeTab === 'audit' && (
                                <motion.div
                                    key="audit"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <AuditLogViewer />
                                </motion.div>
                            )}
                            {activeTab === 'memory' && (
                                <motion.div
                                    key="memory"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <MemoryManager />
                                </motion.div>
                            )}
                            {activeTab === 'orchestration' && (
                                <motion.div
                                    key="orchestration"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <OrchestrationPanel />
                                </motion.div>
                            )}
                            {activeTab === 'improvement' && (
                                <motion.div
                                    key="improvement"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="h-full overflow-y-auto"
                                >
                                    <ImprovementDashboard />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel - Model Dashboard */}
                <div className="w-80 border-l border-neon-cyan/20">
                    <ModelDashboard
                        models={models}
                        currentModel={currentModel}
                        onModelSelect={handleModelSelect}
                    />
                </div>
            </div>

            {/* Footer */}
            <footer className="h-8 border-t border-neon-cyan/20 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                    <span>{isLoading ? loadingMessage : 'Ready'}</span>
                    {isLoading && (
                        <motion.div
                            className="w-2 h-2 bg-neon-cyan rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />
                    )}
                </div>
                <div>Shadow AI v5.0.0</div>
            </footer>

            {/* Overlays */}
            <AnimatePresence>
                {voiceEnabled && ( // Keeping original voiceEnabled for now, as the instruction only shows the overlay structure
                    <motion.div
                        key="voice-control-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
                        onClick={() => setVoiceEnabled(false)} // Assuming this closes the overlay
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <Suspense fallback={<div className="text-white">Loading Voice Control...</div>}>
                                <VoiceControl onCommand={handleVoiceCommand} />
                            </Suspense>
                        </div>
                    </motion.div>
                )}

                {showCollaboration && (
                    <motion.div
                        key="collaboration-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
                        onClick={() => setShowCollaboration(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <CollaborationPanel />
                        </div>
                    </motion.div>
                )}

                {showPluginMarketplace && ( // Keeping original showPluginMarketplace
                    <motion.div
                        key="plugin-market-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
                        onClick={() => setShowPluginMarketplace(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <PluginMarketplace onClose={() => setShowPluginMarketplace(false)} /> {/* Retaining onClose */}
                        </div>
                    </motion.div>
                )}

                {/* Task Queue Panel - Adding motion.div and key */}
                <motion.div key="task-queue-panel">
                    <TaskQueuePanel />
                </motion.div>

                {/* Settings Panel - Adding motion.div and key */}
                {showSettings && (
                    <motion.div key="settings-panel">
                        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="loading-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
                            <div className="text-neon-cyan text-lg font-semibold">Initializing Shadow AI...</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Agent Activity Monitor */}
            <AgentActivityMonitor />
        </div>
    );
}

export default App;
