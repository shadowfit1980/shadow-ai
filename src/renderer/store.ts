import { create } from 'zustand';

// Types
export interface AIModel {
    id: string;
    name: string;
    provider: string;
    type: 'cloud' | 'local';
    available: boolean;
    performance?: {
        responseTime: number;
        accuracy: number;
        tokensPerSecond: number;
        lastUsed: Date;
    };
}

export interface Agent {
    type: string;
    name: string;
    status: 'idle' | 'working' | 'error';
    currentTask?: string;
}

export interface Project {
    id: string;
    name: string;
    path: string;
    framework: string;
    status: 'active' | 'building' | 'deployed';
}

export interface Plugin {
    id: string;
    name: string;
    version: string;
    author: string;
    description: string;
    enabled: boolean;
}

export interface Message {
    id: string;
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: number;
    agentType?: string;
}

interface AppState {
    // Models
    models: AIModel[];
    currentModel: AIModel | null;
    setModels: (models: AIModel[]) => void;
    setCurrentModel: (model: AIModel | null) => void;

    // Agents
    agents: Agent[];
    setAgents: (agents: Agent[]) => void;
    updateAgentStatus: (type: string, status: Agent['status'], task?: string) => void;

    // Projects
    projects: Project[];
    currentProject: Project | null;
    setProjects: (projects: Project[]) => void;
    setCurrentProject: (project: Project | null) => void;
    addProject: (project: Project) => void;

    // Plugins
    plugins: Plugin[];
    setPlugins: (plugins: Plugin[]) => void;
    togglePlugin: (pluginId: string) => void;

    // Chat
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;

    // UI State
    activeTab: 'dashboard' | 'models' | 'ide' | 'uese' | 'templates' | 'themes' | 'files' | 'code' | 'flowchart' | 'preview' | 'design' | 'testing' | 'autonomous' | 'projects' | 'snippets' | 'terminal' | 'git' | 'safety' | 'metrics' | 'ops' | 'patterns' | 'snapshots' | 'workflow' | 'analytics' | 'context' | 'notifications' | 'automation' | 'audit' | 'memory' | 'orchestration' | 'improvement';
    setActiveTab: (tab: 'dashboard' | 'models' | 'ide' | 'uese' | 'templates' | 'themes' | 'files' | 'code' | 'flowchart' | 'preview' | 'design' | 'testing' | 'autonomous' | 'projects' | 'snippets' | 'terminal' | 'git' | 'safety' | 'metrics' | 'ops' | 'patterns' | 'snapshots' | 'workflow' | 'analytics' | 'context' | 'notifications' | 'automation' | 'audit' | 'memory' | 'orchestration' | 'improvement') => void;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    showPluginMarketplace: boolean;
    setShowPluginMarketplace: (show: boolean) => void;
    showCollaboration: boolean;
    setShowCollaboration: (show: boolean) => void;
    voiceEnabled: boolean;
    setVoiceEnabled: (enabled: boolean) => void;

    // Loading states
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    loadingMessage: string;
    setLoadingMessage: (message: string) => void;

    // Content states
    codeContent: string;
    setCodeContent: (code: string) => void;
    flowchartData: any;
    setFlowchartData: (data: any) => void;
    previewContent: string;
    setPreviewContent: (content: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Models
    models: [],
    currentModel: null,
    setModels: (models) => set({ models }),
    setCurrentModel: (model) => set({ currentModel: model }),

    // Agents
    agents: [
        { type: 'architect', name: 'Shadow Architect', status: 'idle' },
        { type: 'builder', name: 'Shadow Builder', status: 'idle' },
        { type: 'debugger', name: 'Shadow Debugger', status: 'idle' },
        { type: 'ux', name: 'Shadow UX', status: 'idle' },
        { type: 'communicator', name: 'Shadow Communicator', status: 'idle' },
    ],
    setAgents: (agents) => set({ agents }),
    updateAgentStatus: (type, status, task) =>
        set((state) => ({
            agents: state.agents.map((agent) =>
                agent.type === type ? { ...agent, status, currentTask: task } : agent
            ),
        })),

    // Projects
    projects: [],
    currentProject: null,
    setProjects: (projects) => set({ projects }),
    setCurrentProject: (project) => set({ currentProject: project }),
    addProject: (project) =>
        set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
        })),

    // Plugins
    plugins: [],
    setPlugins: (plugins) => set({ plugins }),
    togglePlugin: (pluginId) =>
        set((state) => ({
            plugins: state.plugins.map((plugin) =>
                plugin.id === pluginId ? { ...plugin, enabled: !plugin.enabled } : plugin
            ),
        })),

    // Chat
    messages: [],
    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id: Date.now().toString(),
                    timestamp: Date.now(),
                },
            ],
        })),
    clearMessages: () => set({ messages: [] }),

    // UI State
    activeTab: 'code',
    setActiveTab: (tab) => set({ activeTab: tab }),
    showSettings: false,
    setShowSettings: (show) => set({ showSettings: show }),
    showPluginMarketplace: false,
    setShowPluginMarketplace: (show) => set({ showPluginMarketplace: show }),
    showCollaboration: false,
    setShowCollaboration: (show) => set({ showCollaboration: show }),
    voiceEnabled: false,
    setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),

    // Loading states
    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),
    loadingMessage: '',
    setLoadingMessage: (message) => set({ loadingMessage: message }),

    // Content states
    codeContent: '',
    setCodeContent: (code) => set({ codeContent: code }),
    flowchartData: null,
    setFlowchartData: (data) => set({ flowchartData: data }),
    previewContent: '',
    setPreviewContent: (content) => set({ previewContent: content }),
}));
