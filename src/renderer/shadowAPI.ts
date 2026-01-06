// Shadow AI - Unified API for both Electron and Browser environments
// Uses IPC when in Electron, falls back to HTTP API when in browser

// Check if we're in Electron environment with working shadowAPI from preload
const hasPreloadAPI = typeof window !== 'undefined' &&
    (window as any).shadowAPI &&
    typeof (window as any).shadowAPI.listModels === 'function';

// HTTP API base URL for browser fallback
const API_BASE = 'http://localhost:3456';

// Helper to call HTTP API
async function httpCall(method: string, ...params: any[]): Promise<any> {
    try {
        const response = await fetch(`${API_BASE}/api`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, params }),
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'API call failed');
        return data.result;
    } catch (error: any) {
        console.warn(`HTTP API call failed for ${method}:`, error.message);
        return null;
    }
}

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && typeof (window as any).require === 'function';

// Get ipcRenderer if in Electron
let ipcRenderer: any = null;
if (isElectron) {
    try {
        ipcRenderer = (window as any).require('electron').ipcRenderer;
    } catch (e) {
        console.warn('Could not load ipcRenderer:', e);
    }
}

// Determine which API method to use
function getApiMethod(ipcChannel: string): (...args: any[]) => Promise<any> {
    // If preload provided shadowAPI, use that first
    if (hasPreloadAPI) {
        // Map IPC channel to shadowAPI method - will be used by window.shadowAPI
        return async () => { /* handled by preload */ };
    }
    // If we have ipcRenderer, use IPC
    if (ipcRenderer) {
        return async (...args: any[]) => ipcRenderer.invoke(ipcChannel, ...args);
    }
    // Fallback to HTTP API
    return (...args: any[]) => httpCall(ipcChannel, ...args);
}

