import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('shadowAPI', {
    // Model management
    listModels: () => ipcRenderer.invoke('model:list'),
    selectModel: (modelId: string) => ipcRenderer.invoke('model:select', modelId),
    chat: (messages: any[]) => ipcRenderer.invoke('model:chat', messages),

    // Streaming chat - real-time token updates
    chatStream: (messages: any[]) => ipcRenderer.invoke('model:chatStream', messages),
    onStreamStart: (callback: (data: { streamId: string }) => void) => {
        ipcRenderer.on('stream:start', (_, data) => callback(data));
    },
    onStreamToken: (callback: (data: { streamId: string; token: string; buffer: string }) => void) => {
        ipcRenderer.on('stream:token', (_, data) => callback(data));
    },
    onStreamComplete: (callback: (data: { streamId: string; response: string }) => void) => {
        ipcRenderer.on('stream:complete', (_, data) => callback(data));
    },
    onStreamError: (callback: (data: { streamId: string; error: string }) => void) => {
        ipcRenderer.on('stream:error', (_, data) => callback(data));
    },
    removeStreamListeners: () => {
        ipcRenderer.removeAllListeners('stream:start');
        ipcRenderer.removeAllListeners('stream:token');
        ipcRenderer.removeAllListeners('stream:complete');
        ipcRenderer.removeAllListeners('stream:error');
    },

    updateApiKeys: (keys: { [key: string]: string }) => ipcRenderer.invoke('api:updateKeys', keys),
    diagnosticModelStatus: () => ipcRenderer.invoke('diagnostic:modelStatus'),


    // Agent coordination
    executeCommand: (command: string, params: any) =>
        ipcRenderer.invoke('agent:execute', command, params),

    // File analysis
    analyzeFile: (filePath: string) => ipcRenderer.invoke('file:analyze', filePath),

    // Project building
    buildProject: (config: any) => ipcRenderer.invoke('project:build', config),
    deployProject: (config: any) => ipcRenderer.invoke('project:deploy', config),

    // Knowledge base
    queryKnowledge: (query: string) => ipcRenderer.invoke('knowledge:query', query),
    storeKnowledge: (data: any) => ipcRenderer.invoke('knowledge:store', data),

    // Plugin management
    listPlugins: () => ipcRenderer.invoke('plugin:list'),
    loadPlugin: (plugin: any) => ipcRenderer.invoke('plugin:load', plugin),
    unloadPlugin: (pluginId: string) => ipcRenderer.invoke('plugin:unload', pluginId),

    // Collaboration
    startCollaboration: (sessionId: string) => ipcRenderer.invoke('collaboration:start', sessionId),
    joinCollaboration: (sessionId: string, userId: string) =>
        ipcRenderer.invoke('collaboration:join', sessionId, userId),

    // Voice
    processVoiceCommand: (text: string) => ipcRenderer.invoke('voice:process', text),

    // Whisper Transcription
    whisper: {
        transcribe: (audioData: ArrayBuffer, options?: { language?: string; prompt?: string }) =>
            ipcRenderer.invoke('whisper:transcribe', audioData, options),
        transcribeFile: (filePath: string, options?: { language?: string }) =>
            ipcRenderer.invoke('whisper:transcribeFile', filePath, options),
        isAvailable: () => ipcRenderer.invoke('whisper:isAvailable'),
        setApiKey: (apiKey: string) => ipcRenderer.invoke('whisper:setApiKey', apiKey),
    },

    // File Handling
    files: {
        download: (url: string, customFileName?: string) =>
            ipcRenderer.invoke('file:download', url, customFileName),
        getWebContent: (url: string) => ipcRenderer.invoke('file:getWebContent', url),
        getInfo: (filePath: string) => ipcRenderer.invoke('file:getInfo', filePath),
        isUrl: (str: string) => ipcRenderer.invoke('file:isUrl', str),
        listDownloads: () => ipcRenderer.invoke('file:listDownloads'),
        getDownloadPath: () => ipcRenderer.invoke('file:getDownloadPath'),
        setDownloadPath: (newPath: string) => ipcRenderer.invoke('file:setDownloadPath', newPath),
    },

    // Task Queue
    queueTask: (command: string, params: any, priority?: string) =>
        ipcRenderer.invoke('agent:queueTask', command, params, priority),
    getTaskStatus: (taskId: string) => ipcRenderer.invoke('agent:getTaskStatus', taskId),
    cancelTask: (taskId: string) => ipcRenderer.invoke('agent:cancelTask', taskId),
    getQueueStats: () => ipcRenderer.invoke('agent:getQueueStats'),
    getAllTasks: () => ipcRenderer.invoke('agent:getAllTasks'),

    // External Services
    getServicesStatus: () => ipcRenderer.invoke('services:getStatus'),
    supabaseQuery: (table: string, filters?: any) => ipcRenderer.invoke('services:supabase:query', table, filters),
    supabaseInsert: (table: string, data: any) => ipcRenderer.invoke('services:supabase:insert', table, data),
    figmaExport: (fileKey: string, nodeId: string, format?: 'png' | 'svg' | 'jpg') => ipcRenderer.invoke('services:figma:export', fileKey, nodeId, format),

    // -- Phase 4: Integration APIs --

    // Agents
    agents: {
        getCustomAgents: () => ipcRenderer.invoke('agents:getCustom'),
        saveCustomAgent: (agent: any) => ipcRenderer.invoke('agents:saveCustom', agent),
        deleteCustomAgent: (id: string) => ipcRenderer.invoke('agents:deleteCustom', id),
    },

    // Prompts
    prompts: {
        getTemplates: () => ipcRenderer.invoke('prompts:getTemplates'),
        saveTemplate: (template: any) => ipcRenderer.invoke('prompts:saveTemplate', template),
        deleteTemplate: (id: string) => ipcRenderer.invoke('prompts:deleteTemplate', id),
    },

    // Collaboration
    collaboration: {
        connect: (url: string) => ipcRenderer.invoke('collaboration:connect', url),
        getMembers: () => ipcRenderer.invoke('collaboration:getMembers'),
        getActivities: () => ipcRenderer.invoke('collaboration:getActivities'),
        sendMessage: (message: string) => ipcRenderer.invoke('collaboration:sendMessage', message),
    },

    // Plugins (Enhanced)
    plugins: {
        list: () => ipcRenderer.invoke('plugin:list'),
        install: (id: string) => ipcRenderer.invoke('plugin:install', id),
        uninstall: (id: string) => ipcRenderer.invoke('plugin:uninstall', id),
        enable: (id: string) => ipcRenderer.invoke('plugin:enable', id),
        disable: (id: string) => ipcRenderer.invoke('plugin:disable', id),
    },
    figmaGetFile: (url: string) => ipcRenderer.invoke('services:figma:getFile', url),
    canvaGetUrl: (type: 'presentation' | 'social' | 'document') => ipcRenderer.invoke('services:canva:getUrl', type),

    // MCP Server
    getMCPStatus: () => ipcRenderer.invoke('mcp:getStatus'),
    startMCPServer: () => ipcRenderer.invoke('mcp:start'),
    stopMCPServer: () => ipcRenderer.invoke('mcp:stop'),
    setMCPAutoStart: (enabled: boolean) => ipcRenderer.invoke('mcp:setAutoStart', enabled),

    // Planning System
    analyzePlan: (userInput: string) => ipcRenderer.invoke('planning:analyze', userInput),
    requiresPlanning: (userInput: string) => ipcRenderer.invoke('planning:requiresPlanning', userInput),
    executePlan: (plan: any) => ipcRenderer.invoke('planning:execute', plan),

    // Prompt Suggestions (AI-powered)
    promptSuggestions: {
        enhance: (prompt: string) => ipcRenderer.invoke('prompt:enhance', prompt)
            .then((res: any) => res.enhanced || prompt),
        getSuggestions: (prompt: string) => ipcRenderer.invoke('prompt:getSuggestions', prompt)
            .then((res: any) => res.suggestions || []),
        clearCache: () => ipcRenderer.invoke('prompt:clearCache'),
    },

    // Build/Export System
    build: {
        create: (target: string, projectPath: string, options?: any) =>
            ipcRenderer.invoke('build:create', target, projectPath, options),
        getTargets: (projectPath: string) =>
            ipcRenderer.invoke('build:getTargets', projectPath),
        exportHtml: (code: string, filename?: string) =>
            ipcRenderer.invoke('build:exportHtml', code, filename),
        quickExport: (code: string, format?: string) =>
            ipcRenderer.invoke('build:quickExport', code, format),
    },

    // Docker Integration
    docker: {
        build: (projectPath: string, imageName?: string) =>
            ipcRenderer.invoke('docker:build', projectPath, imageName),
        run: (imageName: string, options?: { port?: number }) =>
            ipcRenderer.invoke('docker:run', imageName, options),
        status: () =>
            ipcRenderer.invoke('docker:status'),
    },

    // Flutter Integration
    flutter: {
        create: (projectName: string, template?: string) =>
            ipcRenderer.invoke('flutter:create', projectName, template),
        run: (projectPath: string, device?: string) =>
            ipcRenderer.invoke('flutter:run', projectPath, device),
        build: (projectPath: string, target?: 'apk' | 'ios' | 'web') =>
            ipcRenderer.invoke('flutter:build', projectPath, target),
        status: () =>
            ipcRenderer.invoke('flutter:status'),
    },

    // 🎭 Agent Swarm OS API (Auctions, Debates, Task Assignment)
    agentSwarm: {
        getAgents: () =>
            ipcRenderer.invoke('swarm:getAgents'),
        createAuction: (task: { title: string; description: string; requirements?: string[]; priority?: string }) =>
            ipcRenderer.invoke('swarm:createAuction', task),
        selectWinner: (auctionId: string, criteria?: string) =>
            ipcRenderer.invoke('swarm:selectWinner', auctionId, criteria),
        startDebate: (topic: string, participantIds?: string[]) =>
            ipcRenderer.invoke('swarm:startDebate', topic, participantIds),
        getAuctions: () =>
            ipcRenderer.invoke('swarm:getAuctions'),
        getDebates: () =>
            ipcRenderer.invoke('swarm:getDebates'),
        assignTask: (agentId: string, task: any) =>
            ipcRenderer.invoke('swarm:assignTask', agentId, task),
    },

    // 🔪 Diff-Based Editing API
    diff: {
        apply: (edit: any) =>
            ipcRenderer.invoke('diff:apply', edit),
        validate: (edit: any) =>
            ipcRenderer.invoke('diff:validate', edit),
        rollback: (editId: string) =>
            ipcRenderer.invoke('diff:rollback', editId),
        history: () =>
            ipcRenderer.invoke('diff:history'),
        parse: (response: string, targetFile: string) =>
            ipcRenderer.invoke('diff:parse', response, targetFile),
    },

    // 🔒 Sandboxed Execution API
    sandbox: {
        execute: (command: string, options?: any) =>
            ipcRenderer.invoke('sandbox:execute', command, options),
        validate: (command: string) =>
            ipcRenderer.invoke('sandbox:validate', command),
        violations: () =>
            ipcRenderer.invoke('sandbox:violations'),
        killAll: () =>
            ipcRenderer.invoke('sandbox:killAll'),
    },

    // 🔍 Runtime Inspector API
    inspector: {
        findProcesses: () =>
            ipcRenderer.invoke('inspector:findProcesses'),
        attach: (pid: number, debugUrl?: string) =>
            ipcRenderer.invoke('inspector:attach', pid, debugUrl),
        disconnect: (sessionId: string) =>
            ipcRenderer.invoke('inspector:disconnect', sessionId),
        evaluate: (sessionId: string, expression: string) =>
            ipcRenderer.invoke('inspector:evaluate', sessionId, expression),
        logs: (sessionId: string, limit?: number) =>
            ipcRenderer.invoke('inspector:logs', sessionId, limit),
        sessions: () =>
            ipcRenderer.invoke('inspector:sessions'),
    },

    // 🧠 Vector Memory API
    memory: {
        embedCodebase: (projectPath: string) =>
            ipcRenderer.invoke('memory:embedCodebase', projectPath),
        search: (query: string, options?: any) =>
            ipcRenderer.invoke('memory:search', query, options),
        learn: (projectPath: string) =>
            ipcRenderer.invoke('memory:learn', projectPath),
        projectDNA: (projectPath: string) =>
            ipcRenderer.invoke('memory:projectDNA', projectPath),
        similarProjects: (projectPath: string, limit?: number) =>
            ipcRenderer.invoke('memory:similarProjects', projectPath, limit),
        fragments: (projectPath?: string) =>
            ipcRenderer.invoke('memory:fragments', projectPath),
    },

    // 📸 Visual Regression Testing API
    visual: {
        initialize: () =>
            ipcRenderer.invoke('visual:initialize'),
        capture: (url: string, options?: any) =>
            ipcRenderer.invoke('visual:capture', url, options),
        createTest: (name: string, url: string, options?: any) =>
            ipcRenderer.invoke('visual:createTest', name, url, options),
        runTest: (testId: string) =>
            ipcRenderer.invoke('visual:runTest', testId),
        runAll: () =>
            ipcRenderer.invoke('visual:runAll'),
        updateBaseline: (testId: string) =>
            ipcRenderer.invoke('visual:updateBaseline', testId),
        generateReport: (results: any[]) =>
            ipcRenderer.invoke('visual:generateReport', results),
        getTests: () =>
            ipcRenderer.invoke('visual:getTests'),
    },

    // 🏥 Codebase Healer API
    healer: {
        analyze: (projectPath: string) =>
            ipcRenderer.invoke('healer:analyze', projectPath),
        autoFix: (projectPath: string, strategy?: string) =>
            ipcRenderer.invoke('healer:autoFix', projectPath, strategy),
        updateDeps: (projectPath: string, strategy?: string) =>
            ipcRenderer.invoke('healer:updateDeps', projectPath, strategy),
        patchVulns: (projectPath: string) =>
            ipcRenderer.invoke('healer:patchVulns', projectPath),
        removeUnused: (projectPath: string) =>
            ipcRenderer.invoke('healer:removeUnused', projectPath),
        detectBitrot: (projectPath: string) =>
            ipcRenderer.invoke('healer:detectBitrot', projectPath),
    },

    // 📱 Device Farm API
    deviceFarm: {
        configure: (config: any) =>
            ipcRenderer.invoke('devicefarm:configure', config),
        getDevices: () =>
            ipcRenderer.invoke('devicefarm:getDevices'),
        uploadApp: (appPath: string) =>
            ipcRenderer.invoke('devicefarm:uploadApp', appPath),
        runTest: (device: any, appPath: string) =>
            ipcRenderer.invoke('devicefarm:runTest', device, appPath),
        runParallel: (devices: any[], appPath: string) =>
            ipcRenderer.invoke('devicefarm:runParallel', devices, appPath),
        createSuite: (name: string, appPath: string, devices: any[]) =>
            ipcRenderer.invoke('devicefarm:createSuite', name, appPath, devices),
        runSuite: (suiteId: string) =>
            ipcRenderer.invoke('devicefarm:runSuite', suiteId),
        getMatrix: (options?: any) =>
            ipcRenderer.invoke('devicefarm:getMatrix', options),
    },

    // ⏰ Time Travel Debugger V2 API (Phase 3) - Enhanced recording/replay
    timeTravelV2: {
        initialize: () =>
            ipcRenderer.invoke('timetravel:initialize'),
        startRecording: (name: string, projectPath: string, entryPoint: string) =>
            ipcRenderer.invoke('timetravel:startRecording', name, projectPath, entryPoint),
        stopRecording: () =>
            ipcRenderer.invoke('timetravel:stopRecording'),
        jumpToTick: (sessionId: string, tick: number) =>
            ipcRenderer.invoke('timetravel:jumpToTick', sessionId, tick),
        replay: (sessionId: string, options?: any) =>
            ipcRenderer.invoke('timetravel:replay', sessionId, options),
        getSessions: () =>
            ipcRenderer.invoke('timetravel:getSessions'),
        compareExecutions: (sessionId1: string, sessionId2: string) =>
            ipcRenderer.invoke('timetravel:compareExecutions', sessionId1, sessionId2),
    },

    // 🏹 Bounty Hunter API (Phase 3)
    bounty: {
        configure: (config: any, githubToken: string) =>
            ipcRenderer.invoke('bounty:configure', config, githubToken),
        startHunting: () =>
            ipcRenderer.invoke('bounty:startHunting'),
        stopHunting: () =>
            ipcRenderer.invoke('bounty:stopHunting'),
        findIssues: (repo: string) =>
            ipcRenderer.invoke('bounty:findIssues', repo),
        analyzeIssue: (issue: any) =>
            ipcRenderer.invoke('bounty:analyzeIssue', issue),
        huntIssue: (issue: any) =>
            ipcRenderer.invoke('bounty:huntIssue', issue),
        getStats: () =>
            ipcRenderer.invoke('bounty:getStats'),
        getHunts: () =>
            ipcRenderer.invoke('bounty:getHunts'),
    },

    // 🍎 Local MLX AI API (Phase 3)
    localAI: {
        initialize: () =>
            ipcRenderer.invoke('localai:initialize'),
        getHardware: () =>
            ipcRenderer.invoke('localai:getHardware'),
        getModels: () =>
            ipcRenderer.invoke('localai:getModels'),
        downloadModel: (presetName: string) =>
            ipcRenderer.invoke('localai:downloadModel', presetName),
        loadModel: (modelId: string) =>
            ipcRenderer.invoke('localai:loadModel', modelId),
        generate: (request: any) =>
            ipcRenderer.invoke('localai:generate', request),
        unloadModel: () =>
            ipcRenderer.invoke('localai:unloadModel'),
    },

    // ⚡ Hardware Synthesizer API (Phase 3)
    hardware: {
        initialize: () =>
            ipcRenderer.invoke('hardware:initialize'),
        synthesize: (description: string, language?: string) =>
            ipcRenderer.invoke('hardware:synthesize', description, language),
        useTemplate: (templateName: string, parameters?: any) =>
            ipcRenderer.invoke('hardware:useTemplate', templateName, parameters),
        generateFSM: (name: string, states: any[], inputs: any[], outputs: any[]) =>
            ipcRenderer.invoke('hardware:generateFSM', name, states, inputs, outputs),
        getDesigns: () =>
            ipcRenderer.invoke('hardware:getDesigns'),
        exportFPGA: (designId: string, target: any) =>
            ipcRenderer.invoke('hardware:exportFPGA', designId, target),
    },

    // 🧬 Codebase DNA Visualizer API (Phase 3)
    dna: {
        initialize: () =>
            ipcRenderer.invoke('dna:initialize'),
        generateProfile: (projectPath: string) =>
            ipcRenderer.invoke('dna:generateProfile', projectPath),
        visualize3D: (profileId: string) =>
            ipcRenderer.invoke('dna:visualize3D', profileId),
        visualizeForceGraph: (profileId: string) =>
            ipcRenderer.invoke('dna:visualizeForceGraph', profileId),
        compare: (profileId1: string, profileId2: string) =>
            ipcRenderer.invoke('dna:compare', profileId1, profileId2),
        findSimilar: (profileId: string, limit?: number) =>
            ipcRenderer.invoke('dna:findSimilar', profileId, limit),
        getProfiles: () =>
            ipcRenderer.invoke('dna:getProfiles'),
    },

    // ========================================================================
    // QUEEN 3 MAX ENHANCEMENT APIs
    // ========================================================================

    // 🏗️ Conversational Architect - True Autonomy
    architect: {
        analyze: (request: any) =>
            ipcRenderer.invoke('architect:analyze', request),
        refine: (proposalId: string, answers: any) =>
            ipcRenderer.invoke('architect:refine', proposalId, answers),
        scaffold: (proposalId: string, outputPath: string) =>
            ipcRenderer.invoke('architect:scaffold', proposalId, outputPath),
        getProposals: () =>
            ipcRenderer.invoke('architect:getProposals'),
    },

    // 🎮 Game Engine Integration - Unity/Unreal/Godot
    gameEngine: {
        initialize: () =>
            ipcRenderer.invoke('game:initialize'),
        createProject: (name: string, engine: string, outputPath: string) =>
            ipcRenderer.invoke('game:createProject', name, engine, outputPath),
        generateShader: (request: any) =>
            ipcRenderer.invoke('game:generateShader', request),
        generateScript: (engine: string, className: string, template: string) =>
            ipcRenderer.invoke('game:generateScript', engine, className, template),
        getProjects: () =>
            ipcRenderer.invoke('game:getProjects'),
    },

    // 🎭 AI Personality Engine - Collaborative Personas
    personality: {
        getAll: () =>
            ipcRenderer.invoke('personality:getAll'),
        getCurrent: () =>
            ipcRenderer.invoke('personality:getCurrent'),
        set: (personalityId: string) =>
            ipcRenderer.invoke('personality:set', personalityId),
        recordMetrics: (metrics: any) =>
            ipcRenderer.invoke('personality:recordMetrics', metrics),
        detectStress: () =>
            ipcRenderer.invoke('personality:detectStress'),
        getSystemPrompt: () =>
            ipcRenderer.invoke('personality:getSystemPrompt'),
    },

    // 🧪 Test Suite Generator - Auto Tests + Chaos
    testsuite: {
        generate: (request: any) =>
            ipcRenderer.invoke('testsuite:generate', request),
        generateChaos: (projectPath: string) =>
            ipcRenderer.invoke('testsuite:generateChaos', projectPath),
        runChaos: (tests: any[]) =>
            ipcRenderer.invoke('testsuite:runChaos', tests),
        checkDeploy: (projectPath: string, coverage: number) =>
            ipcRenderer.invoke('testsuite:checkDeploy', projectPath, coverage),
        fuzz: (type: string) =>
            ipcRenderer.invoke('testsuite:fuzz', type),
    },

    // 🚀 Deployment Orchestrator - 25+ Targets
    deploy: {
        getTargets: () =>
            ipcRenderer.invoke('deploy:getTargets'),
        getTargetsByCategory: (category: string) =>
            ipcRenderer.invoke('deploy:getTargetsByCategory', category),
        deploy: (config: any) =>
            ipcRenderer.invoke('deploy:deploy', config),
        checkCompliance: (targetId: string, projectPath: string) =>
            ipcRenderer.invoke('deploy:checkCompliance', targetId, projectPath),
        getHistory: () =>
            ipcRenderer.invoke('deploy:getHistory'),
    },

    // 🔮 What-If Simulator - Migration Planning
    whatIfSimulator: {
        analyze: (question: string, projectPath?: string) =>
            ipcRenderer.invoke('whatif:analyze', question, projectPath),
        generateScripts: (scenarioId: string) =>
            ipcRenderer.invoke('whatif:generateScripts', scenarioId),
        simulate: (scenarioId: string, projectPath: string) =>
            ipcRenderer.invoke('whatif:simulate', scenarioId, projectPath),
        compare: (approach1: string, approach2: string) =>
            ipcRenderer.invoke('whatif:compare', approach1, approach2),
        getScenarios: () =>
            ipcRenderer.invoke('whatif:getScenarios'),
    },

    // 👥 Collaboration Engine - Real-time Coding
    collabEngine: {
        createSession: (name: string, projectPath: string, creatorName: string) =>
            ipcRenderer.invoke('collab:createSession', name, projectPath, creatorName),
        joinSession: (sessionId: string, participantName: string) =>
            ipcRenderer.invoke('collab:joinSession', sessionId, participantName),
        leaveSession: (sessionId: string, participantId: string) =>
            ipcRenderer.invoke('collab:leaveSession', sessionId, participantId),
        applyOperation: (sessionId: string, operation: any) =>
            ipcRenderer.invoke('collab:applyOperation', sessionId, operation),
        getConflicts: (sessionId: string) =>
            ipcRenderer.invoke('collab:getConflicts', sessionId),
        resolveConflict: (sessionId: string, conflictId: string) =>
            ipcRenderer.invoke('collab:resolveConflict', sessionId, conflictId),
        getSessions: () =>
            ipcRenderer.invoke('collab:getSessions'),
    },

    // 📊 Project Health Dashboard - Predictive Health
    health: {
        analyze: (projectPath: string) =>
            ipcRenderer.invoke('health:analyze', projectPath),
        get: (projectPath: string) =>
            ipcRenderer.invoke('health:get', projectPath),
        autoFix: (projectPath: string, categories?: string[]) =>
            ipcRenderer.invoke('health:autoFix', projectPath, categories),
        getHistory: (projectPath: string) =>
            ipcRenderer.invoke('health:getHistory', projectPath),
        generateReport: (projectPath: string) =>
            ipcRenderer.invoke('health:generateReport', projectPath),
    },

    // 🎨 Multi-Modal Input - Sketch/Voice to Code
    multimodal: {
        analyzeSketch: (input: any) =>
            ipcRenderer.invoke('multimodal:analyzeSketch', input),
        generateFromSketch: (sketchId: string, analysis: any, framework: string) =>
            ipcRenderer.invoke('multimodal:generateFromSketch', sketchId, analysis, framework),
        importFigma: (figmaUrl: string) =>
            ipcRenderer.invoke('multimodal:importFigma', figmaUrl),
        startVoice: () =>
            ipcRenderer.invoke('multimodal:startVoice'),
        processVoice: (sessionId: string, transcript: string) =>
            ipcRenderer.invoke('multimodal:processVoice', sessionId, transcript),
        endVoice: (sessionId: string) =>
            ipcRenderer.invoke('multimodal:endVoice', sessionId),
        screenshotToComponent: (imagePath: string, framework: string) =>
            ipcRenderer.invoke('multimodal:screenshotToComponent', imagePath, framework),
    },

    // 🔌 Plugin Ecosystem - Marketplace & Management
    pluginMarketplace: {
        initialize: () =>
            ipcRenderer.invoke('plugins:initialize'),
        search: (query: string, options?: any) =>
            ipcRenderer.invoke('plugins:search', query, options),
        get: (pluginId: string) =>
            ipcRenderer.invoke('plugins:get', pluginId),
        install: (pluginId: string) =>
            ipcRenderer.invoke('plugins:install', pluginId),
        uninstall: (pluginId: string) =>
            ipcRenderer.invoke('plugins:uninstall', pluginId),
        setEnabled: (pluginId: string, enabled: boolean) =>
            ipcRenderer.invoke('plugins:setEnabled', pluginId, enabled),
        getInstalled: () =>
            ipcRenderer.invoke('plugins:getInstalled'),
        getCategories: () =>
            ipcRenderer.invoke('plugins:getCategories'),
        createTemplate: (name: string, outputPath: string, options?: any) =>
            ipcRenderer.invoke('plugins:createTemplate', name, outputPath, options),
    },


    // Testing Framework
    testing: {
        generateFromCode: (code: string, options: any) =>
            ipcRenderer.invoke('testing:generate-from-code', code, options),
        generateFromFile: (filePath: string, options: any) =>
            ipcRenderer.invoke('testing:generate-from-file', filePath, options),
        analyzeCode: (code: string) =>
            ipcRenderer.invoke('testing:analyze-code', code),
        runTests: (framework: any, options: any) =>
            ipcRenderer.invoke('testing:run-tests', framework, options),
        runAllTests: (options: any) =>
            ipcRenderer.invoke('testing:run-all-tests', options),
        detectFrameworks: (projectPath: string) =>
            ipcRenderer.invoke('testing:detect-frameworks', projectPath),
        getCoverage: (framework: any) =>
            ipcRenderer.invoke('testing:get-coverage', framework),
        analyzeQuality: (suite: any) =>
            ipcRenderer.invoke('testing:analyze-quality', suite),
        getSuggestions: (suite: any) =>
            ipcRenderer.invoke('testing:get-suggestions', suite),
        saveTestSuite: (suite: any, targetPath: string) =>
            ipcRenderer.invoke('testing:save-test-suite', suite, targetPath),
        previewTestFile: (suite: any) =>
            ipcRenderer.invoke('testing:preview-test-file', suite),
        findTestFiles: (projectPath: string) =>
            ipcRenderer.invoke('testing:find-test-files', projectPath),
    },

    // Autonomous Workflows
    autonomous: {
        submit: (request: any) => ipcRenderer.invoke('autonomous:submit', request),
        getStatus: (jobId: string) => ipcRenderer.invoke('autonomous:getStatus', jobId),
        getResults: (jobId: string) => ipcRenderer.invoke('autonomous:getResults', jobId),
        getAllWorkflows: () => ipcRenderer.invoke('autonomous:getAllWorkflows'),
        cancel: (jobId: string) => ipcRenderer.invoke('autonomous:cancel', jobId),
        getStats: () => ipcRenderer.invoke('autonomous:getStats'),
        onUpdate: (callback: (message: any) => void) => {
            ipcRenderer.on('autonomous:update', (_, message) => callback(message));
        },
        offUpdate: (callback: (message: any) => void) => {
            ipcRenderer.removeListener('autonomous:update', callback);
        },
    },

    // Agentic Systems (Phase 4)
    agentic: {
        // Agentic Loop
        executeTask: (description: string, context?: any, criteria?: string[]) =>
            ipcRenderer.invoke('agentic:executeTask', description, context, criteria),
        getCurrentTask: () => ipcRenderer.invoke('agentic:getCurrentTask'),
        getHistory: () => ipcRenderer.invoke('agentic:getHistory'),
        configure: (config: any) => ipcRenderer.invoke('agentic:configure', config),
        getStats: () => ipcRenderer.invoke('agentic:getStats'),

        // Goals
        createGoal: (description: string, criteria: string[], priority?: string) =>
            ipcRenderer.invoke('goals:create', description, criteria, priority),
        updateGoal: (goalId: string, status: string) =>
            ipcRenderer.invoke('goals:update', goalId, status),
        getAllGoals: () => ipcRenderer.invoke('goals:getAll'),
        getActiveGoals: () => ipcRenderer.invoke('goals:getActive'),

        // Terminal
        terminal: {
            execute: (command: string, options?: any) =>
                ipcRenderer.invoke('terminal:execute', command, options),
            validate: (command: string) =>
                ipcRenderer.invoke('terminal:validate', command),
            suggest: (intent: string, context?: string) =>
                ipcRenderer.invoke('terminal:suggest', intent, context),
            parseOutput: (output: string, context?: string) =>
                ipcRenderer.invoke('terminal:parseOutput', output, context),
            getHistory: () => ipcRenderer.invoke('terminal:getHistory'),
        },

        // Git
        git: {
            status: (cwd?: string) => ipcRenderer.invoke('git:status', cwd),
            branch: (action: string, name?: string) =>
                ipcRenderer.invoke('git:branch', action, name),
            commit: (message?: string) => ipcRenderer.invoke('git:commit', message),
            generateCommitMessage: () => ipcRenderer.invoke('git:generateCommitMessage'),
            push: (remote?: string, branch?: string) =>
                ipcRenderer.invoke('git:push', remote, branch),
            pull: () => ipcRenderer.invoke('git:pull'),
            merge: (branch: string) => ipcRenderer.invoke('git:merge', branch),
            resolveConflicts: () => ipcRenderer.invoke('git:resolveConflicts'),
            log: (limit?: number) => ipcRenderer.invoke('git:log', limit),
        },

        // Project Scaffolding
        project: {
            create: (description: string, outputDir: string) =>
                ipcRenderer.invoke('project:create', description, outputDir),
            createReact: (name: string, outputDir: string) =>
                ipcRenderer.invoke('project:createReact', name, outputDir),
            createNext: (name: string, outputDir: string) =>
                ipcRenderer.invoke('project:createNext', name, outputDir),
            createExpress: (name: string, outputDir: string) =>
                ipcRenderer.invoke('project:createExpress', name, outputDir),
        },

        // Code Execution
        code: {
            execute: (code: string, language: string, options?: any) =>
                ipcRenderer.invoke('code:execute', code, language, options),
            executeJS: (code: string) => ipcRenderer.invoke('code:executeJS', code),
            executePython: (code: string) => ipcRenderer.invoke('code:executePython', code),
            executeShell: (script: string) => ipcRenderer.invoke('code:executeShell', script),
            getRuntimes: () => ipcRenderer.invoke('code:getRuntimes'),
        },

        // Model Router
        router: {
            route: (task: string, requirements?: any) =>
                ipcRenderer.invoke('router:route', task, requirements),
            execute: (prompt: string, task: string, messages: any[]) =>
                ipcRenderer.invoke('router:execute', prompt, task, messages),
            ensemble: (prompt: string, task: string, numModels?: number) =>
                ipcRenderer.invoke('router:ensemble', prompt, task, numModels),
            setStrategy: (strategy: string) =>
                ipcRenderer.invoke('router:setStrategy', strategy),
            getProfiles: () => ipcRenderer.invoke('router:getProfiles'),
            getStats: () => ipcRenderer.invoke('router:getStats'),
        },

        // Self-Evolution
        evolution: {
            recordMetric: (metric: any) =>
                ipcRenderer.invoke('evolution:recordMetric', metric),
            recordFeedback: (metricId: string, feedback: string) =>
                ipcRenderer.invoke('evolution:recordFeedback', metricId, feedback),
            analyzePatterns: () => ipcRenderer.invoke('evolution:analyzePatterns'),
            getOptimizedStrategy: (taskType: string, context?: any) =>
                ipcRenderer.invoke('evolution:getOptimizedStrategy', taskType, context),
            generateImprovements: () => ipcRenderer.invoke('evolution:generateImprovements'),
            learnCapability: (name: string, description: string, examples: any[]) =>
                ipcRenderer.invoke('evolution:learnCapability', name, description, examples),
            getStats: () => ipcRenderer.invoke('evolution:getStats'),
            getPatterns: () => ipcRenderer.invoke('evolution:getPatterns'),
            getRecentMetrics: (limit?: number) =>
                ipcRenderer.invoke('evolution:getRecentMetrics', limit),
        },

        // AST Analyzer
        ast: {
            analyzeFile: (filePath: string) =>
                ipcRenderer.invoke('ast:analyzeFile', filePath),
            renameSymbol: (filePath: string, oldName: string, newName: string, affectedFiles?: string[]) =>
                ipcRenderer.invoke('ast:renameSymbol', filePath, oldName, newName, affectedFiles),
            extractFunction: (filePath: string, startLine: number, endLine: number, functionName: string) =>
                ipcRenderer.invoke('ast:extractFunction', filePath, startLine, endLine, functionName),
            findUsages: (symbolName: string, searchPaths: string[]) =>
                ipcRenderer.invoke('ast:findUsages', symbolName, searchPaths),
            buildDependencyGraph: (entryFile: string) =>
                ipcRenderer.invoke('ast:buildDependencyGraph', entryFile),
        },
    },

    // Design Studio API
    design: {
        generateUI: (prompt: string, options: any) =>
            ipcRenderer.invoke('design:generateUI', prompt, options),
        generateVariants: (prompt: string, count: number, options: any) =>
            ipcRenderer.invoke('design:generateVariants', prompt, count, options),
        generateFromImage: (imageDescription: string, options: any) =>
            ipcRenderer.invoke('design:generateFromImage', imageDescription, options),
        generateCode: (design: any, framework: string) =>
            ipcRenderer.invoke('design:generateCode', design, framework),
        generateImagePrompt: (prompt: string, options: any) =>
            ipcRenderer.invoke('design:generateImagePrompt', prompt, options),
        generateTextImage: (text: string, style: any) =>
            ipcRenderer.invoke('design:generateTextImage', text, style),
        generateDiagram: (data: any) =>
            ipcRenderer.invoke('design:generateDiagram', data),
        generateMockup: (description: string, productType: string) =>
            ipcRenderer.invoke('design:generateMockup', description, productType),
        generateCharacter: (characterDescription: string, scene: string) =>
            ipcRenderer.invoke('design:generateCharacter', characterDescription, scene),
        generateEditInstructions: (originalDescription: string, edits: any) =>
            ipcRenderer.invoke('design:generateEditInstructions', originalDescription, edits),
    },

    // Context/Codebase Understanding API
    context: {
        indexProject: (projectPath: string) =>
            ipcRenderer.invoke('context:indexProject', projectPath),
        getArchitecture: () =>
            ipcRenderer.invoke('context:getArchitecture'),
        getAllFiles: () =>
            ipcRenderer.invoke('context:getAllFiles'),
        getDependencies: (filePath: string) =>
            ipcRenderer.invoke('context:getDependencies', filePath),
        getDependents: (filePath: string) =>
            ipcRenderer.invoke('context:getDependents', filePath),
        getRelatedFiles: (filePath: string, maxDepth?: number) =>
            ipcRenderer.invoke('context:getRelatedFiles', filePath, maxDepth),
        getFileGroup: (directory: string) =>
            ipcRenderer.invoke('context:getFileGroup', directory),
        getAIContext: (focusFiles?: string[]) =>
            ipcRenderer.invoke('context:getAIContext', focusFiles),
        isIndexed: () =>
            ipcRenderer.invoke('context:isIndexed'),
        getProgress: () =>
            ipcRenderer.invoke('context:getProgress'),
    },

    // Atomic Editing API (Multi-file operations)
    editing: {
        setProjectRoot: (projectPath: string) =>
            ipcRenderer.invoke('editing:setProjectRoot', projectPath),
        beginTransaction: (edits: any[]) =>
            ipcRenderer.invoke('editing:beginTransaction', edits),
        commitTransaction: () =>
            ipcRenderer.invoke('editing:commitTransaction'),
        rollbackTransaction: () =>
            ipcRenderer.invoke('editing:rollbackTransaction'),
        previewTransaction: (edits: any[]) =>
            ipcRenderer.invoke('editing:previewTransaction', edits),
        editFilesAtomically: (edits: Array<{ path: string; content: string }>) =>
            ipcRenderer.invoke('editing:editFilesAtomically', edits),
        renameFileWithImports: (oldPath: string, newPath: string) =>
            ipcRenderer.invoke('editing:renameFileWithImports', oldPath, newPath),
        createFilesAtomically: (files: Array<{ path: string; content: string }>) =>
            ipcRenderer.invoke('editing:createFilesAtomically', files),
        deleteFilesAtomically: (paths: string[]) =>
            ipcRenderer.invoke('editing:deleteFilesAtomically', paths),
        getTransactionHistory: () =>
            ipcRenderer.invoke('editing:getTransactionHistory'),
        getLastTransaction: () =>
            ipcRenderer.invoke('editing:getLastTransaction'),
        hasActiveTransaction: () =>
            ipcRenderer.invoke('editing:hasActiveTransaction'),
    },

    // Browser Automation API
    browser: {
        initialize: (options?: { headless?: boolean }) =>
            ipcRenderer.invoke('browser:initialize', options),
        navigate: (url: string, options?: any) =>
            ipcRenderer.invoke('browser:navigate', url, options),
        click: (selector: string, options?: any) =>
            ipcRenderer.invoke('browser:click', selector, options),
        type: (selector: string, text: string, options?: any) =>
            ipcRenderer.invoke('browser:type', selector, text, options),
        screenshot: (options?: any) =>
            ipcRenderer.invoke('browser:screenshot', options),
        extractContent: (options?: any) =>
            ipcRenderer.invoke('browser:extractContent', options),
        wait: (options: any) =>
            ipcRenderer.invoke('browser:wait', options),
        scroll: (options?: any) =>
            ipcRenderer.invoke('browser:scroll', options),
        research: (query: string, options?: any) =>
            ipcRenderer.invoke('browser:research', query, options),
        fillForm: (formSelector: string, data: Record<string, string>) =>
            ipcRenderer.invoke('browser:fillForm', formSelector, data),
        executeActions: (actions: any[]) =>
            ipcRenderer.invoke('browser:executeActions', actions),
        getCurrentPage: () =>
            ipcRenderer.invoke('browser:getCurrentPage'),
        getActionHistory: () =>
            ipcRenderer.invoke('browser:getActionHistory'),
        isReady: () =>
            ipcRenderer.invoke('browser:isReady'),
        close: () =>
            ipcRenderer.invoke('browser:close'),
    },

    // Safety API (PolicyStore, ModeManager)
    safety: {
        getAllPolicies: () =>
            ipcRenderer.invoke('safety:getAllPolicies'),
        getPolicy: (id: string) =>
            ipcRenderer.invoke('safety:getPolicy', id),
        setPolicyEnabled: (policyId: string, enabled: boolean) =>
            ipcRenderer.invoke('safety:setPolicyEnabled', policyId, enabled),
        checkAction: (params: any) =>
            ipcRenderer.invoke('safety:checkAction', params),
        approveViolation: (violationId: string, approvedBy: string, reason?: string) =>
            ipcRenderer.invoke('safety:approveViolation', violationId, approvedBy, reason),
        rejectViolation: (violationId: string, reason?: string) =>
            ipcRenderer.invoke('safety:rejectViolation', violationId, reason),
        getRecentViolations: (limit?: number) =>
            ipcRenderer.invoke('safety:getRecentViolations', limit),
        getViolationStats: () =>
            ipcRenderer.invoke('safety:getViolationStats'),
    },

    // Mode Manager API
    mode: {
        getMode: () =>
            ipcRenderer.invoke('mode:getMode'),
        setMode: (mode: string) =>
            ipcRenderer.invoke('mode:setMode', mode),
        getConfig: () =>
            ipcRenderer.invoke('mode:getConfig'),
        checkAction: (params: any) =>
            ipcRenderer.invoke('mode:checkAction', params),
        approveAction: (actionId: string, approver: string, notes?: string) =>
            ipcRenderer.invoke('mode:approveAction', actionId, approver, notes),
        rejectAction: (actionId: string, rejecter: string, reason?: string) =>
            ipcRenderer.invoke('mode:rejectAction', actionId, rejecter, reason),
        getPendingActions: () =>
            ipcRenderer.invoke('mode:getPendingActions'),
        getAuditLog: (limit?: number) =>
            ipcRenderer.invoke('mode:getAuditLog', limit),
        getAuditStats: () =>
            ipcRenderer.invoke('mode:getAuditStats'),
    },

    // Vision API (mockup to code)
    vision: {
        imageToCode: (params: any) =>
            ipcRenderer.invoke('vision:imageToCode', params),
    },

    // Red Team API (adversarial testing)
    redteam: {
        testCode: (params: any) =>
            ipcRenderer.invoke('redteam:testCode', params),
        getAttackVectors: () =>
            ipcRenderer.invoke('redteam:getAttackVectors'),
        addAttackVector: (vector: any) =>
            ipcRenderer.invoke('redteam:addAttackVector', vector),
    },

    // Metrics API (observability)
    metrics: {
        record: (params: any) =>
            ipcRenderer.invoke('metrics:record', params),
        recordCalibration: (params: any) =>
            ipcRenderer.invoke('metrics:recordCalibration', params),
        recordTestResult: (passed: boolean, testName: string) =>
            ipcRenderer.invoke('metrics:recordTestResult', passed, testName),
        recordSafetyEvent: (type: string, context?: any) =>
            ipcRenderer.invoke('metrics:recordSafetyEvent', type, context),
        recordProductivity: (type: string, value: number, context?: any) =>
            ipcRenderer.invoke('metrics:recordProductivity', type, value, context),
        getSummary: (since?: string) =>
            ipcRenderer.invoke('metrics:getSummary', since),
        getImprovementDelta: (metric: string, period: string) =>
            ipcRenderer.invoke('metrics:getImprovementDelta', metric, period),
        getCalibrationData: () =>
            ipcRenderer.invoke('metrics:getCalibrationData'),
        getByCategory: (category: string, limit?: number) =>
            ipcRenderer.invoke('metrics:getByCategory', category, limit),
        getImprovementHistory: () =>
            ipcRenderer.invoke('metrics:getImprovementHistory'),
    },

    // ========================================================================
    // V5.1 ENHANCEMENT SYSTEM APIs
    // ========================================================================

    // MCP Tool Orchestrator API
    mcpTools: {
        registerServer: (server: any) =>
            ipcRenderer.invoke('mcp:register-server', server),
        connectServer: (serverId: string) =>
            ipcRenderer.invoke('mcp:connect-server', serverId),
        disconnectServer: (serverId: string) =>
            ipcRenderer.invoke('mcp:disconnect-server', serverId),
        getServers: () =>
            ipcRenderer.invoke('mcp:get-servers'),
        getConnectedServers: () =>
            ipcRenderer.invoke('mcp:get-connected-servers'),
        discoverTools: () =>
            ipcRenderer.invoke('mcp:discover-tools'),
        getTools: () =>
            ipcRenderer.invoke('mcp:get-tools'),
        searchTools: (query: string) =>
            ipcRenderer.invoke('mcp:search-tools', query),
        selectTool: (criteria: any) =>
            ipcRenderer.invoke('mcp:select-tool', criteria),
        executeTool: (request: any) =>
            ipcRenderer.invoke('mcp:execute-tool', request),
        executeForIntent: (intent: string, context?: any) =>
            ipcRenderer.invoke('mcp:execute-for-intent', { intent, context }),
        getHistory: (limit?: number) =>
            ipcRenderer.invoke('mcp:get-history', limit),
        getStats: () =>
            ipcRenderer.invoke('mcp:get-stats'),
    },

    // Self-Improvement Engine API
    improvement: {
        trackOutcome: (outcome: any) =>
            ipcRenderer.invoke('improvement:track-outcome', outcome),
        getMetrics: () =>
            ipcRenderer.invoke('improvement:get-metrics'),
        getAgentMetrics: (agentId: string) =>
            ipcRenderer.invoke('improvement:get-agent-metrics', agentId),
        registerVariant: (basePromptId: string, variant: string, description: string) =>
            ipcRenderer.invoke('improvement:register-variant', { basePromptId, variant, description }),
        getBestPrompt: (basePromptId: string) =>
            ipcRenderer.invoke('improvement:get-best-prompt', basePromptId),
        recordTest: (variantId: string, success: boolean, duration: number) =>
            ipcRenderer.invoke('improvement:record-test', { variantId, success, duration }),
        suggestPrompt: (currentPrompt: string, outcomes: any[]) =>
            ipcRenderer.invoke('improvement:suggest-prompt', { currentPrompt, outcomes }),
        evolveStrategy: (agentId: string) =>
            ipcRenderer.invoke('improvement:evolve-strategy', agentId),
        getStrategy: (agentId: string) =>
            ipcRenderer.invoke('improvement:get-strategy', agentId),
        getStrategyHistory: (agentId: string) =>
            ipcRenderer.invoke('improvement:get-strategy-history', agentId),
        getPlan: (agentId: string) =>
            ipcRenderer.invoke('improvement:get-plan', agentId),
        generateInsights: () =>
            ipcRenderer.invoke('improvement:generate-insights'),
        getStats: () =>
            ipcRenderer.invoke('improvement:get-stats'),
        exportData: () =>
            ipcRenderer.invoke('improvement:export-data'),
        importData: (data: any) =>
            ipcRenderer.invoke('improvement:import-data', data),
    },

    // Proactive Insight Engine API
    proactive: {
        trackAction: (action: string, metadata?: any) =>
            ipcRenderer.invoke('proactive:track-action', { action, metadata }),
        generateInsights: (context: any) =>
            ipcRenderer.invoke('proactive:generate-insights', context),
        getInsights: () =>
            ipcRenderer.invoke('proactive:get-insights'),
        getInsightsByType: (type: string) =>
            ipcRenderer.invoke('proactive:get-insights-by-type', type),
        dismissInsight: (insightId: string) =>
            ipcRenderer.invoke('proactive:dismiss-insight', insightId),
        markActed: (insightId: string) =>
            ipcRenderer.invoke('proactive:mark-acted', insightId),
        getPatterns: () =>
            ipcRenderer.invoke('proactive:get-patterns'),
        getAutomations: () =>
            ipcRenderer.invoke('proactive:get-automations'),
        updateQuality: (metric: string, value: number) =>
            ipcRenderer.invoke('proactive:update-quality', { metric, value }),
        updateDependency: (health: any) =>
            ipcRenderer.invoke('proactive:update-dependency', health),
        getStats: () =>
            ipcRenderer.invoke('proactive:get-stats'),
    },

    // Canary Deployment API
    canary: {
        startDeployment: (params: any) =>
            ipcRenderer.invoke('canary:startDeployment', params),
        getActiveDeployment: () =>
            ipcRenderer.invoke('canary:getActiveDeployment'),
        getDeployment: (id: string) =>
            ipcRenderer.invoke('canary:getDeployment', id),
        getAllDeployments: () =>
            ipcRenderer.invoke('canary:getAllDeployments'),
        cancelDeployment: () =>
            ipcRenderer.invoke('canary:cancelDeployment'),
        getConfig: () =>
            ipcRenderer.invoke('canary:getConfig'),
        setConfig: (config: any) =>
            ipcRenderer.invoke('canary:setConfig', config),
    },

    // ALOps API (Production monitoring & auto-healing)
    alops: {
        configure: (config: any) =>
            ipcRenderer.invoke('alops:configure', config),
        startMonitoring: () =>
            ipcRenderer.invoke('alops:startMonitoring'),
        stopMonitoring: () =>
            ipcRenderer.invoke('alops:stopMonitoring'),
        getHealthStatus: () =>
            ipcRenderer.invoke('alops:getHealthStatus'),
        getHealthHistory: (limit?: number) =>
            ipcRenderer.invoke('alops:getHealthHistory', limit),
        getIncidents: () =>
            ipcRenderer.invoke('alops:getIncidents'),
        getIncident: (id: string) =>
            ipcRenderer.invoke('alops:getIncident', id),
        acknowledgeAlert: (alertId: string) =>
            ipcRenderer.invoke('alops:acknowledgeAlert', alertId),
        resolveIncident: (incidentId: string, resolution: string) =>
            ipcRenderer.invoke('alops:resolveIncident', incidentId, resolution),
        getActiveAlerts: () =>
            ipcRenderer.invoke('alops:getActiveAlerts'),
        getConfig: () =>
            ipcRenderer.invoke('alops:getConfig'),
        isActive: () =>
            ipcRenderer.invoke('alops:isActive'),
    },

    // ========================================================================
    // V6.0 EVOLUTION SYSTEMS
    // ========================================================================

    // Execution Sandbox API (Docker-based isolation)
    dockerSandbox: {
        initialize: () =>
            ipcRenderer.invoke('sandbox:initialize'),
        execute: (request: any) =>
            ipcRenderer.invoke('sandbox:execute', request),
        validate: (request: any) =>
            ipcRenderer.invoke('sandbox:validate', request),
        getStatus: () =>
            ipcRenderer.invoke('sandbox:status'),
        cleanup: () =>
            ipcRenderer.invoke('sandbox:cleanup'),
    },

    // Retry Engine API (Circuit breaker + backoff)
    retry: {
        getStats: (endpointId?: string) =>
            ipcRenderer.invoke('retry:stats', endpointId),
        reset: (endpointId?: string) =>
            ipcRenderer.invoke('retry:reset', endpointId),
        getHealth: () =>
            ipcRenderer.invoke('retry:health'),
    },

    // Code Verifier API (Security + validation)
    verifier: {
        verify: (request: any) =>
            ipcRenderer.invoke('verify:code', request),
        quickValidate: (code: string, language: string) =>
            ipcRenderer.invoke('verify:quick', code, language),
    },

    // Vector Store API (Persistent embeddings)
    vectors: {
        initialize: () =>
            ipcRenderer.invoke('vectors:initialize'),
        search: (query: string, options?: any) =>
            ipcRenderer.invoke('vectors:search', query, options),
        indexFile: (filePath: string, content?: string) =>
            ipcRenderer.invoke('vectors:indexFile', filePath, content),
        indexDirectory: (dirPath: string, options?: any) =>
            ipcRenderer.invoke('vectors:indexDirectory', dirPath, options),
        deleteFile: (filePath: string) =>
            ipcRenderer.invoke('vectors:deleteFile', filePath),
        getStats: () =>
            ipcRenderer.invoke('vectors:stats'),
    },

    // Active Learning API (Behavior modification)
    activeLearning: {
        initialize: () =>
            ipcRenderer.invoke('learning:initialize'),
        trackOutcome: (outcome: any) =>
            ipcRenderer.invoke('learning:trackOutcome', outcome),
        registerVariant: (basePromptId: string, variant: string, hypothesis: string) =>
            ipcRenderer.invoke('learning:registerVariant', basePromptId, variant, hypothesis),
        getBestPrompt: (basePromptId: string) =>
            ipcRenderer.invoke('learning:getBestPrompt', basePromptId),
        getProfile: (agentId: string) =>
            ipcRenderer.invoke('learning:getProfile', agentId),
        suggestMutations: (currentPrompt: string, recentOutcomes: any[]) =>
            ipcRenderer.invoke('learning:suggestMutations', currentPrompt, recentOutcomes),
        getStats: () =>
            ipcRenderer.invoke('learning:stats'),
        exportData: () =>
            ipcRenderer.invoke('learning:export'),
        importData: (data: string) =>
            ipcRenderer.invoke('learning:import', data),
    },

    // HTN Planner API (Hierarchical task planning)
    planner: {
        createPlan: (goal: string, description?: string) =>
            ipcRenderer.invoke('planner:createPlan', goal, description),
        executePlan: (planId: string) =>
            ipcRenderer.invoke('planner:executePlan', planId),
        verifyPlan: (planId: string) =>
            ipcRenderer.invoke('planner:verifyPlan', planId),
        rollbackPlan: (planId: string, toSnapshot?: number) =>
            ipcRenderer.invoke('planner:rollbackPlan', planId, toSnapshot),
        getPlan: (planId: string) =>
            ipcRenderer.invoke('planner:getPlan', planId),
        getAllPlans: () =>
            ipcRenderer.invoke('planner:getAllPlans'),
        deletePlan: (planId: string) =>
            ipcRenderer.invoke('planner:deletePlan', planId),
        getStats: () =>
            ipcRenderer.invoke('planner:stats'),
    },

    // Message Bus API (Inter-agent messaging)
    messageBus: {
        registerAgent: (agentId: string) =>
            ipcRenderer.invoke('bus:registerAgent', agentId),
        unregisterAgent: (agentId: string) =>
            ipcRenderer.invoke('bus:unregisterAgent', agentId),
        subscribe: (agentId: string, topic: string) =>
            ipcRenderer.invoke('bus:subscribe', agentId, topic),
        unsubscribe: (subscriptionId: string) =>
            ipcRenderer.invoke('bus:unsubscribe', subscriptionId),
        broadcast: (from: string, topic: string, payload: any, priority?: string) =>
            ipcRenderer.invoke('bus:broadcast', from, topic, payload, priority),
        send: (from: string, to: string, payload: any, priority?: string) =>
            ipcRenderer.invoke('bus:send', from, to, payload, priority),
        request: (from: string, to: string, payload: any, timeout?: number) =>
            ipcRenderer.invoke('bus:request', from, to, payload, timeout),
        getAgents: () =>
            ipcRenderer.invoke('bus:getAgents'),
        getTopics: () =>
            ipcRenderer.invoke('bus:getTopics'),
        getHistory: (agentId: string, limit?: number) =>
            ipcRenderer.invoke('bus:getHistory', agentId, limit),
        getStats: () =>
            ipcRenderer.invoke('bus:stats'),
    },

    // Agent Process API (Worker thread agents)
    agentProcess: {
        spawn: (config: any) =>
            ipcRenderer.invoke('agents:spawn', config),
        terminate: (agentId: string) =>
            ipcRenderer.invoke('agents:terminate', agentId),
        terminateAll: () =>
            ipcRenderer.invoke('agents:terminateAll'),
        assignTask: (agentId: string, task: any) =>
            ipcRenderer.invoke('agents:assignTask', agentId, task),
        dispatch: (capability: string, task: any) =>
            ipcRenderer.invoke('agents:dispatch', capability, task),
        getAgent: (agentId: string) =>
            ipcRenderer.invoke('agents:getAgent', agentId),
        getAllAgents: () =>
            ipcRenderer.invoke('agents:getAllAgents'),
        getStats: () =>
            ipcRenderer.invoke('agents:stats'),
    },

    // Web Search API (Online search capability)
    webSearch: {
        search: (query: string, options?: any) =>
            ipcRenderer.invoke('search:web', query, options),
        searchNews: (query: string, options?: any) =>
            ipcRenderer.invoke('search:news', query, options),
        searchImages: (query: string, options?: any) =>
            ipcRenderer.invoke('search:images', query, options),
        clearCache: () =>
            ipcRenderer.invoke('search:clearCache'),
        getStats: () =>
            ipcRenderer.invoke('search:stats'),
    },

    // File Attachment API (Drag & drop, paste)
    attachment: {
        processFile: (filePath: string) =>
            ipcRenderer.invoke('attachment:processFile', filePath),
        processUrl: (url: string) =>
            ipcRenderer.invoke('attachment:processUrl', url),
        processClipboard: (data: any) =>
            ipcRenderer.invoke('attachment:processClipboard', data),
        openDialog: () =>
            ipcRenderer.invoke('attachment:openDialog'),
        get: (id: string) =>
            ipcRenderer.invoke('attachment:get', id),
        getAll: () =>
            ipcRenderer.invoke('attachment:getAll'),
        remove: (id: string) =>
            ipcRenderer.invoke('attachment:remove', id),
        clearAll: () =>
            ipcRenderer.invoke('attachment:clearAll'),
        getContext: () =>
            ipcRenderer.invoke('attachment:getContext'),
        getImagesForVision: () =>
            ipcRenderer.invoke('attachment:getImagesForVision'),
        getStats: () =>
            ipcRenderer.invoke('attachment:stats'),
    },

    // RBAC API (Role-Based Access Control)
    rbac: {
        getAllRoles: () =>
            ipcRenderer.invoke('rbac:getAllRoles'),
        getRole: (roleId: string) =>
            ipcRenderer.invoke('rbac:getRole', roleId),
        addUser: (user: any) =>
            ipcRenderer.invoke('rbac:addUser', user),
        getUser: (userId: string) =>
            ipcRenderer.invoke('rbac:getUser', userId),
        setCurrentUser: (userId: string) =>
            ipcRenderer.invoke('rbac:setCurrentUser', userId),
        getCurrentUser: () =>
            ipcRenderer.invoke('rbac:getCurrentUser'),
        checkAccess: (params: any) =>
            ipcRenderer.invoke('rbac:checkAccess', params),
        assignRole: (userId: string, roleId: string) =>
            ipcRenderer.invoke('rbac:assignRole', userId, roleId),
        removeRole: (userId: string, roleId: string) =>
            ipcRenderer.invoke('rbac:removeRole', userId, roleId),
        createApiKey: (userId: string, params: any) =>
            ipcRenderer.invoke('rbac:createApiKey', userId, params),
        validateApiKey: (key: string) =>
            ipcRenderer.invoke('rbac:validateApiKey', key),
        revokeApiKey: (userId: string, keyId: string) =>
            ipcRenderer.invoke('rbac:revokeApiKey', userId, keyId),
    },

    // Learning API (Cross-Project Pattern Sharing)
    learning: {
        getAllPatterns: () =>
            ipcRenderer.invoke('learning:getAllPatterns'),
        getPattern: (id: string) =>
            ipcRenderer.invoke('learning:getPattern', id),
        getPatternsByType: (type: string) =>
            ipcRenderer.invoke('learning:getPatternsByType', type),
        findPatterns: (params: any) =>
            ipcRenderer.invoke('learning:findPatterns', params),
        applyPattern: (patternId: string, params: any) =>
            ipcRenderer.invoke('learning:applyPattern', patternId, params),
        addPattern: (pattern: any) =>
            ipcRenderer.invoke('learning:addPattern', pattern),
        recordFeedback: (patternId: string, success: boolean) =>
            ipcRenderer.invoke('learning:recordFeedback', patternId, success),
        extractFromProject: (params: any) =>
            ipcRenderer.invoke('learning:extractFromProject', params),
        getProjectLearnings: () =>
            ipcRenderer.invoke('learning:getProjectLearnings'),
    },

    // Snapshot API (Sandbox State Management)
    snapshot: {
        create: (params: any) =>
            ipcRenderer.invoke('snapshot:create', params),
        getAll: () =>
            ipcRenderer.invoke('snapshot:getAll'),
        get: (id: string) =>
            ipcRenderer.invoke('snapshot:get', id),
        restore: (id: string) =>
            ipcRenderer.invoke('snapshot:restore', id),
        delete: (id: string) =>
            ipcRenderer.invoke('snapshot:delete', id),
        compare: (id1: string, id2: string) =>
            ipcRenderer.invoke('snapshot:compare', id1, id2),
        createBranch: (name: string, baseSnapshotId?: string) =>
            ipcRenderer.invoke('snapshot:createBranch', name, baseSnapshotId),
        switchBranch: (branchName: string) =>
            ipcRenderer.invoke('snapshot:switchBranch', branchName),
        getAllBranches: () =>
            ipcRenderer.invoke('snapshot:getAllBranches'),
        getCurrentBranch: () =>
            ipcRenderer.invoke('snapshot:getCurrentBranch'),
        getSandboxRoot: () =>
            ipcRenderer.invoke('snapshot:getSandboxRoot'),
    },

    // ========================================================================
    // ADVANCED FEATURES APIs
    // ========================================================================

    // Time-Travel Debugging API
    timeTravel: {
        captureState: (label: string, files: any, metadata?: any) =>
            ipcRenderer.invoke('timetravel:captureState', label, files, metadata),
        travelTo: (stateId: string) =>
            ipcRenderer.invoke('timetravel:travelTo', stateId),
        createBranch: (branchName: string) =>
            ipcRenderer.invoke('timetravel:createBranch', branchName),
        switchBranch: (branchName: string) =>
            ipcRenderer.invoke('timetravel:switchBranch', branchName),
        getFileEvolution: (filePath: string) =>
            ipcRenderer.invoke('timetravel:getFileEvolution', filePath),
        diffStates: (fromStateId: string, toStateId: string, filePath?: string) =>
            ipcRenderer.invoke('timetravel:diffStates', fromStateId, toStateId, filePath),
        getTimeline: () => ipcRenderer.invoke('timetravel:getTimeline'),
        getBranches: () => ipcRenderer.invoke('timetravel:getBranches'),
        // Game-specific time travel debugging
        rewindTo: (tick: number) => ipcRenderer.invoke('timeTravel:rewindTo', tick),
        createGameBranch: (name: string, fromTick?: number) => ipcRenderer.invoke('timeTravel:createBranch', name, fromTick),
        getVisualization: () => ipcRenderer.invoke('timeTravel:getVisualization'),
        generateCode: () => ipcRenderer.invoke('timeTravel:generateCode'),
    },


    // Autonomous Debugging API
    autoDebug: {
        captureError: (error: any) =>
            ipcRenderer.invoke('autodebug:captureError', error),
        applyFix: (diagnosisId: string, fixId: string) =>
            ipcRenderer.invoke('autodebug:applyFix', diagnosisId, fixId),
        rollbackFix: (actionId: string) =>
            ipcRenderer.invoke('autodebug:rollbackFix', actionId),
        getRecentErrors: (limit?: number) =>
            ipcRenderer.invoke('autodebug:getRecentErrors', limit),
        getPatterns: () => ipcRenderer.invoke('autodebug:getPatterns'),
        setAutoHeal: (enabled: boolean) =>
            ipcRenderer.invoke('autodebug:setAutoHeal', enabled),
    },

    // Gamification API
    gamification: {
        registerDeveloper: (id: string, name: string) =>
            ipcRenderer.invoke('gamification:registerDeveloper', id, name),
        getDeveloper: (id: string) =>
            ipcRenderer.invoke('gamification:getDeveloper', id),
        awardXP: (developerId: string, action: string, context?: any) =>
            ipcRenderer.invoke('gamification:awardXP', developerId, action, context),
        awardBadge: (developerId: string, badgeId: string) =>
            ipcRenderer.invoke('gamification:awardBadge', developerId, badgeId),
        getLeaderboard: (limit?: number) =>
            ipcRenderer.invoke('gamification:getLeaderboard', limit),
        getAllBadges: () => ipcRenderer.invoke('gamification:getAllBadges'),
        getActiveChallenges: () => ipcRenderer.invoke('gamification:getActiveChallenges'),
    },

    // Ethics Analysis API
    ethics: {
        analyze: (code: string) => ipcRenderer.invoke('ethics:analyze', code),
        getRecentAnalyses: (limit?: number) =>
            ipcRenderer.invoke('ethics:getRecentAnalyses', limit),
        getMostCommonConcerns: () =>
            ipcRenderer.invoke('ethics:getMostCommonConcerns'),
        getApprovalRate: () => ipcRenderer.invoke('ethics:getApprovalRate'),
    },

    // Multi-Source RAG API
    rag: {
        retrieve: (query: string, options?: any) =>
            ipcRenderer.invoke('rag:retrieve', query, options),
        addSource: (source: any) => ipcRenderer.invoke('rag:addSource', source),
        removeSource: (sourceId: string) =>
            ipcRenderer.invoke('rag:removeSource', sourceId),
        getSources: () => ipcRenderer.invoke('rag:getSources'),
        addDream: (title: string, content: string, tags?: string[]) =>
            ipcRenderer.invoke('rag:addDream', title, content, tags),
        getDreams: () => ipcRenderer.invoke('rag:getDreams'),
    },

    // Prompt Marketplace API
    marketplace: {
        publishPrompt: (prompt: any) =>
            ipcRenderer.invoke('marketplace:publishPrompt', prompt),
        search: (query: string, filters?: any) =>
            ipcRenderer.invoke('marketplace:search', query, filters),
        getTrending: (limit?: number) =>
            ipcRenderer.invoke('marketplace:getTrending', limit),
        getTopRated: (limit?: number) =>
            ipcRenderer.invoke('marketplace:getTopRated', limit),
        getPrompt: (promptId: string) =>
            ipcRenderer.invoke('marketplace:getPrompt', promptId),
        addReview: (promptId: string, userId: string, rating: number, review: string) =>
            ipcRenderer.invoke('marketplace:addReview', promptId, userId, rating, review),
        trackUsage: (promptId: string, success: boolean) =>
            ipcRenderer.invoke('marketplace:trackUsage', promptId, success),
    },

    // Creative Ideation API
    ideation: {
        startSession: (topic: string, context?: string) =>
            ipcRenderer.invoke('ideation:startSession', topic, context),
        brainstorm: (sessionId: string, config?: any) =>
            ipcRenderer.invoke('ideation:brainstorm', sessionId, config),
        generatePrototype: (sessionId: string, ideaId: string, type: string) =>
            ipcRenderer.invoke('ideation:generatePrototype', sessionId, ideaId, type),
        voteIdea: (sessionId: string, ideaId: string, delta?: number) =>
            ipcRenderer.invoke('ideation:voteIdea', sessionId, ideaId, delta),
        getTopIdeas: (sessionId: string, limit?: number) =>
            ipcRenderer.invoke('ideation:getTopIdeas', sessionId, limit),
        getAllSessions: () => ipcRenderer.invoke('ideation:getAllSessions'),
    },

    // Alchemy Code Transmuter API
    alchemy: {
        transmute: (request: any) => ipcRenderer.invoke('alchemy:transmute', request),
        getSupportedTransformations: () =>
            ipcRenderer.invoke('alchemy:getSupportedTransformations'),
        getResult: (id: string) => ipcRenderer.invoke('alchemy:getResult', id),
    },

    // Sustainability Optimizer API
    sustainability: {
        analyze: (code: string, language?: string) =>
            ipcRenderer.invoke('sustainability:analyze', code, language),
        optimize: (code: string) =>
            ipcRenderer.invoke('sustainability:optimize', code),
        getGreenTips: () => ipcRenderer.invoke('sustainability:getGreenTips'),
        getAllAnalyses: () => ipcRenderer.invoke('sustainability:getAllAnalyses'),
    },

    // Infinite Canvas API
    canvas: {
        create: (name: string) => ipcRenderer.invoke('canvas:create', name),
        get: (id: string) => ipcRenderer.invoke('canvas:get', id),
        delete: (id: string) => ipcRenderer.invoke('canvas:delete', id),
        addNode: (canvasId: string, node: any) =>
            ipcRenderer.invoke('canvas:addNode', canvasId, node),
        updateNode: (canvasId: string, nodeId: string, updates: any) =>
            ipcRenderer.invoke('canvas:updateNode', canvasId, nodeId, updates),
        deleteNode: (canvasId: string, nodeId: string) =>
            ipcRenderer.invoke('canvas:deleteNode', canvasId, nodeId),
        addConnection: (canvasId: string, from: string, to: string, type?: string) =>
            ipcRenderer.invoke('canvas:addConnection', canvasId, from, to, type),
        applyLayout: (canvasId: string, algorithm: string) =>
            ipcRenderer.invoke('canvas:applyLayout', canvasId, algorithm),
        undo: (canvasId: string) => ipcRenderer.invoke('canvas:undo', canvasId),
        redo: (canvasId: string) => ipcRenderer.invoke('canvas:redo', canvasId),
        export: (canvasId: string) => ipcRenderer.invoke('canvas:export', canvasId),
        import: (json: string) => ipcRenderer.invoke('canvas:import', json),
        getAllCanvases: () => ipcRenderer.invoke('canvas:getAllCanvases'),
    },

    // Collaborative AI Swarm API
    swarm: {
        submitTask: (type: string, input: string, priority?: string) =>
            ipcRenderer.invoke('swarm:submitTask', type, input, priority),
        getModels: () => ipcRenderer.invoke('swarm:getModels'),
        setStrategy: (strategy: string) =>
            ipcRenderer.invoke('swarm:setStrategy', strategy),
        setConfig: (updates: any) => ipcRenderer.invoke('swarm:setConfig', updates),
        getUsageStats: () => ipcRenderer.invoke('swarm:getUsageStats'),
        getRecentTasks: (limit?: number) =>
            ipcRenderer.invoke('swarm:getRecentTasks', limit),
    },

    // ========================================================================
    // v24 APEX: AGENT INTELLIGENCE ENHANCEMENTS
    // ========================================================================

    // Reasoning Tracer - Agent thought process inspection
    reasoning: {
        startTrace: (taskId: string) => ipcRenderer.invoke('reasoning:startTrace', taskId),
        endTrace: (summary?: string) => ipcRenderer.invoke('reasoning:endTrace', summary),
        recordThought: (content: string, confidence?: number) =>
            ipcRenderer.invoke('reasoning:recordThought', content, confidence),
        recordDecision: (decision: string, alternatives: string[], rationale: string) =>
            ipcRenderer.invoke('reasoning:recordDecision', decision, alternatives, rationale),
        getSession: (sessionId: string) => ipcRenderer.invoke('reasoning:getSession', sessionId),
        exportTrace: (sessionId: string, format: 'json' | 'markdown' | 'mermaid') =>
            ipcRenderer.invoke('reasoning:exportTrace', sessionId, format),
        getStats: () => ipcRenderer.invoke('reasoning:getStats'),
    },

    // Adaptive Tool Selector - AI-powered tool recommendations
    toolSelector: {
        analyzeTask: (description: string, context?: any) =>
            ipcRenderer.invoke('toolSelector:analyzeTask', description, context),
        getAIRecommendations: (description: string, context?: any) =>
            ipcRenderer.invoke('toolSelector:getAIRecommendations', description, context),
        getSuggestions: (description: string) =>
            ipcRenderer.invoke('toolSelector:getSuggestions', description),
        learnFromExecution: (toolName: string, success: boolean, executionTimeMs: number) =>
            ipcRenderer.invoke('toolSelector:learnFromExecution', toolName, success, executionTimeMs),
        getStats: () => ipcRenderer.invoke('toolSelector:getStats'),
    },

    // Unified Agent Bus - Inter-agent communication
    agentBus: {
        registerAgent: (agentId: string, name: string, capabilities: string[]) =>
            ipcRenderer.invoke('agentBus:registerAgent', agentId, name, capabilities),
        getStatus: () => ipcRenderer.invoke('agentBus:getStatus'),
        getDirectory: () => ipcRenderer.invoke('agentBus:getDirectory'),
        findAgentsByCapability: (capability: string) =>
            ipcRenderer.invoke('agentBus:findAgentsByCapability', capability),
        delegate: (capability: string, request: any) =>
            ipcRenderer.invoke('agentBus:delegate', capability, request),
        broadcast: (topic: string, payload: any) =>
            ipcRenderer.invoke('agentBus:broadcast', topic, payload),
    },

    // Model Capability Matcher - Task-to-model matching
    modelMatcher: {
        analyzeComplexity: (description: string) =>
            ipcRenderer.invoke('modelMatcher:analyzeComplexity', description),
        matchTaskToModel: (description: string, requiredCapabilities?: string[]) =>
            ipcRenderer.invoke('modelMatcher:matchTaskToModel', description, requiredCapabilities),
        getOptimalModel: (description: string, constraints?: any) =>
            ipcRenderer.invoke('modelMatcher:getOptimalModel', description, constraints),
        getCapabilities: (modelId: string) =>
            ipcRenderer.invoke('modelMatcher:getCapabilities', modelId),
        getAllCapabilities: () => ipcRenderer.invoke('modelMatcher:getAllCapabilities'),
        getStats: () => ipcRenderer.invoke('modelMatcher:getStats'),
    },

    // ========================================================================
    // DOMAIN-SPECIFIC AGENTS (Kimi K2 Enhancements)
    // ========================================================================

    // Mobile Agent API
    mobile: {
        execute: (task: any) => ipcRenderer.invoke('mobile:execute', task),
        getCapabilities: () => ipcRenderer.invoke('mobile:getCapabilities'),
        detectPlatform: (task: any) => ipcRenderer.invoke('mobile:detectPlatform', task),
        generateMetadata: (description: string, platform: 'ios' | 'android') =>
            ipcRenderer.invoke('mobile:generateMetadata', description, platform),
    },

    // Game Agent API
    game: {
        execute: (task: any) => ipcRenderer.invoke('game:execute', task),
        getCapabilities: () => ipcRenderer.invoke('game:getCapabilities'),
        detectEngine: (task: any) => ipcRenderer.invoke('game:detectEngine', task),
        generateProcedural: (asset: any, project: any) =>
            ipcRenderer.invoke('game:generateProcedural', asset, project),
        designMultiplayer: (task: any, project: any) =>
            ipcRenderer.invoke('game:designMultiplayer', task, project),
    },

    // Desktop Agent API
    desktop: {
        execute: (task: any) => ipcRenderer.invoke('desktop:execute', task),
        getCapabilities: () => ipcRenderer.invoke('desktop:getCapabilities'),
        detectFramework: (task: any) => ipcRenderer.invoke('desktop:detectFramework', task),
        generateInstaller: (config: any, project: any) =>
            ipcRenderer.invoke('desktop:generateInstaller', config, project),
    },

    // Temporal Context Engine API
    temporal: {
        analyzeArchaeology: (filePath: string) =>
            ipcRenderer.invoke('temporal:analyzeArchaeology', filePath),
        learnPatterns: (developerId: string) =>
            ipcRenderer.invoke('temporal:learnPatterns', developerId),
        predictNext: (developerId: string, currentFile: string, recentActions: string[]) =>
            ipcRenderer.invoke('temporal:predictNext', developerId, currentFile, recentActions),
        getStats: () => ipcRenderer.invoke('temporal:getStats'),
    },

    // HiveMind Service API
    hivemind: {
        learnPattern: (problem: string, solution: string, category: string, metadata?: any) =>
            ipcRenderer.invoke('hivemind:learnPattern', problem, solution, category, metadata),
        query: (query: any) => ipcRenderer.invoke('hivemind:query', query),
        getBestSolution: (problem: string) =>
            ipcRenderer.invoke('hivemind:getBestSolution', problem),
        getStats: () => ipcRenderer.invoke('hivemind:getStats'),
    },

    // Reality Simulator API
    simulator: {
        createShadow: (config: any) => ipcRenderer.invoke('simulator:createShadow', config),
        simulateUsers: (options: any) => ipcRenderer.invoke('simulator:simulateUsers', options),
        runChaos: (experiment: any) => ipcRenderer.invoke('simulator:runChaos', experiment),
        runLoadTest: (options: any) => ipcRenderer.invoke('simulator:runLoadTest', options),
        testResilience: (components: string[]) =>
            ipcRenderer.invoke('simulator:testResilience', components),
        getStats: () => ipcRenderer.invoke('simulator:getStats'),
    },

    // Domain Tools API
    domainTools: {
        list: () => ipcRenderer.invoke('domainTools:list'),
        listByCategory: (category: 'mobile' | 'game' | 'desktop') =>
            ipcRenderer.invoke('domainTools:listByCategory', category),
        get: (name: string) => ipcRenderer.invoke('domainTools:get', name),
        execute: (name: string, params: any) =>
            ipcRenderer.invoke('domainTools:execute', name, params),
    },

    // ========================================================================
    // KIMI K2 ENHANCEMENT APIS
    // ========================================================================

    // Evolution Agent - Autonomous project evolution
    evolution: {
        checkDependencies: () => ipcRenderer.invoke('evolution:checkDependencies'),
        applySecurityPatches: () => ipcRenderer.invoke('evolution:applySecurityPatches'),
        analyzeTechnicalDebt: () => ipcRenderer.invoke('evolution:analyzeTechnicalDebt'),
        suggestModernizations: () => ipcRenderer.invoke('evolution:suggestModernizations'),
        generateReport: () => ipcRenderer.invoke('evolution:generateReport'),
    },

    // Agent Collaboration - Multi-agent task execution
    agentCollaboration: {
        parallelExecute: (agentIds: string[], task: any) =>
            ipcRenderer.invoke('collaboration:parallelExecute', agentIds, task),
        debate: (topic: string, agentIds: string[], context?: any) =>
            ipcRenderer.invoke('collaboration:debate', topic, agentIds, context),
        getStats: () => ipcRenderer.invoke('collaboration:getStats'),
    },

    // Self-Healing - Auto-fix code issues
    selfHealing: {
        autoFixLint: () => ipcRenderer.invoke('selfHealing:autoFixLint'),
        resolveDependencies: () => ipcRenderer.invoke('selfHealing:resolveDependencies'),
        diagnoseBuild: () => ipcRenderer.invoke('selfHealing:diagnoseBuild'),
        runFull: () => ipcRenderer.invoke('selfHealing:runFull'),
        getStats: () => ipcRenderer.invoke('selfHealing:getStats'),
    },

    // What-If Simulator - Simulate changes
    whatif: {
        simulateRefactoring: (refactor: any) =>
            ipcRenderer.invoke('whatif:simulateRefactoring', refactor),
        simulateDependencyUpgrade: (dep: any) =>
            ipcRenderer.invoke('whatif:simulateDependencyUpgrade', dep),
        simulateArchitectureChange: (change: any) =>
            ipcRenderer.invoke('whatif:simulateArchitectureChange', change),
        compareImplementations: (implA: any, implB: any) =>
            ipcRenderer.invoke('whatif:compareImplementations', implA, implB),
    },

    // Predictive Development - Anticipate needs
    predictive: {
        nextFiles: (currentFile: string) =>
            ipcRenderer.invoke('predictive:nextFiles', currentFile),
        suggestRefactoring: () => ipcRenderer.invoke('predictive:suggestRefactoring'),
        detectBurnout: () => ipcRenderer.invoke('predictive:detectBurnout'),
        estimateTime: (task: any) => ipcRenderer.invoke('predictive:estimateTime', task),
        identifyBlockers: (context: any) =>
            ipcRenderer.invoke('predictive:identifyBlockers', context),
    },

    // Developer DNA - Personalization
    developerDNA: {
        analyze: (code: string) => ipcRenderer.invoke('developerDNA:analyze', code),
        learn: (developerId: string, code: string) =>
            ipcRenderer.invoke('developerDNA:learn', developerId, code),
        getPeakHours: (developerId: string) =>
            ipcRenderer.invoke('developerDNA:getPeakHours', developerId),
        getProfile: (developerId: string) =>
            ipcRenderer.invoke('developerDNA:getProfile', developerId),
    },

    // Analytics - Development metrics
    devAnalytics: {
        recordLines: (lines: number) => ipcRenderer.invoke('analytics:recordLines', lines),
        recordCommit: (bugCount?: number) =>
            ipcRenderer.invoke('analytics:recordCommit', bugCount),
        getMetrics: () => ipcRenderer.invoke('analytics:getMetrics'),
        identifyBottlenecks: () => ipcRenderer.invoke('analytics:identifyBottlenecks'),
        predictDeadlineRisk: (daysRemaining: number, tasksRemaining: number, avgTaskDays: number) =>
            ipcRenderer.invoke('analytics:predictDeadlineRisk', daysRemaining, tasksRemaining, avgTaskDays),
    },

    // Specialist Agents (Kimi K2)
    unifiedPlatform: {
        execute: (task: any) => ipcRenderer.invoke('unified:execute', task),
        getCapabilities: () => ipcRenderer.invoke('unified:getCapabilities'),
    },
    apiArchitect: {
        execute: (task: any) => ipcRenderer.invoke('apiArchitect:execute', task),
    },
    databaseAgent: {
        execute: (task: any) => ipcRenderer.invoke('database:execute', task),
    },
    accessibility: {
        execute: (task: any) => ipcRenderer.invoke('accessibility:execute', task),
    },
    localization: {
        execute: (task: any) => ipcRenderer.invoke('localization:execute', task),
    },
    migration: {
        execute: (task: any) => ipcRenderer.invoke('migration:execute', task),
    },
    incident: {
        execute: (task: any) => ipcRenderer.invoke('incident:execute', task),
    },
    spatial: {
        execute: (task: any) => ipcRenderer.invoke('spatial:execute', task),
    },

    // Game Development Service API
    gameDev: {
        getTemplate: (framework: string) => ipcRenderer.invoke('gameDev:getTemplate', framework),
        getFrameworks: () => ipcRenderer.invoke('gameDev:getFrameworks'),
        getInstallCommand: (framework: string) => ipcRenderer.invoke('gameDev:getInstallCommand', framework),
        getPygameTemplate: () => ipcRenderer.invoke('gameDev:getPygameTemplate'),
        getPhaserTemplate: () => ipcRenderer.invoke('gameDev:getPhaserTemplate'),
        getThreeJsTemplate: () => ipcRenderer.invoke('gameDev:getThreeJsTemplate'),
        getGodotTemplate: () => ipcRenderer.invoke('gameDev:getGodotTemplate'),
        getUnityTemplate: () => ipcRenderer.invoke('gameDev:getUnityTemplate'),
        getLibGDXTemplate: () => ipcRenderer.invoke('gameDev:getLibGDXTemplate'),
    },

    // Procedural Generation API
    procGen: {
        generateTerrain: (params: any) => ipcRenderer.invoke('procGen:generateTerrain', params),
        generateDungeon: (params: any) => ipcRenderer.invoke('procGen:generateDungeon', params),
        generateCharacter: (params?: any) => ipcRenderer.invoke('procGen:generateCharacter', params || {}),
        generateItem: (params: any) => ipcRenderer.invoke('procGen:generateItem', params),
        generateName: (race?: string) => ipcRenderer.invoke('procGen:generateName', race),
    },

    // Game Physics API
    physics: {
        checkAABB: (a: any, b: any) => ipcRenderer.invoke('physics:checkAABB', a, b),
        checkCircle: (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) =>
            ipcRenderer.invoke('physics:checkCircle', x1, y1, r1, x2, y2, r2),
        generateCollisionCode: (engine: string) => ipcRenderer.invoke('physics:generateCollisionCode', engine),
        generateMovementCode: (type: string) => ipcRenderer.invoke('physics:generateMovementCode', type),
        generateProjectileCode: () => ipcRenderer.invoke('physics:generateProjectileCode'),
        generateParticleCode: () => ipcRenderer.invoke('physics:generateParticleCode'),
    },

    // Multiplayer Network API
    network: {
        recommendArchitecture: (gameType: string, maxPlayers: number) =>
            ipcRenderer.invoke('network:recommendArch', gameType, maxPlayers),
        generateServerCode: (library: string) => ipcRenderer.invoke('network:generateServerCode', library),
        generateClientCode: (library: string) => ipcRenderer.invoke('network:generateClientCode', library),
        generateLagCompensation: () => ipcRenderer.invoke('network:generateLagCompensation'),
    },

    // AI Behavior Tree API
    behaviorTree: {
        getPatrolTree: () => ipcRenderer.invoke('ai:getPatrolTree'),
        getCombatTree: () => ipcRenderer.invoke('ai:getCombatTree'),
        generateBTCode: (tree: any, engine: string) => ipcRenderer.invoke('ai:generateBTCode', tree, engine),
        generateFSMCode: () => ipcRenderer.invoke('ai:generateFSMCode'),
    },

    // Game Audio API
    gameAudio: {
        generateManagerCode: (engine: string) => ipcRenderer.invoke('audio:generateManagerCode', engine),
        generateSpatialCode: () => ipcRenderer.invoke('audio:generateSpatialCode'),
    },


    // Emotion Engine API
    emotionEngine: {
        createNPC: (id: string, name: string, personality?: string) => ipcRenderer.invoke('emotion:createNPC', id, name, personality),
        triggerEmotion: (npcId: string, emotion: string, intensity: number, reason: string) =>
            ipcRenderer.invoke('emotion:triggerEmotion', npcId, emotion, intensity, reason),
        getModifiers: (npcId: string) => ipcRenderer.invoke('emotion:getModifiers', npcId),
        generateCode: () => ipcRenderer.invoke('emotion:generateCode'),
    },

    // Dialogue Director API
    dialogueDirector: {
        createConversation: (id: string, name: string, participants: string[]) =>
            ipcRenderer.invoke('dialogue:createConversation', id, name, participants),
        generateGreeting: (name: string, relationship: number, timeOfDay: string) =>
            ipcRenderer.invoke('dialogue:generateGreeting', name, relationship, timeOfDay),
        generateBark: (emotion: string, context: string) => ipcRenderer.invoke('dialogue:generateBark', emotion, context),
        generateCode: () => ipcRenderer.invoke('dialogue:generateCode'),
    },

    // World Builder API
    worldBuilder: {
        generate: (config: any) => ipcRenderer.invoke('world:generate', config),
    },

    // Quest Generator API
    questGenerator: {
        generate: (type: string, difficulty: string, context?: any) =>
            ipcRenderer.invoke('quest:generate', type, difficulty, context),
        generateChain: (name: string, length: number, startDifficulty: string) =>
            ipcRenderer.invoke('quest:generateChain', name, length, startDifficulty),
        generateCode: () => ipcRenderer.invoke('quest:generateCode'),
    },

    // Loot Table API
    lootTable: {
        generateDrop: (tableId: string, level?: number, luck?: number) =>
            ipcRenderer.invoke('loot:generateDrop', tableId, level || 1, luck || 0),
        createMonsterTable: (monsterType: string, level: number) =>
            ipcRenderer.invoke('loot:createMonsterTable', monsterType, level),
        createChestTable: (tier: string) => ipcRenderer.invoke('loot:createChestTable', tier),
        generateCode: () => ipcRenderer.invoke('loot:generateCode'),
    },

    // Save Game API
    saveGame: {
        getAllSlots: () => ipcRenderer.invoke('save:getAllSlots'),
        getSlotMetadata: (slot: number) => ipcRenderer.invoke('save:getSlotMetadata', slot),
        generateCode: () => ipcRenderer.invoke('save:generateCode'),
    },

    // Achievement API
    achievements: {
        registerPlayer: (playerId: string) => ipcRenderer.invoke('achievement:registerPlayer', playerId),
        updateStat: (playerId: string, stat: string, value: number) =>
            ipcRenderer.invoke('achievement:updateStat', playerId, stat, value),
        getPlayerAchievements: (playerId: string) => ipcRenderer.invoke('achievement:getPlayerAchievements', playerId),
        getLeaderboard: (limit?: number) => ipcRenderer.invoke('achievement:getLeaderboard', limit || 10),
        generateCode: () => ipcRenderer.invoke('achievement:generateCode'),
    },

    // Skill Tree API
    skillTree: {
        getAllTrees: () => ipcRenderer.invoke('skills:getAllTrees'),
        registerPlayer: (playerId: string, startingPoints?: number) =>
            ipcRenderer.invoke('skills:registerPlayer', playerId, startingPoints || 0),
        allocateSkill: (playerId: string, treeId: string, skillId: string) =>
            ipcRenderer.invoke('skills:allocate', playerId, treeId, skillId),
        calculateBonuses: (playerId: string) => ipcRenderer.invoke('skills:calculateBonuses', playerId),
        generateCode: () => ipcRenderer.invoke('skills:generateCode'),
    },

    // Crafting API
    crafting: {
        getRecipes: (playerId: string, station?: string) =>
            ipcRenderer.invoke('crafting:getRecipes', playerId, station),
        unlockRecipe: (playerId: string, recipeId: string) =>
            ipcRenderer.invoke('crafting:unlockRecipe', playerId, recipeId),
        generateCode: () => ipcRenderer.invoke('crafting:generateCode'),
    },

    // Particle Effects API
    particles: {
        getPresets: () => ipcRenderer.invoke('particles:getPresets'),
        getPreset: (name: string) => ipcRenderer.invoke('particles:getPreset', name),
        generateCode: () => ipcRenderer.invoke('particles:generateCode'),
    },

    // Camera API
    camera: {
        getCinematic: (id: string) => ipcRenderer.invoke('camera:getCinematic', id),
        generateCode: () => ipcRenderer.invoke('camera:generateCode'),
    },

    // Input Manager API
    inputManager: {
        getBindings: () => ipcRenderer.invoke('input:getBindings'),
        getCombos: () => ipcRenderer.invoke('input:getCombos'),
        generateCode: () => ipcRenderer.invoke('input:generateCode'),
    },

    // Game Project Creation API
    gameProject: {
        create: (config: any) => ipcRenderer.invoke('gameProject:create', config),
    },

    // Game Agent Orchestrator API
    gameAgent: {
        createGame: (spec: any, outputPath: string) => ipcRenderer.invoke('gameAgent:createGame', spec, outputPath),
        createPlatformer: (title: string, outputPath: string) => ipcRenderer.invoke('gameAgent:createPlatformer', title, outputPath),
        createRPG: (title: string, outputPath: string) => ipcRenderer.invoke('gameAgent:createRPG', title, outputPath),
        createShooter: (title: string, outputPath: string) => ipcRenderer.invoke('gameAgent:createShooter', title, outputPath),
    },

    // Game Testing API
    gameTest: {
        run: (projectPath: string) => ipcRenderer.invoke('gameTest:run', projectPath),
        generateCode: () => ipcRenderer.invoke('gameTest:generateCode'),
    },

    // Asset Pipeline API
    assetPipeline: {
        createManifest: (projectPath: string) => ipcRenderer.invoke('assets:createManifest', projectPath),
        generatePlaceholders: (projectPath: string, sprites: any[]) => ipcRenderer.invoke('assets:generatePlaceholders', projectPath, sprites),
        generateLoaderCode: () => ipcRenderer.invoke('assets:generateLoaderCode'),
    },

    // Game Code Completion API
    gameCompletion: {
        get: (context: any) => ipcRenderer.invoke('completion:game:get', context),
        getCategories: () => ipcRenderer.invoke('completion:game:categories'),
        getByCategory: (category: string) => ipcRenderer.invoke('completion:game:byCategory', category),
    },

    // Visual Designer API
    visualDesigner: {
        createProject: (name: string) => ipcRenderer.invoke('designer:createProject', name),
        createScene: (name: string) => ipcRenderer.invoke('designer:createScene', name),
        addEntity: (entity: any) => ipcRenderer.invoke('designer:addEntity', entity),
        exportPhaser: () => ipcRenderer.invoke('designer:exportPhaser'),
        exportJSON: () => ipcRenderer.invoke('designer:exportJSON'),
    },

    // Asset Generator API
    assetGenerator: {
        generateSprite: (spec: any) => ipcRenderer.invoke('assetGen:generateSprite', spec),
        generateTileset: (w: number, h: number, size: number, palette?: string) =>
            ipcRenderer.invoke('assetGen:generateTileset', w, h, size, palette),
        getPalettes: () => ipcRenderer.invoke('assetGen:getPalettes'),
    },

    // Hot Reload API
    hotReload: {
        start: (projectPath: string, config?: any) => ipcRenderer.invoke('hotReload:start', projectPath, config),
        stop: () => ipcRenderer.invoke('hotReload:stop'),
        generateClientCode: () => ipcRenderer.invoke('hotReload:generateClientCode'),
        generateServerCode: () => ipcRenderer.invoke('hotReload:generateServerCode'),
    },

    // Multi-Engine Export API
    engineExport: {
        toGodot: (scene: any) => ipcRenderer.invoke('export:toGodot', scene),
        toUnity: (scene: any) => ipcRenderer.invoke('export:toUnity', scene),
        toEngine: (scene: any, engine: string) => ipcRenderer.invoke('export:toEngine', scene, engine),
        getSupportedEngines: () => ipcRenderer.invoke('export:getSupportedEngines'),
    },

    // Multiplayer API
    multiplayer: {
        getTemplate: (library: string) => ipcRenderer.invoke('multiplayer:getTemplate', library),
        getLobbyCode: () => ipcRenderer.invoke('multiplayer:getLobbyCode'),
    },

    // Game Analytics API
    gameAnalytics: {
        startSession: () => ipcRenderer.invoke('analytics:startSession'),
        endSession: () => ipcRenderer.invoke('analytics:endSession'),
        trackEvent: (type: string, data: any) => ipcRenderer.invoke('analytics:trackEvent', type, data),
        generateReport: () => ipcRenderer.invoke('analytics:generateReport'),
        generateCode: () => ipcRenderer.invoke('analytics:generateCode'),
    },

    // Auto Playtester API
    playtest: {
        simulate: (config: any) => ipcRenderer.invoke('playtest:simulate', config),
        analyze: (results: any[]) => ipcRenderer.invoke('playtest:analyze', results),
        generateCode: () => ipcRenderer.invoke('playtest:generateCode'),
    },

    // Level Editor API
    levelEditor: {
        generate: (config: any) => ipcRenderer.invoke('levelEditor:generate', config),
        getDefaultConfig: () => ipcRenderer.invoke('levelEditor:getDefaultConfig'),
    },

    // Story Generator API
    storyGenerator: {
        generate: (config: any) => ipcRenderer.invoke('story:generate', config),
    },

    // Shader Generator API
    shaders: {
        getEffect: (effect: string) => ipcRenderer.invoke('shader:getEffect', effect),
        getAllEffects: () => ipcRenderer.invoke('shader:getAllEffects'),
        generateCode: () => ipcRenderer.invoke('shader:generateCode'),
    },

    // Animation System API
    animations: {
        get: (id: string) => ipcRenderer.invoke('animation:get', id),
        getController: (id: string) => ipcRenderer.invoke('animation:getController', id),
        generateCode: () => ipcRenderer.invoke('animation:generateCode'),
    },

    // Tween Engine API
    tweens: {
        getAllEasings: () => ipcRenderer.invoke('tween:getAllEasings'),
        generateCode: () => ipcRenderer.invoke('tween:generateCode'),
    },

    // UI Layout API
    uiLayout: {
        getLayout: (id: string) => ipcRenderer.invoke('ui:getLayout', id),
        getTheme: (name: string) => ipcRenderer.invoke('ui:getTheme', name),
        getAllThemes: () => ipcRenderer.invoke('ui:getAllThemes'),
        generateCode: () => ipcRenderer.invoke('ui:generateCode'),
    },

    // Localization API
    i18n: {
        getAllLanguages: () => ipcRenderer.invoke('i18n:getAllLanguages'),
        setLanguage: (code: string) => ipcRenderer.invoke('i18n:setLanguage', code),
        t: (key: string, ...args: any[]) => ipcRenderer.invoke('i18n:t', key, ...args),
        generateCode: () => ipcRenderer.invoke('i18n:generateCode'),
    },

    // Procedural Music API
    proceduralMusic: {
        generate: (config: any) => ipcRenderer.invoke('music:generate', config),
        getMoods: () => ipcRenderer.invoke('music:getMoods'),
        generatePlayerCode: () => ipcRenderer.invoke('music:generatePlayerCode'),
    },

    // Sound Effects API
    soundEffects: {
        getCode: (type: string) => ipcRenderer.invoke('sfx:getCode', type),
        getAllEffects: () => ipcRenderer.invoke('sfx:getAllEffects'),
        generateManagerCode: () => ipcRenderer.invoke('sfx:generateManagerCode'),
    },

    // Cutscene API
    cutscenes: {
        get: (id: string) => ipcRenderer.invoke('cutscene:get', id),
        generateCode: () => ipcRenderer.invoke('cutscene:generateCode'),
    },

    // Touch Controls API
    touchControls: {
        getLayout: (id: string) => ipcRenderer.invoke('touch:getLayout', id),
        getAllLayouts: () => ipcRenderer.invoke('touch:getAllLayouts'),
        generateCode: () => ipcRenderer.invoke('touch:generateCode'),
    },

    // Pathfinding API
    pathfinding: {
        findPath: (grid: boolean[][], startX: number, startY: number, endX: number, endY: number) =>
            ipcRenderer.invoke('pathfinding:findPath', grid, startX, startY, endX, endY),
        generateCode: () => ipcRenderer.invoke('pathfinding:generateCode'),
    },

    // Weather API
    weather: {
        set: (config: any) => ipcRenderer.invoke('weather:setWeather', config),
        get: () => ipcRenderer.invoke('weather:getWeather'),
        getTypes: () => ipcRenderer.invoke('weather:getTypes'),
        generateCode: () => ipcRenderer.invoke('weather:generateCode'),
    },

    // Replay API
    replay: {
        generateCode: () => ipcRenderer.invoke('replay:generateCode'),
    },

    // Cheats API
    cheats: {
        getAll: () => ipcRenderer.invoke('cheats:getAll'),
        generateCode: () => ipcRenderer.invoke('cheats:generateCode'),
    },

    // Console Commands API
    devConsole: {
        getCommands: () => ipcRenderer.invoke('console:getCommands'),
        generateCode: () => ipcRenderer.invoke('console:generateCode'),
    },

    // Day/Night API
    dayNight: {
        getLighting: (progress: number) => ipcRenderer.invoke('dayNight:getLighting', progress),
        generateCode: () => ipcRenderer.invoke('dayNight:generateCode'),
    },

    // Trail Renderer API
    trails: {
        getStyles: () => ipcRenderer.invoke('trails:getStyles'),
        generateCode: () => ipcRenderer.invoke('trails:generateCode'),
    },

    // Formation System API
    formations: {
        get: (type: string, count: number, spacing?: number) => ipcRenderer.invoke('formation:get', type, count, spacing),
        getTypes: () => ipcRenderer.invoke('formation:getTypes'),
        generateCode: () => ipcRenderer.invoke('formation:generateCode'),
    },

    // Leaderboard API
    leaderboard: {
        get: (id: string) => ipcRenderer.invoke('leaderboard:get', id),
        submit: (boardId: string, playerId: string, name: string, score: number) =>
            ipcRenderer.invoke('leaderboard:submit', boardId, playerId, name, score),
        generateCode: () => ipcRenderer.invoke('leaderboard:generateCode'),
    },

    // Debug Draw API
    debugDraw: {
        generateCode: () => ipcRenderer.invoke('debug:generateCode'),
    },

    // Game Performance Profiler API
    gameProfiler: {
        generateCode: () => ipcRenderer.invoke('profiler:generateCode'),
    },

    // Object Pooling API
    pooling: {
        generateCode: () => ipcRenderer.invoke('pooling:generateCode'),
    },

    // Collision Layers API
    collision: {
        getLayers: () => ipcRenderer.invoke('collision:getLayers'),
        generateCode: () => ipcRenderer.invoke('collision:generateCode'),
    },

    // Screen Shake API
    screenShake: {
        getTypes: () => ipcRenderer.invoke('shake:getTypes'),
        generateCode: () => ipcRenderer.invoke('shake:generateCode'),
    },

    // Territory System API
    territory: {
        generateCode: () => ipcRenderer.invoke('territory:generateCode'),
    },

    // Screenshot API
    screenshot: {
        generateCode: () => ipcRenderer.invoke('screenshot:generateCode'),
    },

    // Adaptive Music API
    adaptiveMusic: {
        getLevels: () => ipcRenderer.invoke('adaptiveMusic:getLevels'),
        generateCode: () => ipcRenderer.invoke('adaptiveMusic:generateCode'),
    },

    // Encryption API
    encryption: {
        generateCode: () => ipcRenderer.invoke('encryption:generateCode'),
    },

    // Spawn System API
    spawns: {
        generateCode: () => ipcRenderer.invoke('spawn:generateCode'),
    },

    // Waypoint System API
    waypoints: {
        generateCode: () => ipcRenderer.invoke('waypoint:generateCode'),
    },

    // Rhythm Game API
    rhythmGame: {
        generateCode: () => ipcRenderer.invoke('rhythm:generateCode'),
    },

    // Racing API
    racing: {
        generateCode: () => ipcRenderer.invoke('racing:generateCode'),
    },

    // Puzzle API
    puzzles: {
        getTypes: () => ipcRenderer.invoke('puzzle:getTypes'),
        generateCode: () => ipcRenderer.invoke('puzzle:generateCode'),
    },

    // Minimap API
    minimap: {
        generateCode: () => ipcRenderer.invoke('minimap:generateCode'),
    },

    // Tutorial API
    tutorials: {
        generateCode: () => ipcRenderer.invoke('tutorial:generateCode'),
    },

    // Vibration API
    vibration: {
        getPatterns: () => ipcRenderer.invoke('vibration:getPatterns'),
        generateCode: () => ipcRenderer.invoke('vibration:generateCode'),
    },

    // Dialogue Tree API
    dialogueTree: {
        generateCode: () => ipcRenderer.invoke('dialogueTree:generateCode'),
    },

    // Achievement Popup API
    achievementPopup: {
        generateCode: () => ipcRenderer.invoke('achievementPopup:generateCode'),
    },

    // Godot Exporter API
    godotExporter: {
        export: (gameDef: any) => ipcRenderer.invoke('godot:export', gameDef),
        getPlayerScript: () => ipcRenderer.invoke('godot:playerScript'),
        getEnemyScript: () => ipcRenderer.invoke('godot:enemyScript'),
    },

    // GameMaker Exporter API
    gameMakerExporter: {
        export: (gameDef: any) => ipcRenderer.invoke('gml:export', gameDef),
    },

    // API Documentation API
    apiDocs: {
        generateAll: () => ipcRenderer.invoke('docs:generateAll'),
    },

    // Code Snippet Library API
    gameSnippets: {
        getAll: () => ipcRenderer.invoke('snippets:getAll'),
        getByCategory: (category: string) => ipcRenderer.invoke('snippets:getByCategory', category),
        search: (query: string) => ipcRenderer.invoke('snippets:search', query),
        getCategories: () => ipcRenderer.invoke('snippets:getCategories'),
    },


    // Natural Language Game Design API
    nlGameDesign: {
        parse: (description: string) => ipcRenderer.invoke('nlDesign:parse', description),
        getGenres: () => ipcRenderer.invoke('nlDesign:getGenres'),
        getMechanics: () => ipcRenderer.invoke('nlDesign:getMechanics'),
    },

    // Survival System API
    survival: {
        generateCode: () => ipcRenderer.invoke('survival:generateCode'),
    },

    // Card Game API
    cardGame: {
        generateCode: () => ipcRenderer.invoke('cardGame:generateCode'),
    },

    // Tower Defense API
    towerDefense: {
        generateCode: () => ipcRenderer.invoke('towerDefense:generateCode'),
    },

    // Idle Clicker API
    idleGame: {
        generateCode: () => ipcRenderer.invoke('idle:generateCode'),
    },

    // Roguelike API
    roguelike: {
        generateCode: () => ipcRenderer.invoke('roguelike:generateCode'),
    },

    // Lobby System API
    lobby: {
        generateCode: () => ipcRenderer.invoke('lobby:generateCode'),
    },

    // Gesture Recognizer API
    gestures: {
        getTypes: () => ipcRenderer.invoke('gestures:getTypes'),
        generateCode: () => ipcRenderer.invoke('gestures:generateCode'),
    },

    // IAP Manager API
    iap: {
        generateCode: () => ipcRenderer.invoke('iap:generateCode'),
    },

    // Game State Inspector API
    gameInspector: {
        generateCode: () => ipcRenderer.invoke('inspector:generateCode'),
    },

    // Balance Tester API
    balanceTester: {
        generateCode: () => ipcRenderer.invoke('balance:generateCode'),
    },

    // Love2D Exporter API
    love2dExporter: {
        export: (gameDef: any) => ipcRenderer.invoke('love2d:export', gameDef),
    },

    // Construct 3 Exporter API
    construct3Exporter: {
        export: (gameDef: any) => ipcRenderer.invoke('construct3:export', gameDef),
    },

    // Learning Pathway API
    learningPath: {
        registerLearner: (id: string, name: string) =>
            ipcRenderer.invoke('learning:registerLearner', id, name),
        getLearner: (id: string) =>
            ipcRenderer.invoke('learning:getLearner', id),
        assessSkill: (learnerId: string, skill: string, score: number) =>
            ipcRenderer.invoke('learning:assessSkill', learnerId, skill, score),
        analyzeSkillGaps: (learnerId: string, targetSkills?: string[]) =>
            ipcRenderer.invoke('learning:analyzeSkillGaps', learnerId, targetSkills),
        completeModule: (learnerId: string, moduleId: string) =>
            ipcRenderer.invoke('learning:completeModule', learnerId, moduleId),
        startPathway: (learnerId: string, pathwayId: string) =>
            ipcRenderer.invoke('learning:startPathway', learnerId, pathwayId),
        getPathwayProgress: (learnerId: string) =>
            ipcRenderer.invoke('learning:getPathwayProgress', learnerId),
        getModules: (filter?: any) =>
            ipcRenderer.invoke('learning:getModules', filter),
        getPathways: () => ipcRenderer.invoke('learning:getPathways'),
        getLeaderboard: (limit?: number) =>
            ipcRenderer.invoke('learning:getLeaderboard', limit),
    },

    // Predictive Streaming API
    predictiveStream: {
        startStream: (streamId: string) =>
            ipcRenderer.invoke('streaming:startStream', streamId),
        processToken: (streamId: string, token: string) =>
            ipcRenderer.invoke('streaming:processToken', streamId, token),
        endStream: (streamId: string) =>
            ipcRenderer.invoke('streaming:endStream', streamId),
        preRender: (context: any) =>
            ipcRenderer.invoke('streaming:preRender', context),
        getMetrics: () => ipcRenderer.invoke('streaming:getMetrics'),
    },

    // Code Security Scanner API
    security: {
        scan: (code: string, language?: string) =>
            ipcRenderer.invoke('security:scan', code, language),
        applyFix: (scanId: string, vulnId: string) =>
            ipcRenderer.invoke('security:applyFix', scanId, vulnId),
        getScan: (id: string) => ipcRenderer.invoke('security:getScan', id),
        getAllScans: () => ipcRenderer.invoke('security:getAllScans'),
        getVulnerabilityStats: () =>
            ipcRenderer.invoke('security:getVulnerabilityStats'),
    },

    // API Mock Generator API
    mockApi: {
        create: (name: string, config?: any) =>
            ipcRenderer.invoke('mockapi:create', name, config),
        addEndpoint: (mockId: string, endpoint: any) =>
            ipcRenderer.invoke('mockapi:addEndpoint', mockId, endpoint),
        fromOpenAPI: (spec: any) =>
            ipcRenderer.invoke('mockapi:fromOpenAPI', spec),
        generateCRUD: (mockId: string, resourceName: string, schema?: any) =>
            ipcRenderer.invoke('mockapi:generateCRUD', mockId, resourceName, schema),
        generateData: (type: string, count?: number) =>
            ipcRenderer.invoke('mockapi:generateData', type, count),
        exportAsExpress: (mockId: string) =>
            ipcRenderer.invoke('mockapi:exportAsExpress', mockId),
        getMock: (id: string) => ipcRenderer.invoke('mockapi:getMock', id),
        getAllMocks: () => ipcRenderer.invoke('mockapi:getAllMocks'),
    },

    // Code Metrics Dashboard API
    codeMetrics: {
        analyze: (files: { path: string; content: string }[]) =>
            ipcRenderer.invoke('codemetrics:analyze', files),
        getLatestSnapshot: () =>
            ipcRenderer.invoke('codemetrics:getLatestSnapshot'),
        getSnapshots: (limit?: number) =>
            ipcRenderer.invoke('codemetrics:getSnapshots', limit),
        getQualityGates: () =>
            ipcRenderer.invoke('codemetrics:getQualityGates'),
        getHotspots: () => ipcRenderer.invoke('codemetrics:getHotspots'),
    },

    // Code Review API
    review: {
        file: (filePath: string) =>
            ipcRenderer.invoke('review:file', filePath),
        project: (params: { path: string; include?: string[]; exclude?: string[] }) =>
            ipcRenderer.invoke('review:project', params),
        getSuggestions: (issue: any) =>
            ipcRenderer.invoke('review:getSuggestions', issue),
        getHistory: (limit?: number) =>
            ipcRenderer.invoke('review:getHistory', limit),
        getLatest: () =>
            ipcRenderer.invoke('review:getLatest'),
        getRules: () =>
            ipcRenderer.invoke('review:getRules'),
    },

    // ========================================================================
    // ENHANCED AGENT FEATURES
    // ========================================================================

    // Context Memory System API
    contextMemory: {
        store: (content: string, type: string, metadata?: any) =>
            ipcRenderer.invoke('memory:store', content, type, metadata),
        retrieve: (query: any) =>
            ipcRenderer.invoke('memory:retrieve', query),
        getById: (id: string) =>
            ipcRenderer.invoke('memory:getById', id),
        buildContext: (input: string, projectId?: string) =>
            ipcRenderer.invoke('memory:buildContext', input, projectId),
        forget: (id: string) =>
            ipcRenderer.invoke('memory:forget', id),
        getSummary: () => ipcRenderer.invoke('memory:getSummary'),
        getStats: () => ipcRenderer.invoke('memory:getStats'),
        export: () => ipcRenderer.invoke('memory:export'),
        import: (data: any) => ipcRenderer.invoke('memory:import', data),
        clear: () => ipcRenderer.invoke('memory:clear'),
    },

    // Adaptive Response System API
    adaptive: {
        createProfile: (name: string, settings: any) =>
            ipcRenderer.invoke('adaptive:createProfile', name, settings),
        updateProfile: (id: string, updates: any) =>
            ipcRenderer.invoke('adaptive:updateProfile', id, updates),
        deleteProfile: (id: string) =>
            ipcRenderer.invoke('adaptive:deleteProfile', id),
        setActiveProfile: (id: string) =>
            ipcRenderer.invoke('adaptive:setActiveProfile', id),
        getActiveProfile: () =>
            ipcRenderer.invoke('adaptive:getActiveProfile'),
        getAllProfiles: () =>
            ipcRenderer.invoke('adaptive:getAllProfiles'),
        detectProfile: (input: string) =>
            ipcRenderer.invoke('adaptive:detectProfile', input),
        recordInteraction: (interaction: any) =>
            ipcRenderer.invoke('adaptive:recordInteraction', interaction),
        getRecommendations: () =>
            ipcRenderer.invoke('adaptive:getRecommendations'),
        applyRecommendations: (recommendations: any[]) =>
            ipcRenderer.invoke('adaptive:applyRecommendations', recommendations),
        formatResponse: (content: string, metadata?: any) =>
            ipcRenderer.invoke('adaptive:formatResponse', content, metadata),
        getStats: () => ipcRenderer.invoke('adaptive:getStats'),
    },

    // Intelligent Refactorer API
    refactor: {
        analyze: (code: string, language?: string) =>
            ipcRenderer.invoke('refactor:analyze', code, language),
        apply: (sessionId: string, suggestionId: string) =>
            ipcRenderer.invoke('refactor:apply', sessionId, suggestionId),
        getSession: (id: string) =>
            ipcRenderer.invoke('refactor:getSession', id),
        getAllSessions: () =>
            ipcRenderer.invoke('refactor:getAllSessions'),
        getConfig: () => ipcRenderer.invoke('refactor:getConfig'),
        setConfig: (config: any) =>
            ipcRenderer.invoke('refactor:setConfig', config),
    },

    // AI Model Benchmark API
    benchmark: {
        createSuite: (name: string, models: string[], tasks?: any[]) =>
            ipcRenderer.invoke('benchmark:createSuite', name, models, tasks),
        runSuite: (suiteId: string) =>
            ipcRenderer.invoke('benchmark:runSuite', suiteId),
        getSuite: (id: string) =>
            ipcRenderer.invoke('benchmark:getSuite', id),
        getAllSuites: () =>
            ipcRenderer.invoke('benchmark:getAllSuites'),
        getModelScore: (modelId: string) =>
            ipcRenderer.invoke('benchmark:getModelScore', modelId),
        getAllModelScores: () =>
            ipcRenderer.invoke('benchmark:getAllModelScores'),
        getBestModel: (category: string) =>
            ipcRenderer.invoke('benchmark:getBestModel', category),
        getComparison: () =>
            ipcRenderer.invoke('benchmark:getComparison'),
        getDefaultTasks: () =>
            ipcRenderer.invoke('benchmark:getDefaultTasks'),
    },

    // Smart Project Analyzer API
    projectAnalysis: {
        analyze: (projectPath: string) =>
            ipcRenderer.invoke('projectAnalysis:analyze', projectPath),
        get: (id: string) =>
            ipcRenderer.invoke('projectAnalysis:get', id),
        getAll: () =>
            ipcRenderer.invoke('projectAnalysis:getAll'),
        getLatest: () =>
            ipcRenderer.invoke('projectAnalysis:getLatest'),
    },

    // Workflow Automation API
    workflow: {
        create: (workflow: any) =>
            ipcRenderer.invoke('workflow:create', workflow),
        update: (id: string, updates: any) =>
            ipcRenderer.invoke('workflow:update', id, updates),
        delete: (id: string) =>
            ipcRenderer.invoke('workflow:delete', id),
        get: (id: string) =>
            ipcRenderer.invoke('workflow:get', id),
        getAll: () =>
            ipcRenderer.invoke('workflow:getAll'),
        getTemplates: () =>
            ipcRenderer.invoke('workflow:getTemplates'),
        createFromTemplate: (index: number) =>
            ipcRenderer.invoke('workflow:createFromTemplate', index),
        execute: (workflowId: string, variables?: any) =>
            ipcRenderer.invoke('workflow:execute', workflowId, variables),
        pause: (executionId: string) =>
            ipcRenderer.invoke('workflow:pause', executionId),
        resume: (executionId: string) =>
            ipcRenderer.invoke('workflow:resume', executionId),
        cancel: (executionId: string) =>
            ipcRenderer.invoke('workflow:cancel', executionId),
        getExecution: (id: string) =>
            ipcRenderer.invoke('workflow:getExecution', id),
        getHistory: (workflowId?: string) =>
            ipcRenderer.invoke('workflow:getHistory', workflowId),
        isRunning: () => ipcRenderer.invoke('workflow:isRunning'),
        getActive: () => ipcRenderer.invoke('workflow:getActive'),
    },

    // Intelligent Code Completion API
    completion: {
        getCompletions: (request: any) =>
            ipcRenderer.invoke('completion:getCompletions', request),
        accept: (sessionId: string, completionId: string) =>
            ipcRenderer.invoke('completion:accept', sessionId, completionId),
        getSession: (id: string) =>
            ipcRenderer.invoke('completion:getSession', id),
        getStats: () => ipcRenderer.invoke('completion:getStats'),
        clearHistory: () => ipcRenderer.invoke('completion:clearHistory'),
    },

    // Smart Error Recovery API
    errorRecovery: {
        capture: (error: any, context?: any) =>
            ipcRenderer.invoke('errorRecovery:capture', error, context),
        retry: (errorId: string) =>
            ipcRenderer.invoke('errorRecovery:retry', errorId),
        ignore: (errorId: string) =>
            ipcRenderer.invoke('errorRecovery:ignore', errorId),
        escalate: (errorId: string) =>
            ipcRenderer.invoke('errorRecovery:escalate', errorId),
        getError: (id: string) =>
            ipcRenderer.invoke('errorRecovery:getError', id),
        getRecent: (limit?: number) =>
            ipcRenderer.invoke('errorRecovery:getRecent', limit),
        getUnresolved: () =>
            ipcRenderer.invoke('errorRecovery:getUnresolved'),
        getStats: () => ipcRenderer.invoke('errorRecovery:getStats'),
        setAutoRecovery: (enabled: boolean) =>
            ipcRenderer.invoke('errorRecovery:setAutoRecovery', enabled),
    },

    // Intelligent Task Planner API
    taskPlanner: {
        create: (title: string, description: string) =>
            ipcRenderer.invoke('taskPlanner:create', title, description),
        createFromTemplate: (templateIndex: number, title: string) =>
            ipcRenderer.invoke('taskPlanner:createFromTemplate', templateIndex, title),
        generate: (description: string) =>
            ipcRenderer.invoke('taskPlanner:generate', description),
        addStep: (planId: string, step: any) =>
            ipcRenderer.invoke('taskPlanner:addStep', planId, step),
        updateStep: (planId: string, stepId: string, updates: any) =>
            ipcRenderer.invoke('taskPlanner:updateStep', planId, stepId, updates),
        completeStep: (planId: string, stepId: string, actualTime?: number) =>
            ipcRenderer.invoke('taskPlanner:completeStep', planId, stepId, actualTime),
        start: (planId: string) =>
            ipcRenderer.invoke('taskPlanner:start', planId),
        pause: (planId: string) =>
            ipcRenderer.invoke('taskPlanner:pause', planId),
        cancel: (planId: string) =>
            ipcRenderer.invoke('taskPlanner:cancel', planId),
        analyze: (planId: string) =>
            ipcRenderer.invoke('taskPlanner:analyze', planId),
        get: (id: string) =>
            ipcRenderer.invoke('taskPlanner:get', id),
        getAll: () => ipcRenderer.invoke('taskPlanner:getAll'),
        getActive: () => ipcRenderer.invoke('taskPlanner:getActive'),
        getTemplates: () => ipcRenderer.invoke('taskPlanner:getTemplates'),
        getProgress: (planId: string) =>
            ipcRenderer.invoke('taskPlanner:getProgress', planId),
    },

    // Code Quality Guardian API
    quality: {
        analyzeCode: (code: string, filePath?: string) =>
            ipcRenderer.invoke('quality:analyzeCode', code, filePath),
        analyzeFiles: (files: { path: string; content: string }[]) =>
            ipcRenderer.invoke('quality:analyzeFiles', files),
        getLatestReport: () =>
            ipcRenderer.invoke('quality:getLatestReport'),
        getReports: (limit?: number) =>
            ipcRenderer.invoke('quality:getReports', limit),
        getGates: () => ipcRenderer.invoke('quality:getGates'),
        addGate: (gate: any) =>
            ipcRenderer.invoke('quality:addGate', gate),
        updateGate: (id: string, updates: any) =>
            ipcRenderer.invoke('quality:updateGate', id, updates),
        removeGate: (id: string) =>
            ipcRenderer.invoke('quality:removeGate', id),
        getTrends: () => ipcRenderer.invoke('quality:getTrends'),
    },

    // AI Conversation Coach API
    coach: {
        analyzePrompt: (prompt: string) =>
            ipcRenderer.invoke('coach:analyzePrompt', prompt),
        startSession: () =>
            ipcRenderer.invoke('coach:startSession'),
        addMessage: (sessionId: string, role: 'user' | 'assistant', content: string) =>
            ipcRenderer.invoke('coach:addMessage', sessionId, role, content),
        getSession: (id: string) =>
            ipcRenderer.invoke('coach:getSession', id),
        getTemplates: () =>
            ipcRenderer.invoke('coach:getTemplates'),
        fillTemplate: (templateId: string, values: Record<string, string>) =>
            ipcRenderer.invoke('coach:fillTemplate', templateId, values),
        getStats: () => ipcRenderer.invoke('coach:getStats'),
    },

    // Collaboration Hub API
    collab: {
        setUser: (id: string, name: string, avatar?: string) =>
            ipcRenderer.invoke('collab:setUser', id, name, avatar),
        createSession: (name: string, projectPath: string) =>
            ipcRenderer.invoke('collab:createSession', name, projectPath),
        joinSession: (sessionId: string) =>
            ipcRenderer.invoke('collab:joinSession', sessionId),
        leaveSession: (sessionId: string) =>
            ipcRenderer.invoke('collab:leaveSession', sessionId),
        getSession: (id: string) =>
            ipcRenderer.invoke('collab:getSession', id),
        getCurrentSession: () =>
            ipcRenderer.invoke('collab:getCurrentSession'),
        getCollaborators: () =>
            ipcRenderer.invoke('collab:getCollaborators'),
        updateCursor: (position: any) =>
            ipcRenderer.invoke('collab:updateCursor', position),
        updateSelection: (selection: any) =>
            ipcRenderer.invoke('collab:updateSelection', selection),
        shareFile: (filePath: string) =>
            ipcRenderer.invoke('collab:shareFile', filePath),
        sendMessage: (content: string, codeBlock?: any) =>
            ipcRenderer.invoke('collab:sendMessage', content, codeBlock),
        getChatHistory: (limit?: number) =>
            ipcRenderer.invoke('collab:getChatHistory', limit),
        getStats: () => ipcRenderer.invoke('collab:getStats'),
    },

    // AI Knowledge Graph API
    knowledge: {
        addNode: (type: string, label: string, properties?: any) =>
            ipcRenderer.invoke('knowledge:addNode', type, label, properties),
        updateNode: (id: string, updates: any) =>
            ipcRenderer.invoke('knowledge:updateNode', id, updates),
        removeNode: (id: string) =>
            ipcRenderer.invoke('knowledge:removeNode', id),
        addEdge: (type: string, from: string, to: string, properties?: any) =>
            ipcRenderer.invoke('knowledge:addEdge', type, from, to, properties),
        traverse: (query: any) =>
            ipcRenderer.invoke('knowledge:traverse', query),
        findPath: (from: string, to: string) =>
            ipcRenderer.invoke('knowledge:findPath', from, to),
        getInsights: () => ipcRenderer.invoke('knowledge:getInsights'),
        getStats: () => ipcRenderer.invoke('knowledge:getStats'),
        export: () => ipcRenderer.invoke('knowledge:export'),
        import: (data: any) => ipcRenderer.invoke('knowledge:import', data),
    },

    // Smart Code Search API
    codeSearch: {
        indexFile: (path: string, content: string) =>
            ipcRenderer.invoke('codeSearch:indexFile', path, content),
        search: (query: string, options?: any) =>
            ipcRenderer.invoke('codeSearch:search', query, options),
        semanticSearch: (query: string, options?: any) =>
            ipcRenderer.invoke('codeSearch:semanticSearch', query, options),
        getSymbol: (name: string) =>
            ipcRenderer.invoke('codeSearch:getSymbol', name),
        getHistory: (limit?: number) =>
            ipcRenderer.invoke('codeSearch:getHistory', limit),
        getStats: () => ipcRenderer.invoke('codeSearch:getStats'),
    },

    // Intelligent Snippets API
    snippets: {
        add: (data: any) => ipcRenderer.invoke('snippets:add', data),
        update: (id: string, updates: any) =>
            ipcRenderer.invoke('snippets:update', id, updates),
        delete: (id: string) => ipcRenderer.invoke('snippets:delete', id),
        findByPrefix: (prefix: string) =>
            ipcRenderer.invoke('snippets:findByPrefix', prefix),
        search: (query: string, language?: string) =>
            ipcRenderer.invoke('snippets:search', query, language),
        getSuggestions: (context: any) =>
            ipcRenderer.invoke('snippets:getSuggestions', context),
        use: (id: string, variables?: any) =>
            ipcRenderer.invoke('snippets:use', id, variables),
        getAll: () => ipcRenderer.invoke('snippets:getAll'),
        getCategories: () => ipcRenderer.invoke('snippets:getCategories'),
        getStats: () => ipcRenderer.invoke('snippets:getStats'),
    },

    // AI Pair Programmer API
    pair: {
        startSession: (mode?: string) =>
            ipcRenderer.invoke('pair:startSession', mode),
        setMode: (sessionId: string, mode: string) =>
            ipcRenderer.invoke('pair:setMode', sessionId, mode),
        endSession: (sessionId: string) =>
            ipcRenderer.invoke('pair:endSession', sessionId),
        getActiveSession: () =>
            ipcRenderer.invoke('pair:getActiveSession'),
        updateContext: (sessionId: string, context: any) =>
            ipcRenderer.invoke('pair:updateContext', sessionId, context),
        recordChange: (sessionId: string, change: any) =>
            ipcRenderer.invoke('pair:recordChange', sessionId, change),
        reportError: (sessionId: string, error: any) =>
            ipcRenderer.invoke('pair:reportError', sessionId, error),
        acceptSuggestion: (sessionId: string, suggestionId: string) =>
            ipcRenderer.invoke('pair:acceptSuggestion', sessionId, suggestionId),
        dismissSuggestion: (sessionId: string, suggestionId: string) =>
            ipcRenderer.invoke('pair:dismissSuggestion', sessionId, suggestionId),
        askQuestion: (sessionId: string, question: string) =>
            ipcRenderer.invoke('pair:askQuestion', sessionId, question),
        getSuggestions: (sessionId: string) =>
            ipcRenderer.invoke('pair:getSuggestions', sessionId),
        getHistory: (sessionId: string) =>
            ipcRenderer.invoke('pair:getHistory', sessionId),
        getStats: (sessionId: string) =>
            ipcRenderer.invoke('pair:getStats', sessionId),
    },

    // AI Code Explainer API
    explainer: {
        explain: (request: any) =>
            ipcRenderer.invoke('explainer:explain', request),
        getExplanation: (id: string) =>
            ipcRenderer.invoke('explainer:getExplanation', id),
        getConcept: (name: string) =>
            ipcRenderer.invoke('explainer:getConcept', name),
        getAllConcepts: () => ipcRenderer.invoke('explainer:getAllConcepts'),
        getStats: () => ipcRenderer.invoke('explainer:getStats'),
    },

    // Intelligent Test Generator API
    testGen: {
        generate: (code: string, language: string, fileName: string, options?: any) =>
            ipcRenderer.invoke('testGen:generate', code, language, fileName, options),
        export: (suiteId: string) =>
            ipcRenderer.invoke('testGen:export', suiteId),
        getSuite: (id: string) =>
            ipcRenderer.invoke('testGen:getSuite', id),
        getAllSuites: () => ipcRenderer.invoke('testGen:getAllSuites'),
        getStats: () => ipcRenderer.invoke('testGen:getStats'),
    },

    // Smart Git Assistant API
    git: {
        getStatus: () => ipcRenderer.invoke('git:getStatus'),
        getHistory: (limit?: number) =>
            ipcRenderer.invoke('git:getHistory', limit),
        generateCommitMessage: (changes: any[]) =>
            ipcRenderer.invoke('git:generateCommitMessage', changes),
        suggestBranchName: (description: string) =>
            ipcRenderer.invoke('git:suggestBranchName', description),
        analyzeConflict: (file: string, ours: string, theirs: string) =>
            ipcRenderer.invoke('git:analyzeConflict', file, ours, theirs),
        analyzeRepository: () => ipcRenderer.invoke('git:analyzeRepository'),
        getStats: () => ipcRenderer.invoke('git:getStats'),
    },

    // Performance Profiler API
    profiler: {
        profile: (code: string, language: string, name?: string) =>
            ipcRenderer.invoke('profiler:profile', code, language, name),
        compare: (beforeId: string, afterId: string) =>
            ipcRenderer.invoke('profiler:compare', beforeId, afterId),
        getProfile: (id: string) =>
            ipcRenderer.invoke('profiler:getProfile', id),
        getAllProfiles: () => ipcRenderer.invoke('profiler:getAllProfiles'),
        getStats: () => ipcRenderer.invoke('profiler:getStats'),
    },

    // ========================================================================
    // REVOLUTIONARY AUTONOMOUS AGENT APIS
    // ========================================================================

    // 🧠 Project Knowledge Graph - Persistent Semantic Memory
    projectKnowledge: {
        createProject: (name: string, description: string) =>
            ipcRenderer.invoke('knowledge:createProject', name, description),
        getProject: (projectId: string) =>
            ipcRenderer.invoke('knowledge:getProject', projectId),
        updateProject: (projectId: string, updates: any) =>
            ipcRenderer.invoke('knowledge:updateProject', projectId, updates),
        addDecision: (projectId: string, question: string, answer: string, rationale: string, alternatives?: any[], constraints?: string[]) =>
            ipcRenderer.invoke('knowledge:addDecision', projectId, question, answer, rationale, alternatives, constraints),
        addRequirement: (projectId: string, content: string, category: string, priority: string, kpis?: any[]) =>
            ipcRenderer.invoke('knowledge:addRequirement', projectId, content, category, priority, kpis),
        query: (projectId: string, question: string) =>
            ipcRenderer.invoke('knowledge:query', projectId, question),
        getHistory: (projectId: string) =>
            ipcRenderer.invoke('knowledge:getHistory', projectId),
        getDecisionHistory: (projectId: string) =>
            ipcRenderer.invoke('knowledge:getDecisionHistory', projectId),
        getStats: (projectId: string) =>
            ipcRenderer.invoke('knowledge:getStats', projectId),
        recordMetric: (projectId: string, name: string, value: number, unit: string, target?: number) =>
            ipcRenderer.invoke('knowledge:recordMetric', projectId, name, value, unit, target),
    },

    // 🐝 BDI Agent Orchestrator - True Swarm Intelligence
    bdiSwarm: {
        submitTask: (description: string, projectId: string, priority?: string) =>
            ipcRenderer.invoke('bdi:submitTask', description, projectId, priority),
        getAgents: () => ipcRenderer.invoke('bdi:getAgents'),
        getAgent: (id: string) => ipcRenderer.invoke('bdi:getAgent', id),
        getTasks: () => ipcRenderer.invoke('bdi:getTasks'),
        getTask: (id: string) => ipcRenderer.invoke('bdi:getTask', id),
        getDebates: () => ipcRenderer.invoke('bdi:getDebates'),
        initiateDebate: (topic: string, taskId: string, participantRoles: string[]) =>
            ipcRenderer.invoke('bdi:initiateDebate', topic, taskId, participantRoles),
        getSwarmStatus: () => ipcRenderer.invoke('bdi:getSwarmStatus'),
    },

    // 🛡️ Security Fortress - Zero-Trust Security
    securityFortress: {
        storeCredential: (key: string, value: string, expiresIn?: number) =>
            ipcRenderer.invoke('security:storeCredential', key, value, expiresIn),
        getCredential: (key: string) =>
            ipcRenderer.invoke('security:getCredential', key),
        deleteCredential: (key: string) =>
            ipcRenderer.invoke('security:deleteCredential', key),
        createContext: (principal: string, permissions: string[], ttlMs?: number) =>
            ipcRenderer.invoke('security:createContext', principal, permissions, ttlMs),
        checkPermission: (contextId: string, permission: string, resource: string) =>
            ipcRenderer.invoke('security:checkPermission', contextId, permission, resource),
        scanForThreats: (code: string, filename?: string) =>
            ipcRenderer.invoke('security:scanForThreats', code, filename),
        executeInSandbox: (code: string, language: string, permissions: string[], timeout?: number) =>
            ipcRenderer.invoke('security:executeInSandbox', code, language, permissions, timeout),
        getReport: () => ipcRenderer.invoke('security:getReport'),
    },

    // 🎯 Intent Alignment Engine - True Goal Understanding
    intentAlignment: {
        parse: (input: string, projectId?: string) =>
            ipcRenderer.invoke('intent:parse', input, projectId),
        align: (intent: any) =>
            ipcRenderer.invoke('intent:align', intent),
        setProfile: (profile: any) =>
            ipcRenderer.invoke('intent:setProfile', profile),
        getProfile: () => ipcRenderer.invoke('intent:getProfile'),
        getHistory: () => ipcRenderer.invoke('intent:getHistory'),
    },

    // ⏰ Temporal Replay Engine - Decision Time-Travel
    temporalReplay: {
        logDecision: (projectId: string, agent: string, action: string, inputs: any, decision: any, llmRequest?: any, llmResponse?: any) =>
            ipcRenderer.invoke('temporal:logDecision', projectId, agent, action, inputs, decision, llmRequest, llmResponse),
        recordOutcome: (decisionId: string, success: boolean, result?: any, error?: string, sideEffects?: string[]) =>
            ipcRenderer.invoke('temporal:recordOutcome', decisionId, success, result, error, sideEffects),
        takeSnapshot: (projectId: string, description: string, trigger?: string) =>
            ipcRenderer.invoke('temporal:takeSnapshot', projectId, description, trigger),
        createTimeline: (projectId: string, name: string) =>
            ipcRenderer.invoke('temporal:createTimeline', projectId, name),
        branchTimeline: (decisionId: string, branchName: string) =>
            ipcRenderer.invoke('temporal:branchTimeline', decisionId, branchName),
        startReplay: (decisionId: string) =>
            ipcRenderer.invoke('temporal:startReplay', decisionId),
        stepReplay: (sessionId: string) =>
            ipcRenderer.invoke('temporal:stepReplay', sessionId),
        modifyDecision: (sessionId: string, decisionId: string, newChoice: string, newReasoning: string) =>
            ipcRenderer.invoke('temporal:modifyDecision', sessionId, decisionId, newChoice, newReasoning),
        rollbackToSnapshot: (snapshotId: string) =>
            ipcRenderer.invoke('temporal:rollbackToSnapshot', snapshotId),
        rollbackToDecision: (decisionId: string) =>
            ipcRenderer.invoke('temporal:rollbackToDecision', decisionId),
        getDecisionHistory: (projectId: string, limit?: number) =>
            ipcRenderer.invoke('temporal:getDecisionHistory', projectId, limit),
        findDecisions: (criteria: any) =>
            ipcRenderer.invoke('temporal:findDecisions', criteria),
        analyzeFailure: (decisionId: string) =>
            ipcRenderer.invoke('temporal:analyzeFailure', decisionId),
        getVisualization: (projectId: string) =>
            ipcRenderer.invoke('temporal:getVisualization', projectId),
    },

    // 🏢 Business-Aware Architect - Business Context Understanding
    businessArchitect: {
        generateBRD: (intent: any, projectId: string) =>
            ipcRenderer.invoke('business:generateBRD', intent, projectId),
        validateFeasibility: (brd: any) =>
            ipcRenderer.invoke('business:validateFeasibility', brd),
        getBRD: (id: string) =>
            ipcRenderer.invoke('business:getBRD', id),
        getAllBRDs: (projectId: string) =>
            ipcRenderer.invoke('business:getAllBRDs', projectId),
    },

    // 🔀 Intelligent Model Router - Cost/Quality Optimization
    modelRouter: {
        route: (request: any) => ipcRenderer.invoke('router:route', request),
        getModels: () => ipcRenderer.invoke('router:getModels'),
        getModel: (id: string) => ipcRenderer.invoke('router:getModel', id),
        getMetrics: (modelId: string) => ipcRenderer.invoke('router:getMetrics', modelId),
        getAllMetrics: () => ipcRenderer.invoke('router:getAllMetrics'),
        recordRequest: (modelId: string, success: boolean, latency: number, inputTokens: number, outputTokens: number, taskType: string) =>
            ipcRenderer.invoke('router:recordRequest', modelId, success, latency, inputTokens, outputTokens, taskType),
        recommend: (taskType: string) => ipcRenderer.invoke('router:recommend', taskType),
        getCostReport: () => ipcRenderer.invoke('router:getCostReport'),
    },

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (_, ...args) => callback(...args));
    },
    off: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, callback);
    },
});