// Create shadowAPI object
export const shadowAPI = {
    // Model management
    listModels: async () => {
        if (hasPreloadAPI) return (window as any).shadowAPI.listModels();
        if (ipcRenderer) return await ipcRenderer.invoke('model:list');
        return await httpCall('model:list');
    },

    selectModel: async (modelId: string) => {
        if (hasPreloadAPI) return (window as any).shadowAPI.selectModel(modelId);
        if (ipcRenderer) return await ipcRenderer.invoke('model:select', modelId);
        return await httpCall('model:select', modelId);
    },

    chat: async (messages: any[]) => {
        if (hasPreloadAPI) return (window as any).shadowAPI.chat(messages);
        if (ipcRenderer) return await ipcRenderer.invoke('model:chat', messages);
        return await httpCall('model:chat', messages) || 'API unavailable';
    },

    diagnosticModelStatus: async () => {
        if (hasPreloadAPI) return (window as any).shadowAPI.diagnosticModelStatus();
        if (ipcRenderer) return await ipcRenderer.invoke('diagnostic:modelStatus');
        return await httpCall('diagnostic:modelStatus');
    },

    updateApiKeys: async (keys: { [key: string]: string }) => {
        if (!ipcRenderer) return [];
        return await ipcRenderer.invoke('api:updateKeys', keys);
    },

    // Agent coordination
    executeCommand: async (command: string, params: any) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:execute', command, params);
    },

    // File analysis
    analyzeFile: async (filePath: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('file:analyze', filePath);
    },

    // Project building
    buildProject: async (config: any) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('project:build', config);
    },

    deployProject: async (config: any) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('project:deploy', config);
    },

    // Knowledge base
    queryKnowledge: async (query: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('knowledge:query', query);
    },

    storeKnowledge: async (data: any) => {
        if (!ipcRenderer) return;
        return await ipcRenderer.invoke('knowledge:store', data);
    },

    // Plugin management
    listPlugins: async () => {
        if (!ipcRenderer) return [];
        return await ipcRenderer.invoke('plugin:list');
    },

    loadPlugin: async (plugin: any) => {
        if (!ipcRenderer) return;
        return await ipcRenderer.invoke('plugin:load', plugin);
    },

    unloadPlugin: async (pluginId: string) => {
        if (!ipcRenderer) return;
        return await ipcRenderer.invoke('plugin:unload', pluginId);
    },

    // Collaboration
    startCollaboration: async (sessionId: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('collaboration:start', sessionId);
    },

    joinCollaboration: async (sessionId: string, userId: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('collaboration:join', sessionId, userId);
    },

    // Voice
    processVoiceCommand: async (text: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('voice:process', text);
    },

    // Task Queue
    queueTask: async (command: string, params: any, priority?: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:queueTask', command, params, priority);
    },
    getTaskStatus: async (taskId: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:getTaskStatus', taskId);
    },
    cancelTask: async (taskId: string) => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:cancelTask', taskId);
    },
    getQueueStats: async () => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:getQueueStats');
    },
    getAllTasks: async () => {
        if (!ipcRenderer) return null;
        return await ipcRenderer.invoke('agent:getAllTasks');
    },

    // Planning
    requiresPlanning: async (userInput: string) => {
        if (!ipcRenderer) return false;
        return await ipcRenderer.invoke('planning:requiresPlanning', userInput);
    },
    analyzePlan: async (userInput: string) => {
        if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
        return await ipcRenderer.invoke('planning:analyze', userInput);
    },
    executePlan: async (plan: any) => {
        if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
        return await ipcRenderer.invoke('planning:execute', plan);
    },

    // Chat streaming
    chatStream: async (messages: any[]) => {
        if (hasPreloadAPI) return (window as any).shadowAPI.chatStream(messages);
        if (ipcRenderer) return await ipcRenderer.invoke('model:chatStream', messages);
        // Fall back to regular chat via HTTP (streaming not supported in HTTP mode)
        return await httpCall('model:chat', messages) || 'Unable to connect to API';
    },
    onStreamToken: (callback: (data: any) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.on('stream:token', (_: any, data: any) => callback(data));
    },
    onStreamComplete: (callback: (data: any) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.on('stream:complete', (_: any, data: any) => callback(data));
    },
    onStreamError: (callback: (data: any) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.on('stream:error', (_: any, data: any) => callback(data));
    },
    removeStreamListeners: () => {
        if (!ipcRenderer) return;
        ipcRenderer.removeAllListeners('stream:token');
        ipcRenderer.removeAllListeners('stream:complete');
        ipcRenderer.removeAllListeners('stream:error');
    },

    // Figma
    figmaGetFile: async (url: string) => {
        if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
        return await ipcRenderer.invoke('figma:getFile', url);
    },

    // Canva
    canvaGetUrl: async (type: string) => {
        if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
        return await ipcRenderer.invoke('canva:getUrl', type);
    },


    // Tools
    tools: {
        list: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('tools:list');
        },
        get: async (toolName: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:get', toolName);
        },
        execute: async (toolName: string, params: any, context?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:execute', toolName, params, context);
        },
        search: async (query: { category?: string; tags?: string[]; name?: string }) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('tools:search', query);
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:stats');
        },
        exportForAI: async () => {
            if (!ipcRenderer) return '';
            return await ipcRenderer.invoke('tools:exportForAI');
        },
    },

    // Orchestrator
    orchestrator: {
        executeTask: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('orchestrator:executeTask', task);
        },
        explainReasoning: async (task: any) => {
            if (!ipcRenderer) return '';
            return await ipcRenderer.invoke('orchestrator:explainReasoning', task);
        },
        getToolContext: async () => {
            if (!ipcRenderer) return '';
            return await ipcRenderer.invoke('orchestrator:getToolContext');
        },
    },

    // Code Completion
    completion: {
        getInline: async (context: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('completion:getInline', context);
            return result.success ? result.completion : null;
        },
        getSuggestions: async (context: any) => {
            if (!ipcRenderer) return [];
            const result = await ipcRenderer.invoke('completion:getSuggestions', context);
            return result.success ? result.completions : [];
        },
        accept: async (completion: any, partial: boolean = false) => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('completion:accept', completion, partial);
        },
        reject: async () => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('completion:reject');
        },
        cancel: async (requestKey?: string) => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('completion:cancel', requestKey);
        },
        getMetrics: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('completion:getMetrics');
        },
        updateConfig: async (config: any) => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('completion:updateConfig', config);
        },
        getConfig: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('completion:getConfig');
        },
        clearCache: async () => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('completion:clearCache');
        },
    },

    // Metrics Dashboard
    metrics: {
        getSummary: async (since?: string) => {
            if (ipcRenderer) {
                return await ipcRenderer.invoke('metrics:getSummary', since);
            }
            // HTTP Fallback
            return await httpCall('metrics:getSummary', since);
        },
        getCalibrationData: async () => {
            if (ipcRenderer) {
                return await ipcRenderer.invoke('metrics:getCalibrationData');
            }
            // HTTP Fallback
            return await httpCall('metrics:getCalibrationData');
        },
    },

    // Safety Dashboard
    safety: {
        getAllPolicies: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('safety:getAllPolicies');
            return await httpCall('safety:getAllPolicies');
        },
        getViolationStats: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('safety:getViolationStats');
            return await httpCall('safety:getViolationStats');
        },
        getRecentViolations: async (limit?: number) => {
            if (ipcRenderer) return await ipcRenderer.invoke('safety:getRecentViolations', limit);
            return await httpCall('safety:getRecentViolations', [limit]);
        }
    },
    // Mode API (added to fix getMode error)
    mode: {
        getMode: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('mode:getMode');
            return await httpCall('mode:getMode');
        },
        getConfig: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('mode:getConfig');
            return await httpCall('mode:getConfig');
        },
        setMode: async (mode: string) => {
            if (ipcRenderer) return await ipcRenderer.invoke('mode:setMode', mode);
            return await httpCall('mode:setMode', mode);
        }
    },

    // ALOps Dashboard (Active Learning Operations)
    alops: {
        getHealthStatus: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('alops:getHealthStatus');
            return await httpCall('alops:getHealthStatus');
        },
        getMetrics: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('alops:getMetrics');
            return await httpCall('alops:getMetrics');
        },
        getAlerts: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('alops:getAlerts');
            return await httpCall('alops:getAlerts');
        }
    },

    // Autonomous Engineering
    autonomous: {
        getStatus: async () => {
            if (ipcRenderer) return await ipcRenderer.invoke('autonomous:getStatus');
            return await httpCall('autonomous:getStatus');
        },
        startWorkflow: async (workflowId: string) => {
            if (ipcRenderer) return await ipcRenderer.invoke('autonomous:startWorkflow', workflowId);
            return await httpCall('autonomous:startWorkflow', [workflowId]);
        },
        stopWorkflow: async (workflowId: string) => {
            if (ipcRenderer) return await ipcRenderer.invoke('autonomous:stopWorkflow', workflowId);
            return await httpCall('autonomous:stopWorkflow', [workflowId]);
        }
    },

    // Prompt Suggestions (Google AI)
    promptSuggestions: {
        getSuggestions: async (userPrompt: string) => {
            if (!ipcRenderer) return [];
            const result = await ipcRenderer.invoke('prompt:getSuggestions', userPrompt);
            return result.success ? result.suggestions : [];
        },
        enhance: async (userPrompt: string) => {
            if (!ipcRenderer) return userPrompt;
            const result = await ipcRenderer.invoke('prompt:enhance', userPrompt);
            return result.success ? result.enhanced : userPrompt;
        },
        clearCache: async () => {
            if (!ipcRenderer) return;
            await ipcRenderer.invoke('prompt:clearCache');
        },
        getCacheStats: async () => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('prompt:getCacheStats');
            return result.success ? result.stats : null;
        },
    },

    // Design Generation (Nano Banana Pro & Google Stitch)
    design: {
        // Google Stitch - UI Generation
        generateUI: async (prompt: string, options?: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateUI', prompt, options);
            return result.success ? result.design : null;
        },
        generateVariants: async (prompt: string, count: number, options?: any) => {
            if (!ipcRenderer) return [];
            const result = await ipcRenderer.invoke('design:generateVariants', prompt, count, options);
            return result.success ? result.variants : [];
        },
        generateFromImage: async (imageDescription: string, options?: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateFromImage', imageDescription, options);
            return result.success ? result.design : null;
        },
        generateCode: async (design: any, framework: string) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateCode', design, framework);
            return result.success ? result.code : null;
        },

        // Nano Banana Pro - Image Generation
        generateImagePrompt: async (prompt: string, options?: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateImagePrompt', prompt, options);
            return result.success ? result.result : null;
        },
        generateTextImage: async (text: string, style: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateTextImage', text, style);
            return result.success ? result.result : null;
        },
        generateDiagram: async (data: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateDiagram', data);
            return result.success ? result.result : null;
        },
        generateMockup: async (description: string, productType: string) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateMockup', description, productType);
            return result.success ? result.result : null;
        },
        generateCharacter: async (characterDescription: string, scene: string) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateCharacter', characterDescription, scene);
            return result.success ? result.result : null;
        },
        generateEditInstructions: async (originalDescription: string, edits: any) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('design:generateEditInstructions', originalDescription, edits);
            return result.success ? result.result : null;
        },
    },

    // File Handling
    files: {
        download: async (url: string, customFileName?: string) => {
            if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
            return await ipcRenderer.invoke('file:download', url, customFileName);
        },
        getWebContent: async (url: string) => {
            if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
            return await ipcRenderer.invoke('file:getWebContent', url);
        },
        getInfo: async (filePath: string) => {
            if (!ipcRenderer) return null;
            const result = await ipcRenderer.invoke('file:getInfo', filePath);
            return result.success ? result.info : null;
        },
        isUrl: async (str: string) => {
            if (!ipcRenderer) return false;
            return await ipcRenderer.invoke('file:isUrl', str);
        },
        listDownloads: async () => {
            if (!ipcRenderer) return [];
            const result = await ipcRenderer.invoke('file:listDownloads');
            return result.success ? result.files : [];
        },
        getDownloadPath: async () => {
            if (!ipcRenderer) return '';
            return await ipcRenderer.invoke('file:getDownloadPath');
        },
        setDownloadPath: async (newPath: string) => {
            if (!ipcRenderer) return { success: false };
            return await ipcRenderer.invoke('file:setDownloadPath', newPath);
        },
    },

    // Voice Transcription (Whisper)
    whisper: {
        transcribe: async (audioData: ArrayBuffer, options?: { language?: string; prompt?: string }) => {
            if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
            return await ipcRenderer.invoke('whisper:transcribe', audioData, options);
        },
        transcribeFile: async (filePath: string, options?: { language?: string }) => {
            if (!ipcRenderer) return { success: false, error: 'Not in Electron' };
            return await ipcRenderer.invoke('whisper:transcribeFile', filePath, options);
        },
        isAvailable: async () => {
            if (!ipcRenderer) return false;
            return await ipcRenderer.invoke('whisper:isAvailable');
        },
        setApiKey: async (apiKey: string) => {
            if (!ipcRenderer) return { success: false };
            return await ipcRenderer.invoke('whisper:setApiKey', apiKey);
        },
    },

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.on(channel, (_: any, ...args: any[]) => callback(...args));
    },

    off: (channel: string, callback: (...args: any[]) => void) => {
        if (!ipcRenderer) return;
        ipcRenderer.removeListener(channel, callback);
    },

    // =========================================================================
    // AGENT ENHANCEMENT APIs
    // =========================================================================

    // Tool Chaining - Declarative tool pipelines
    toolChaining: {
        createChain: async (name: string, steps: any[], options?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:createChain', name, steps, options);
        },
        executeChain: async (chainId: string, initialParams?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:executeChain', chainId, initialParams);
        },
        getChainStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('tools:getChainStats');
        },
        getExecutionHistory: async (limit?: number) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('tools:getExecutionHistory', limit);
        },
    },

    // Agent Handoff - Agent-to-agent coordination
    handoff: {
        request: async (sourceAgent: string, targetAgent: string, task: string, options?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('handoff:request', sourceAgent, targetAgent, task, options);
        },
        accept: async (handoffId: string) => {
            if (!ipcRenderer) return false;
            return await ipcRenderer.invoke('handoff:accept', handoffId);
        },
        complete: async (handoffId: string, result: any, notes?: string[]) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('handoff:complete', handoffId, result, notes);
        },
        getPending: async (agentType?: string) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('handoff:getPending', agentType);
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('handoff:getStats');
        },
        getPolicy: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('handoff:getPolicy');
        },
    },

    // Context Compression - Smart context window management
    context: {
        addItem: async (windowId: string, content: string, options?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('context:addItem', windowId, content, options);
        },
        getWindow: async (windowId: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('context:getWindow', windowId);
        },
        compress: async (windowId: string, options?: any) => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('context:compress', windowId, options);
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('context:getStats');
        },
        createCheckpoint: async (windowId: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('context:createCheckpoint', windowId);
        },
        getHierarchy: async (windowId: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('context:getHierarchy', windowId);
        },
    },

    // MCTS Planner - Intelligent task planning
    planner: {
        planActions: async (goal: string, context: any, actions: any[]) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('planner:planActions', goal, context, actions);
        },
        getConfig: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('planner:getConfig');
        },
        setConfig: async (config: any) => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('planner:setConfig', config);
        },
    },

    // Streaming Pipeline - Composable streaming data processing
    streaming: {
        addStage: async (transformerType: string, options?: any) => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('streaming:addStage', transformerType, options);
        },
        getStages: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('streaming:getStages');
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('streaming:getStats');
        },
        clearStages: async () => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('streaming:clearStages');
        },
        process: async (chunk: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('streaming:process', chunk);
        },
    },

    // =========================================================================
    // DOMAIN-SPECIFIC AGENT APIs (NEW)
    // =========================================================================

    // Mobile Agent - iOS/Android/RN/Flutter development
    mobile: {
        execute: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('mobile:execute', task);
        },
        detectPlatform: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('mobile:detectPlatform', task);
        },
        generateMetadata: async (description: string, platform: 'ios' | 'android') => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('mobile:generateMetadata', description, platform);
        },
        getCapabilities: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('mobile:getCapabilities');
        },
    },

    // Game Agent - Unity/Unreal/Godot development
    game: {
        execute: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('game:execute', task);
        },
        detectEngine: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('game:detectEngine', task);
        },
        generateProcedural: async (asset: any, project: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('game:generateProcedural', asset, project);
        },
        designMultiplayer: async (task: any, project: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('game:designMultiplayer', task, project);
        },
        getCapabilities: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('game:getCapabilities');
        },
    },

    // Desktop Agent - Win/Mac/Linux development
    desktop: {
        execute: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('desktop:execute', task);
        },
        detectFramework: async (task: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('desktop:detectFramework', task);
        },
        generateInstaller: async (config: any, project: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('desktop:generateInstaller', config, project);
        },
        getCapabilities: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('desktop:getCapabilities');
        },
    },

    // Temporal Context Engine - Code archaeology
    temporal: {
        analyzeArchaeology: async (filePath: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('temporal:analyzeArchaeology', filePath);
        },
        loadHistory: async (commits: any[]) => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('temporal:loadHistory', commits);
        },
        learnPatterns: async (developerId: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('temporal:learnPatterns', developerId);
        },
        predictNext: async (developerId: string, currentFile: string, recentActions: string[]) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('temporal:predictNext', developerId, currentFile, recentActions);
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('temporal:getStats');
        },
    },

    // HiveMind - Collective intelligence
    hivemind: {
        learnPattern: async (problem: string, solution: string, category: string, metadata?: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('hivemind:learnPattern', problem, solution, category, metadata);
        },
        query: async (query: any) => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('hivemind:query', query);
        },
        getBestSolution: async (problem: string, context?: string) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('hivemind:getBestSolution', problem, context);
        },
        contribute: async () => {
            if (!ipcRenderer) return 0;
            return await ipcRenderer.invoke('hivemind:contribute');
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('hivemind:getStats');
        },
        getConfig: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('hivemind:getConfig');
        },
        setConfig: async (config: any) => {
            if (!ipcRenderer) return;
            return await ipcRenderer.invoke('hivemind:setConfig', config);
        },
    },

    // Reality Simulator - Shadow deployments and chaos engineering
    simulator: {
        createShadow: async (config: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:createShadow', config);
        },
        simulateUsers: async (options: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:simulateUsers', options);
        },
        runChaos: async (experiment: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:runChaos', experiment);
        },
        runLoadTest: async (options: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:runLoadTest', options);
        },
        testResilience: async (components: string[]) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:testResilience', components);
        },
        getStats: async () => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('simulator:getStats');
        },
    },

    // Domain Tools - Mobile/Game/Desktop tools
    domainTools: {
        list: async () => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('domainTools:list');
        },
        listByCategory: async (category: 'mobile' | 'game' | 'desktop') => {
            if (!ipcRenderer) return [];
            return await ipcRenderer.invoke('domainTools:listByCategory', category);
        },
        execute: async (name: string, params: any) => {
            if (!ipcRenderer) return null;
            return await ipcRenderer.invoke('domainTools:execute', name, params);
        },
    },
};

// Expose to window for compatibility (only if not already set by preload)
if (typeof window !== 'undefined' && !window.shadowAPI) {
    (window as any).shadowAPI = shadowAPI;
}