// Type definitions for TypeScript
declare global {
    interface Window {
        shadowAPI: {
            listModels: () => Promise<any[]>;
            selectModel: (modelId: string) => Promise<void>;
            chat: (messages: any[]) => Promise<string>;

            // Streaming chat
            chatStream: (messages: any[]) => Promise<string>;
            onStreamStart: (callback: (data: { streamId: string }) => void) => void;
            onStreamToken: (callback: (data: { streamId: string; token: string; buffer: string }) => void) => void;
            onStreamComplete: (callback: (data: { streamId: string; response: string }) => void) => void;
            onStreamError: (callback: (data: { streamId: string; error: string }) => void) => void;
            removeStreamListeners: () => void;

            updateApiKeys: (keys: { [key: string]: string }) => Promise<any[]>;
            executeCommand: (command: string, params: any) => Promise<any>;
            analyzeFile: (filePath: string) => Promise<any>;
            buildProject: (config: any) => Promise<any>;
            deployProject: (config: any) => Promise<any>;
            queryKnowledge: (query: string) => Promise<any>;
            storeKnowledge: (data: any) => Promise<void>;
            processVoiceCommand: (text: string) => Promise<any>;

            // External Services
            getServicesStatus: () => Promise<any>;
            supabaseQuery: (table: string, filters?: any) => Promise<any>;
            supabaseInsert: (table: string, data: any) => Promise<any>;
            figmaExport: (fileKey: string, nodeId: string, format?: 'png' | 'svg' | 'jpg') => Promise<any>;
            figmaGetFile: (url: string) => Promise<any>;
            canvaGetUrl: (type: 'presentation' | 'social' | 'document') => Promise<any>;

            // Plugins
            listPlugins: () => Promise<any[]>;
            loadPlugin: (plugin: any) => Promise<any>;
            unloadPlugin: (pluginId: string) => Promise<void>;

            // Collaboration
            startCollaboration: (sessionId: string) => Promise<any>;
            joinCollaboration: (sessionId: string, userId: string) => Promise<any>;

            // Task Queue
            queueTask: (command: string, params: any, priority?: string) => Promise<any>;
            getTaskStatus: (taskId: string) => Promise<any>;
            cancelTask: (taskId: string) => Promise<void>;
            getQueueStats: () => Promise<any>;
            getAllTasks: () => Promise<any[]>;

            // Diagnostic
            diagnosticModelStatus: () => Promise<any>;

            // MCP Server
            getMCPStatus: () => Promise<{ running: boolean; autoStart: boolean }>;
            startMCPServer: () => Promise<void>;
            stopMCPServer: () => Promise<void>;
            setMCPAutoStart: (enabled: boolean) => Promise<void>;

            // Planning System
            analyzePlan: (userInput: string) => Promise<{
                success: boolean;
                analysis?: any;
                plan?: any;
                markdown?: string;
                error?: string;
            }>;
            requiresPlanning: (userInput: string) => Promise<boolean>;
            executePlan: (plan: any) => Promise<any>;

            // Testing Framework
            testing: {
                generateFromCode: (code: string, options: any) => Promise<any>;
                generateFromFile: (filePath: string, options: any) => Promise<any>;
                analyzeCode: (code: string) => Promise<any>;
                runTests: (framework: any, options: any) => Promise<any>;
                runAllTests: (options: any) => Promise<any>;
                detectFrameworks: (projectPath: string) => Promise<any>;
                getCoverage: (framework: any) => Promise<any>;
                analyzeQuality: (suite: any) => Promise<any>;
                getSuggestions: (suite: any) => Promise<any>;
                saveTestSuite: (suite: any, targetPath: string) => Promise<any>;
                previewTestFile: (suite: any) => Promise<any>;
                findTestFiles: (projectPath: string) => Promise<any>;
            };

            // Autonomous Workflows
            autonomous: {
                submit: (request: any) => Promise<{ jobId: string; status: string }>;
                getStatus: (jobId: string) => Promise<any>;
                getResults: (jobId: string) => Promise<any>;
                getAllWorkflows: () => Promise<any[]>;
                cancel: (jobId: string) => Promise<void>;
                getStats: () => Promise<any>;
                onUpdate: (callback: (message: any) => void) => void;
                offUpdate: (callback: (message: any) => void) => void;
            };

            on: (channel: string, callback: (...args: any[]) => void) => void;
            off: (channel: string, callback: (...args: any[]) => void) => void;
        };
    }
}
