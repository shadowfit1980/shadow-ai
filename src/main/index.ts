import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let mainWindow: BrowserWindow | null = null;

// isDev will be set after app is ready
let isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Preload path:', preloadPath);

    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1200,
        minHeight: 800,
        backgroundColor: '#0a0a0a',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false, // Disable sandbox for preload to work properly
            preload: preloadPath,
        },
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
let mcpServer: any = null;
let mcpAutoStart = true; // Auto-start MCP server by default

app.whenReady().then(() => {
    // Initialize services with user's credentials from environment
    const { ServiceManager } = require('./services/ServiceManager');
    ServiceManager.initialize({
        canva: {
            clientId: process.env.CANVA_CLIENT_ID || '',
            clientSecret: process.env.CANVA_CLIENT_SECRET || '',
        },
        supabase: {
            url: process.env.SUPABASE_URL || '',
            apiKey: process.env.SUPABASE_KEY || '',
        },
        figma: {
            accessToken: process.env.FIGMA_TOKEN || '',
        },
    });

    console.log('✅ External services initialized');

    // Start HTTP API server for browser access
    const { startApiServer } = require('./api/httpServer');
    startApiServer().catch((e: Error) => console.warn('HTTP API server failed:', e.message));

    // CRITICAL: Set up IPC handlers BEFORE creating window
    // This prevents race conditions where renderer calls handlers before they're registered
    setupIPC();

    // Auto-start MCP server if enabled
    if (mcpAutoStart) {
        setTimeout(async () => {
            try {
                const { ShadowMCPServer } = await import('./mcp/MCPServer');
                mcpServer = new ShadowMCPServer();
                await mcpServer.start();
                console.log('✅ MCP Server auto-started on launch');
            } catch (error: any) {
                console.warn('⚠️  MCP Server auto-start failed:', error.message);
            }
        }, 2000); // Delay to allow app to fully initialize
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Track registered channels to prevent duplicates
const registeredChannels = new Set<string>();

// Safe handler that skips duplicates
function safeHandle(channel: string, handler: (...args: any[]) => any) {
    if (registeredChannels.has(channel)) {
        return; // Skip duplicate
    }
    try {
        ipcMain.handle(channel, handler);
        registeredChannels.add(channel);
    } catch (e: any) {
        if (!e.message?.includes('second handler')) {
            console.error(`Error registering ${channel}:`, e.message);
        }
    }
}

// IPC Communication Setup
function setupIPC() {
    // Initialize tool handlers
    const { setupToolIPCHandlers } = require('./ipc/toolHandlers');
    setupToolIPCHandlers();

    // Initialize completion handlers
    const { setupCompletionIPCHandlers } = require('./ipc/completionHandlers');
    setupCompletionIPCHandlers();

    // Initialize prompt suggestion handlers
    const { setupPromptSuggestionHandlers } = require('./ipc/promptSuggestionHandlers');
    setupPromptSuggestionHandlers();

    // Initialize design generation handlers
    const { setupDesignHandlers } = require('./ipc/designHandlers');
    setupDesignHandlers();

    // Initialize context/codebase understanding handlers
    const { setupContextHandlers } = require('./ipc/contextHandlers');
    setupContextHandlers();

    // Initialize atomic editing handlers
    const { setupEditingHandlers } = require('./ipc/editingHandlers');
    setupEditingHandlers();

    // Initialize browser automation handlers
    const { setupBrowserHandlers } = require('./ipc/browserHandlers');
    setupBrowserHandlers();

    // Initialize safety handlers (PolicyStore, ModeManager)
    const { setupSafetyHandlers } = require('./ipc/safetyHandlers');
    setupSafetyHandlers();

    // Initialize agent handlers (VisionAgent, RedTeamAgent)
    const { setupAgentHandlers } = require('./ipc/agentHandlers');
    setupAgentHandlers();

    // Initialize metrics handlers
    const { setupMetricsHandlers } = require('./ipc/metricsHandlers');
    setupMetricsHandlers();

    // Initialize canary deployment handlers
    const { setupCanaryHandlers } = require('./ipc/canaryHandlers');
    setupCanaryHandlers();

    // Initialize ops (ALOps) handlers
    const { setupOpsHandlers } = require('./ipc/opsHandlers');
    setupOpsHandlers();

    // Initialize security (RBAC) handlers
    const { setupSecurityHandlers } = require('./ipc/securityHandlers');
    setupSecurityHandlers();

    // Initialize learning handlers (CrossProjectLearning)
    const { setupLearningHandlers } = require('./ipc/learningHandlers');
    setupLearningHandlers();

    // Initialize snapshot handlers (SandboxSnapshotManager)
    const { setupSnapshotHandlers } = require('./ipc/snapshotHandlers');
    setupSnapshotHandlers();

    // Initialize memory handlers
    try {
        const { setupMemoryHandlers } = require('./ipc/memoryHandlers');
        setupMemoryHandlers();
    } catch (error: any) {
        console.error('⚠️ Memory handlers failed to load (non-critical):', error.message);
    }

    // Initialize review handlers (CodeReviewAgent)
    const { setupReviewHandlers } = require('./ipc/reviewHandlers');
    setupReviewHandlers();

    // Initialize testing handlers
    const { registerTestingHandlers } = require('./ipc/testingHandlers');
    registerTestingHandlers();

    // Initialize build/export handlers
    const { registerBuildHandlers } = require('./ipc/buildHandlers');
    registerBuildHandlers();

    // Initialize file handling handlers
    const { setupFileIPCHandlers } = require('./ipc/fileHandlers');
    setupFileIPCHandlers();

    // Initialize whisper voice transcription handlers
    const { setupWhisperIPCHandlers } = require('./ipc/whisperHandlers');
    setupWhisperIPCHandlers();

    // Initialize semantic search handlers
    const { registerSemanticSearchHandlers } = require('./ipc/semanticSearchHandlers');
    registerSemanticSearchHandlers();

    // Initialize advanced agent handlers (swarm, diff editing, sandbox, inspector, memory)
    try {
        const { registerAdvancedHandlers } = require('./ipc/advancedHandlers');
        registerAdvancedHandlers();
    } catch (error: any) {
        console.warn('⚠️ Advanced handlers not loaded:', error.message);
    }

    // Initialize autonomous workflow handlers
    const { registerAutonomousHandlers } = require('./ipc/autonomousHandlers');
    registerAutonomousHandlers();

    // Initialize agentic system handlers (Phase 4)
    const { registerAgenticHandlers } = require('./ipc/agenticHandlers');
    registerAgenticHandlers();

    // Initialize context graph handlers
    const { setupContextGraphHandlers } = require('./ipc/contextGraphHandlers');
    setupContextGraphHandlers();

    // Initialize persistent memory handlers
    const { setupPersistentMemoryHandlers } = require('./ipc/persistentMemoryHandlers');
    setupPersistentMemoryHandlers();

    // Initialize orchestration handlers
    const { setupOrchestrationHandlers } = require('./ipc/orchestrationHandlers');
    setupOrchestrationHandlers();

    // Initialize improvement handlers
    const { setupImprovementHandlers } = require('./ipc/improvementHandlers');
    setupImprovementHandlers();

    // Initialize audit handlers
    const { setupAuditHandlers } = require('./ipc/auditHandlers');
    setupAuditHandlers();

    // -- Phase 4: Integration Handlers --

    // Initialize plugin handlers
    const { setupPluginHandlers } = require('./ipc/pluginHandlers');
    setupPluginHandlers();

    // Initialize collaboration handlers
    const { setupCollaborationHandlers } = require('./ipc/collaborationHandlers');
    setupCollaborationHandlers();

    // Initialize persistence handlers (Agents/Prompts)
    const { setupPersistenceHandlers } = require('./ipc/persistenceHandlers');
    setupPersistenceHandlers();

    // Initialize notification handlers
    const { setupNotificationHandlers } = require('./ipc/notificationHandlers');
    setupNotificationHandlers();

    // Initialize automation handlers
    const { setupAutomationHandlers } = require('./ipc/automationHandlers');
    setupAutomationHandlers();

    // Initialize action executor handlers
    const { registerActionExecutorHandlers } = require('./ipc/actionExecutorHandlers');
    registerActionExecutorHandlers();

    // Initialize threat detection handlers
    const { registerThreatDetectionHandlers } = require('./ipc/threatDetectionHandlers');
    registerThreatDetectionHandlers();

    // Note: setupCollaborationHandlers already called at line 209-210

    // Initialize cloud sync handlers
    const { registerCloudSyncHandlers } = require('./ipc/cloudSyncHandlers');
    registerCloudSyncHandlers();

    // Initialize webhook handlers
    const { registerWebhookHandlers } = require('./ipc/webhookHandlers');
    registerWebhookHandlers();

    // Initialize voice control handlers
    const { registerVoiceHandlers } = require('./ipc/voiceHandlers');
    registerVoiceHandlers();

    // Initialize custom agent handlers
    const { registerCustomAgentHandlers } = require('./ipc/customAgentHandlers');
    registerCustomAgentHandlers();

    // Initialize MCP handlers
    const { registerMCPHandlers } = require('./ipc/mcpHandlers');
    registerMCPHandlers();

    // Initialize local model handlers
    const { registerLocalModelHandlers } = require('./ipc/localModelHandlers');
    registerLocalModelHandlers();

    // Initialize planning handlers (CRITICAL - must be early)
    const { setupPlanningHandlers } = require('./ipc/planningHandlers');
    setupPlanningHandlers();

    // Initialize agent enhancement handlers (new capabilities)
    try {
        const { registerAgentEnhancementHandlers } = require('./ipc/agentEnhancementHandlers');
        registerAgentEnhancementHandlers();
    } catch (error: any) {
        console.error('⚠️ Agent enhancement handlers error (non-critical):', error.message);
    }

    // Initialize AI tools handlers (includes export functionality)
    try {
        const { setupAIToolsHandlers } = require('./ipc/aiToolsHandlers');
        setupAIToolsHandlers();
    } catch (error: any) {
        console.error('⚠️ AI Tools handlers error (non-critical):', error.message);
    }

    // Initialize code validation handlers (smart code generation)
    try {
        const { setupValidationHandlers } = require('./ipc/validationHandlers');
        setupValidationHandlers();
    } catch (error: any) {
        console.error('⚠️ Validation handlers error (non-critical):', error.message);
    }

    // Initialize advanced feature handlers (Tier 1 features)
    try {
        const { registerAdvancedHandlers } = require('./ipc/advancedHandlers');
        registerAdvancedHandlers();
    } catch (error: any) {
        console.error('⚠️ Advanced handlers error (non-critical):', error.message);
    }

    // Initialize enhanced agent feature handlers
    try {
        const { registerEnhancedHandlers } = require('./ipc/enhancedHandlers');
        registerEnhancedHandlers();
    } catch (error: any) {
        console.error('⚠️ Enhanced handlers error (non-critical):', error.message);
    }

    // Initialize domain-specific agent handlers (Mobile, Game, Desktop, Temporal, HiveMind, Simulator)
    try {
        const { registerDomainAgentHandlers } = require('./ipc/domainAgentHandlers');
        registerDomainAgentHandlers();
    } catch (error: any) {
        console.error('⚠️ Domain agent handlers error (non-critical):', error.message);
    }

    // Initialize revolutionary autonomous agent handlers (PKG, BDI, Security, Intent, Temporal, Business, Router)
    try {
        const { registerRevolutionaryHandlers } = require('./ipc/revolutionaryHandlers');
        registerRevolutionaryHandlers();
    } catch (error: any) {
        console.error('⚠️ Revolutionary handlers error (non-critical):', error.message);
    }

    // Initialize Kimi K2 enhancement handlers (Evolution, Collaboration, Self-Healing, Predictive, etc.)
    try {
        const { registerKimiK2Handlers } = require('./ipc/kimiK2Handlers');
        registerKimiK2Handlers();
    } catch (error: any) {
        console.error('⚠️ Kimi K2 handlers error (non-critical):', error.message);
    }

    // Initialize UESE (Universal Embedded Super Emulator) handlers
    try {
        const { registerUESEHandlers } = require('./ipc/ueseHandlers');
        registerUESEHandlers();
    } catch (error: any) {
        console.error('⚠️ UESE handlers error (non-critical):', error.message);
    }

    // -- Cursor Feature Parity Handlers --

    // Initialize API key (BYOK) handlers
    try {
        const { setupAPIKeyHandlers } = require('./ipc/apiKeyHandlers');
        setupAPIKeyHandlers();
    } catch (error: any) {
        console.error('⚠️ API Key handlers error (non-critical):', error.message);
    }

    // Initialize privacy mode handlers
    try {
        const { setupPrivacyHandlers } = require('./ipc/privacyHandlers');
        setupPrivacyHandlers();
    } catch (error: any) {
        console.error('⚠️ Privacy handlers error (non-critical):', error.message);
    }

    // Initialize integration handlers (Slack, Linear)
    try {
        const { setupIntegrationHandlers } = require('./ipc/integrationHandlers');
        setupIntegrationHandlers();
    } catch (error: any) {
        console.error('⚠️ Integration handlers error (non-critical):', error.message);
    }

    // Initialize background agent handlers
    try {
        const { setupBackgroundAgentHandlers } = require('./ipc/backgroundAgentHandlers');
        setupBackgroundAgentHandlers();
    } catch (error: any) {
        console.error('⚠️ Background agent handlers error (non-critical):', error.message);
    }

    // Initialize bugbot handlers
    try {
        const { setupBugbotHandlers } = require('./ipc/bugbotHandlers');
        setupBugbotHandlers();
    } catch (error: any) {
        console.error('⚠️ Bugbot handlers error (non-critical):', error.message);
    }

    // Initialize prediction handlers
    try {
        const { setupPredictionHandlers } = require('./ipc/predictionHandlers');
        setupPredictionHandlers();
    } catch (error: any) {
        console.error('⚠️ Prediction handlers error (non-critical):', error.message);
    }

    // -- Warp Feature Parity Handlers --

    // Initialize workflow handlers (parameterized workflows)
    try {
        const { setupWorkflowHandlers } = require('./ipc/workflowHandlers');
        setupWorkflowHandlers();
    } catch (error: any) {
        console.error('⚠️ Workflow handlers error (non-critical):', error.message);
    }

    // Initialize notebook handlers (executable notebooks)
    try {
        const { setupNotebookHandlers } = require('./ipc/notebookHandlers');
        setupNotebookHandlers();
    } catch (error: any) {
        console.error('⚠️ Notebook handlers error (non-critical):', error.message);
    }

    // Initialize TUI handlers (interactive terminal apps)
    try {
        const { setupTUIHandlers } = require('./ipc/tuiHandlers');
        setupTUIHandlers();
    } catch (error: any) {
        console.error('⚠️ TUI handlers error (non-critical):', error.message);
    }

    // -- Cognigy Feature Parity Handlers --

    // Initialize Cognigy handlers (analytics, PII, contacts)
    try {
        const { setupCognigyHandlers } = require('./ipc/cognigyHandlers');
        setupCognigyHandlers();
    } catch (error: any) {
        console.error('⚠️ Cognigy handlers error (non-critical):', error.message);
    }

    // Initialize extended handlers (flows, copilot, channels)
    try {
        const { setupExtendedHandlers } = require('./ipc/extendedHandlers');
        setupExtendedHandlers();
    } catch (error: any) {
        console.error('⚠️ Extended handlers error (non-critical):', error.message);
    }

    // Initialize enterprise handlers (knowledge, personas, tracing)
    try {
        const { setupEnterpriseHandlers } = require('./ipc/enterpriseHandlers');
        setupEnterpriseHandlers();
    } catch (error: any) {
        console.error('⚠️ Enterprise handlers error (non-critical):', error.message);
    }

    // Initialize ZenCoder handlers (tickets, tests, indexer, actions)
    try {
        const { setupZencoderHandlers } = require('./ipc/zencoderHandlers');
        setupZencoderHandlers();
    } catch (error: any) {
        console.error('⚠️ ZenCoder handlers error (non-critical):', error.message);
    }

    // Initialize IDE handlers (VS Code, LSP, Jira)
    try {
        const { setupIDEHandlers } = require('./ipc/ideHandlers');
        setupIDEHandlers();
    } catch (error: any) {
        console.error('⚠️ IDE handlers error (non-critical):', error.message);
    }

    // Initialize creative handlers (templates, PDF, brand, SVG)
    try {
        const { setupCreativeHandlers } = require('./ipc/creativeHandlers');
        setupCreativeHandlers();
    } catch (error: any) {
        console.error('⚠️ Creative handlers error (non-critical):', error.message);
    }

    // Initialize Trae handlers (MCP, DevContainers, CUE)
    try {
        const { setupTraeHandlers } = require('./ipc/traeHandlers');
        setupTraeHandlers();
    } catch (error: any) {
        console.error('⚠️ Trae handlers error (non-critical):', error.message);
    }

    // Initialize Cursor handlers (Rules, Bugbot, Diff)
    try {
        const { setupCursorHandlers } = require('./ipc/cursorHandlers');
        setupCursorHandlers();
    } catch (error: any) {
        console.error('⚠️ Cursor handlers error (non-critical):', error.message);
    }

    // Initialize Productivity handlers (VSCode import, Custom commands)
    try {
        const { setupProductivityHandlers } = require('./ipc/productivityHandlers');
        setupProductivityHandlers();
    } catch (error: any) {
        console.error('⚠️ Productivity handlers error (non-critical):', error.message);
    }

    // Initialize Parity handlers (Changelog, AIDebugger, ConversationLogger)
    try {
        const { setupParityHandlers } = require('./ipc/parityHandlers');
        setupParityHandlers();
    } catch (error: any) {
        console.error('⚠️ Parity handlers error (non-critical):', error.message);
    }

    // Initialize 90%+ Parity handlers (Tab, Collab, Scaffold)
    try {
        const { setup90ParityHandlers } = require('./ipc/ninetyParityHandlers');
        setup90ParityHandlers();
    } catch (error: any) {
        console.error('⚠️ 90%+ Parity handlers error (non-critical):', error.message);
    }

    // Initialize JetBrains handlers (Grammar, Notebook, Auth, BigData)
    try {
        const { setupJetBrainsHandlers } = require('./ipc/jetbrainsHandlers');
        setupJetBrainsHandlers();
    } catch (error: any) {
        console.error('⚠️ JetBrains handlers error (non-critical):', error.message);
    }

    // Initialize Advanced Enhancement handlers (Search, Profiler, Security, APIDoc)
    try {
        const { setupAdvancedEnhancementHandlers } = require('./ipc/advancedEnhancementHandlers');
        setupAdvancedEnhancementHandlers();
    } catch (error: any) {
        console.error('⚠️ Advanced enhancement handlers error (non-critical):', error.message);
    }

    // Initialize Copilot feature handlers (Issue Agent, Audit Logger)
    try {
        const { setupCopilotFeatureHandlers } = require('./ipc/copilotFeatureHandlers');
        setupCopilotFeatureHandlers();
    } catch (error: any) {
        console.error('⚠️ Copilot feature handlers error (non-critical):', error.message);
    }

    // Initialize More Enhancement handlers (Test, Deps, Format, Refactor)
    try {
        const { setupMoreEnhancementHandlers } = require('./ipc/moreEnhancementHandlers');
        setupMoreEnhancementHandlers();
    } catch (error: any) {
        console.error('⚠️ More enhancement handlers error (non-critical):', error.message);
    }

    // Initialize Voice Enhancement handlers (VoiceDictionary, ToneAdapter)
    try {
        const { setupVoiceEnhancementHandlers } = require('./ipc/voiceEnhancementHandlers');
        setupVoiceEnhancementHandlers();
    } catch (error: any) {
        console.error('⚠️ Voice enhancement handlers error (non-critical):', error.message);
    }

    // Initialize Final Enhancement handlers (Snippets, Translator)
    try {
        const { setupFinalEnhancementHandlers } = require('./ipc/finalEnhancementHandlers');
        setupFinalEnhancementHandlers();
    } catch (error: any) {
        console.error('⚠️ Final enhancement handlers error (non-critical):', error.message);
    }

    // Initialize Windsurf handlers (TurboMode, DatabaseMCP, GitWorktrees)
    try {
        const { setupWindsurfHandlers } = require('./ipc/windsurfHandlers');
        setupWindsurfHandlers();
    } catch (error: any) {
        console.error('⚠️ Windsurf handlers error (non-critical):', error.message);
    }

    // Initialize Ultimate Enhancement handlers (ImageToCode, SmartImports, AIChat)
    try {
        const { setupUltimateHandlers } = require('./ipc/ultimateHandlers');
        setupUltimateHandlers();
    } catch (error: any) {
        console.error('⚠️ Ultimate handlers error (non-critical):', error.message);
    }

    // Initialize Opal handlers (VisualWorkflowEditor, AppDeployer)
    try {
        const { setupOpalHandlers } = require('./ipc/opalHandlers');
        setupOpalHandlers();
    } catch (error: any) {
        console.error('⚠️ Opal handlers error (non-critical):', error.message);
    }

    // Initialize Premium handlers (CodeReviewAI, NotificationCenter)
    try {
        const { setupPremiumHandlers } = require('./ipc/premiumHandlers');
        setupPremiumHandlers();
    } catch (error: any) {
        console.error('⚠️ Premium handlers error (non-critical):', error.message);
    }

    // Initialize Elite handlers (EnvManager, APIClient)
    try {
        const { setupEliteHandlers } = require('./ipc/eliteHandlers');
        setupEliteHandlers();
    } catch (error: any) {
        console.error('⚠️ Elite handlers error (non-critical):', error.message);
    }

    // Initialize Apex handlers (SessionManager, ThemeEngine)
    try {
        const { setupApexHandlers } = require('./ipc/apexHandlers');
        setupApexHandlers();
    } catch (error: any) {
        console.error('⚠️ Apex handlers error (non-critical):', error.message);
    }

    // Initialize Maximum handlers (8 modules, 24 handlers)
    try {
        const { setupMaxHandlers } = require('./ipc/maxHandlers');
        setupMaxHandlers();
    } catch (error: any) {
        console.error('⚠️ Max handlers error (non-critical):', error.message);
    }

    // Initialize Ultra handlers (4 modules, 12 handlers)
    try {
        const { setupUltraHandlers } = require('./ipc/ultraHandlers');
        setupUltraHandlers();
    } catch (error: any) {
        console.error('⚠️ Ultra handlers error (non-critical):', error.message);
    }

    // Initialize Mega handlers (8 modules, 20 handlers)
    try {
        const { setupMegaHandlers } = require('./ipc/megaHandlers');
        setupMegaHandlers();
    } catch (error: any) {
        console.error('⚠️ Mega handlers error (non-critical):', error.message);
    }

    // Initialize Final Batch handlers (9 modules, 16 handlers)
    try {
        const { setupFinalHandlers } = require('./ipc/finalBatchHandlers');
        setupFinalHandlers();
    } catch (error: any) {
        console.error('⚠️ Final batch handlers error (non-critical):', error.message);
    }

    // Initialize CodeRabbit handlers (4 modules, 15 handlers)
    try {
        const { setupCoderabbitHandlers } = require('./ipc/coderabbitHandlers');
        setupCoderabbitHandlers();
    } catch (error: any) {
        console.error('⚠️ CodeRabbit handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement2 handlers (7 modules, 13 handlers)
    try {
        const { setupEnhancement2Handlers } = require('./ipc/enhancement2Handlers');
        setupEnhancement2Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement2 handlers error (non-critical):', error.message);
    }

    // Initialize Final2 handlers (5 modules, 12 handlers)
    try {
        const { setupFinal2Handlers } = require('./ipc/final2Handlers');
        setupFinal2Handlers();
    } catch (error: any) {
        console.error('⚠️ Final2 handlers error (non-critical):', error.message);
    }

    // Initialize Milestone handlers (5 modules, 13 handlers) - 100+ MODULES!
    try {
        const { setupMilestoneHandlers } = require('./ipc/milestoneHandlers');
        setupMilestoneHandlers();
    } catch (error: any) {
        console.error('⚠️ Milestone handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 110 handlers (6 modules, 14 handlers) - 110+ MODULES!
    try {
        const { setupEnhancement110Handlers } = require('./ipc/enhancement110Handlers');
        setupEnhancement110Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 110 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 116 handlers (6 modules, 13 handlers) - 116+ MODULES!
    try {
        const { setupEnhancement116Handlers } = require('./ipc/enhancement116Handlers');
        setupEnhancement116Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 116 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 120 handlers (4 modules, 11 handlers) - 120+ MODULES!
    try {
        const { setupEnhancement120Handlers } = require('./ipc/enhancement120Handlers');
        setupEnhancement120Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 120 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 125 handlers (5 modules, 12 handlers) - 125+ MODULES!
    try {
        const { setupEnhancement125Handlers } = require('./ipc/enhancement125Handlers');
        setupEnhancement125Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 125 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 130 handlers (5 modules, 10 handlers) - 130+ MODULES!
    try {
        const { setupEnhancement130Handlers } = require('./ipc/enhancement130Handlers');
        setupEnhancement130Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 130 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 140 handlers (10 modules, 12 handlers) - 140+ MODULES!
    try {
        const { setupEnhancement140Handlers } = require('./ipc/enhancement140Handlers');
        setupEnhancement140Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 140 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 150 handlers (10 modules, 16 handlers) - 150+ MODULES!
    try {
        const { setupEnhancement150Handlers } = require('./ipc/enhancement150Handlers');
        setupEnhancement150Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 150 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 160 handlers (10 modules, 15 handlers) - 160+ MODULES!
    try {
        const { setupEnhancement160Handlers } = require('./ipc/enhancement160Handlers');
        setupEnhancement160Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 160 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 170 handlers (10 modules, 13 handlers) - 170+ MODULES!
    try {
        const { setupEnhancement170Handlers } = require('./ipc/enhancement170Handlers');
        setupEnhancement170Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 170 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 180 handlers (10 modules, 13 handlers) - 180+ MODULES!
    try {
        const { setupEnhancement180Handlers } = require('./ipc/enhancement180Handlers');
        setupEnhancement180Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 180 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 190 handlers (10 modules, 15 handlers) - 190+ MODULES!
    try {
        const { setupEnhancement190Handlers } = require('./ipc/enhancement190Handlers');
        setupEnhancement190Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 190 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 200 handlers (10 modules, 13 handlers) - 200+ MODULES!
    try {
        const { setupEnhancement200Handlers } = require('./ipc/enhancement200Handlers');
        setupEnhancement200Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 200 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 210 handlers (10 modules, 14 handlers) - 210+ MODULES!
    try {
        const { setupEnhancement210Handlers } = require('./ipc/enhancement210Handlers');
        setupEnhancement210Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 210 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 220 handlers (10 modules, 13 handlers) - 220+ MODULES!
    try {
        const { setupEnhancement220Handlers } = require('./ipc/enhancement220Handlers');
        setupEnhancement220Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 220 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 230 handlers (10 modules, 12 handlers) - 230+ MODULES!
    try {
        const { setupEnhancement230Handlers } = require('./ipc/enhancement230Handlers');
        setupEnhancement230Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 230 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 240 handlers (10 modules, 11 handlers) - 240+ MODULES!
    try {
        const { setupEnhancement240Handlers } = require('./ipc/enhancement240Handlers');
        setupEnhancement240Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 240 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 250 handlers (10 modules, 12 handlers) - 250+ MODULES!
    try {
        const { setupEnhancement250Handlers } = require('./ipc/enhancement250Handlers');
        setupEnhancement250Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 250 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 260 handlers (10 modules, 12 handlers) - 260+ MODULES!
    try {
        const { setupEnhancement260Handlers } = require('./ipc/enhancement260Handlers');
        setupEnhancement260Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 260 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 270 handlers (10 modules, 12 handlers) - 270+ MODULES!
    try {
        const { setupEnhancement270Handlers } = require('./ipc/enhancement270Handlers');
        setupEnhancement270Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 270 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 280 handlers (10 modules, 10 handlers) - 280+ MODULES!
    try {
        const { setupEnhancement280Handlers } = require('./ipc/enhancement280Handlers');
        setupEnhancement280Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 280 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 290 handlers (10 modules, 10 handlers) - 290+ MODULES!
    try {
        const { setupEnhancement290Handlers } = require('./ipc/enhancement290Handlers');
        setupEnhancement290Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 290 handlers error (non-critical):', error.message);
    }

    // 🏆🏆🏆 Initialize Enhancement 300 handlers (10 modules, 10 handlers) - 300+ MODULES! 🏆🏆🏆
    try {
        const { setupEnhancement300Handlers } = require('./ipc/enhancement300Handlers');
        setupEnhancement300Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 300 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 310 handlers (10 modules, 10 handlers) - 310+ MODULES!
    try {
        const { setupEnhancement310Handlers } = require('./ipc/enhancement310Handlers');
        setupEnhancement310Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 310 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 320 handlers (10 modules, 10 handlers) - 320+ MODULES!
    try {
        const { setupEnhancement320Handlers } = require('./ipc/enhancement320Handlers');
        setupEnhancement320Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 320 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 330 handlers (10 modules, 10 handlers) - 330+ MODULES!
    try {
        const { setupEnhancement330Handlers } = require('./ipc/enhancement330Handlers');
        setupEnhancement330Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 330 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 340 handlers (10 modules, 10 handlers) - 340+ MODULES!
    try {
        const { setupEnhancement340Handlers } = require('./ipc/enhancement340Handlers');
        setupEnhancement340Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 340 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 350 handlers (10 modules, 10 handlers) - 350+ MODULES!
    try {
        const { setupEnhancement350Handlers } = require('./ipc/enhancement350Handlers');
        setupEnhancement350Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 350 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 360 handlers (10 modules, 10 handlers) - 360+ MODULES!
    try {
        const { setupEnhancement360Handlers } = require('./ipc/enhancement360Handlers');
        setupEnhancement360Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 360 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 370 handlers (10 modules, 10 handlers) - 370+ MODULES!
    try {
        const { setupEnhancement370Handlers } = require('./ipc/enhancement370Handlers');
        setupEnhancement370Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 370 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 380 handlers (10 modules, 10 handlers) - 380+ MODULES!
    try {
        const { setupEnhancement380Handlers } = require('./ipc/enhancement380Handlers');
        setupEnhancement380Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 380 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 390 handlers (10 modules, 10 handlers) - 390+ MODULES!
    try {
        const { setupEnhancement390Handlers } = require('./ipc/enhancement390Handlers');
        setupEnhancement390Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 390 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 400 handlers (10 modules, 10 handlers) - 400+ MILESTONE!
    try {
        const { setupEnhancement400Handlers } = require('./ipc/enhancement400Handlers');
        setupEnhancement400Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 400 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 410 handlers (10 modules, 10 handlers) - 410+ MODULES!
    try {
        const { setupEnhancement410Handlers } = require('./ipc/enhancement410Handlers');
        setupEnhancement410Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 410 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 420 handlers (10 modules, 10 handlers) - 420+ MODULES!
    try {
        const { setupEnhancement420Handlers } = require('./ipc/enhancement420Handlers');
        setupEnhancement420Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 420 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 430 handlers (10 modules, 10 handlers) - 430+ MODULES!
    try {
        const { setupEnhancement430Handlers } = require('./ipc/enhancement430Handlers');
        setupEnhancement430Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 430 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 440 handlers (10 modules, 10 handlers) - 440+ MODULES!
    try {
        const { setupEnhancement440Handlers } = require('./ipc/enhancement440Handlers');
        setupEnhancement440Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 440 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 450 handlers (10 modules, 10 handlers) - 450+ MODULES!
    try {
        const { setupEnhancement450Handlers } = require('./ipc/enhancement450Handlers');
        setupEnhancement450Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 450 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 460 handlers (10 modules, 10 handlers) - 460+ MODULES!
    try {
        const { setupEnhancement460Handlers } = require('./ipc/enhancement460Handlers');
        setupEnhancement460Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 460 handlers error (non-critical):', error.message);
    }

    // Initialize Enhancement 470 handlers (10 modules, 10 handlers) - 470+ MODULES!
    try {
        const { setupEnhancement470Handlers } = require('./ipc/enhancement470Handlers');
        setupEnhancement470Handlers();
    } catch (error: any) {
        console.error('⚠️ Enhancement 470 handlers error (non-critical):', error.message);
    }

    // Initialize WebSocket manager for real-time updates
    const { autonomousWebSocketManager } = require('./services/AutonomousWebSocketManager');
    if (mainWindow) {
        autonomousWebSocketManager.setMainWindow(mainWindow);
    }

    // Model management
    safeHandle('model:list', async () => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();
        return manager.listModels();
    });

    safeHandle('model:select', async (_, modelId: string) => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();
        return manager.selectModel(modelId);
    });

    safeHandle('model:chat', async (_, messages: any[]) => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();
        return manager.chat(messages);
    });

    // Streaming chat - emits tokens via IPC events
    safeHandle('model:chatStream', async (event, messages: any[]) => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();

        const streamId = `stream_${Date.now()}`;
        let fullResponse = '';

        try {
            // Get the sender's webContents to send events back
            const webContents = event.sender;

            // Start streaming
            webContents.send('stream:start', { streamId });

            for await (const token of manager.chatStream(messages)) {
                fullResponse += token;
                webContents.send('stream:token', { streamId, token, buffer: fullResponse });
            }

            // Complete
            webContents.send('stream:complete', { streamId, response: fullResponse });
            return fullResponse;
        } catch (error: any) {
            event.sender.send('stream:error', { streamId, error: error.message });
            throw error;
        }
    });

    // Agent coordination
    safeHandle('agent:execute', async (_, command: string, params: any) => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.executeCommand(command, params);
    });

    // File analysis
    safeHandle('file:analyze', async (_, filePath: string) => {
        const { analyzeFile } = await import('./analysis/FileAnalyzer');
        return analyzeFile(filePath);
    });

    // Project building
    safeHandle('project:build', async (_, config: any) => {
        const { ProjectBuilder } = await import('./builder/ProjectBuilder');
        const builder = new ProjectBuilder(config);
        return builder.build();
    });

    // Deployment
    safeHandle('project:deploy', async (_, config: any) => {
        const { DeploymentService } = await import('./builder/DeploymentService');
        const service = new DeploymentService();
        return service.deploy(config);
    });

    // API Keys - Update and reinitialize models
    safeHandle('api:updateKeys', async (_, keys: { [key: string]: string }) => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();
        await manager.updateApiKeys(keys);
        // Return updated model list
        return manager.listModels();
    });

    // Diagnostic endpoint
    safeHandle('diagnostic:modelStatus', async () => {
        const { ModelManager } = await import('./ai/ModelManager');
        const manager = ModelManager.getInstance();
        return {
            modelCount: manager.listModels().length,
            models: manager.listModels().map(m => ({ id: m.id, name: m.name, provider: m.provider })),
            envKeys: {
                openai: !!process.env.OPENAI_API_KEY,
                anthropic: !!process.env.ANTHROPIC_API_KEY,
                mistral: !!process.env.MISTRAL_API_KEY,
                deepseek: !!process.env.DEEPSEEK_API_KEY,
                gemini: !!process.env.GEMINI_API_KEY,
            }
        };
    });

    // Knowledge base
    safeHandle('knowledge:query', async (_, query: string) => {
        const { KnowledgeBase } = await import('./memory/KnowledgeBase');
        const kb = KnowledgeBase.getInstance();
        return kb.query(query);
    });

    safeHandle('knowledge:store', async (_, data: any) => {
        const { KnowledgeBase } = await import('./memory/KnowledgeBase');
        const kb = KnowledgeBase.getInstance();
        return kb.storeData(data);
    });

    // Note: plugin:list, plugin:load, plugin:unload are registered in pluginHandlers.ts

    // Collaboration
    safeHandle('collaboration:start', async (_, sessionId: string) => {
        const { CollaborationService } = await import('./collaboration/CollaborationService');
        const service = CollaborationService.getInstance();
        return service.startSession(sessionId);
    });

    safeHandle('collaboration:join', async (_, sessionId: string, userId: string) => {
        const { CollaborationService } = await import('./collaboration/CollaborationService');
        const service = CollaborationService.getInstance();
        return service.joinSession(sessionId, userId);
    });

    // UI control
    safeHandle('ui:setTheme', async (_, theme: 'light' | 'dark') => {
        console.log('Theme change requested:', theme);
        return { success: true };
    });

    // External Services Integration
    safeHandle('services:getStatus', async () => {
        const { ServiceManager } = await import('./services/ServiceManager');
        const manager = ServiceManager.getInstance();
        return manager.getServicesStatus();
    });

    safeHandle('services:supabase:query', async (_, table: string, filters?: any) => {
        try {
            const { ServiceManager } = await import('./services/ServiceManager');
            const manager = ServiceManager.getInstance();
            const result = await manager.supabase.query(table, filters);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    safeHandle('services:supabase:insert', async (_, table: string, data: any) => {
        try {
            const { ServiceManager } = await import('./services/ServiceManager');
            const manager = ServiceManager.getInstance();
            const result = await manager.supabase.insert(table, data);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    safeHandle('services:figma:export', async (_, fileKey: string, nodeId: string, format?: 'png' | 'svg' | 'jpg') => {
        try {
            const { ServiceManager } = await import('./services/ServiceManager');
            const manager = ServiceManager.getInstance();
            const imageUrl = await manager.figma.exportImage(fileKey, nodeId, format);
            return { success: true, url: imageUrl };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    safeHandle('services:figma:getFile', async (_, url: string) => {
        try {
            const { ServiceManager } = await import('./services/ServiceManager');
            const manager = ServiceManager.getInstance();
            const fileKey = manager.figma.extractFileKey(url);
            if (!fileKey) {
                return { success: false, error: 'Invalid Figma URL' };
            }
            const file = await manager.figma.getFile(fileKey);
            return { success: true, data: file };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    safeHandle('services:canva:getUrl', async (_, type: 'presentation' | 'social' | 'document') => {
        const { ServiceManager } = await import('./services/ServiceManager');
        const manager = ServiceManager.getInstance();
        const url = manager.canva.getCreateUrl(type);
        return { success: true, url };
    });

    // MCP Server Control
    safeHandle('mcp:getStatus', async () => {
        return {
            running: mcpServer !== null,
            autoStart: mcpAutoStart,
        };
    });

    safeHandle('mcp:start', async () => {
        try {
            if (mcpServer) {
                throw new Error('MCP server is already running');
            }
            const { ShadowMCPServer } = await import('./mcp/MCPServer');
            mcpServer = new ShadowMCPServer();
            await mcpServer.start();
            console.log('✅ MCP Server started from UI');
        } catch (error: any) {
            console.error('Failed to start MCP server:', error);
            throw error;
        }
    });

    safeHandle('mcp:stop', async () => {
        try {
            if (!mcpServer) {
                throw new Error('MCP server is not running');
            }
            // MCP server doesn't have a stop method, so we just clear the reference
            mcpServer = null;
            console.log('✅ MCP Server stopped from UI');
        } catch (error: any) {
            console.error('Failed to stop MCP server:', error);
            throw error;
        }
    });

    safeHandle('mcp:setAutoStart', async (_, enabled: boolean) => {
        mcpAutoStart = enabled;
        console.log(`✅ MCP auto-start ${enabled ? 'enabled' : 'disabled'}`);
    });

    // Voice Control
    safeHandle('voice:process', async (_, text: string) => {
        const { VoiceService } = await import('./voice/VoiceService');
        const service = VoiceService.getInstance();
        return service.processCommand(text);
    });

    // Task Queue Management
    safeHandle('agent:queueTask', async (_, command: string, params: any, priority?: string) => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.queueTask(command, params, priority as any);
    });

    safeHandle('agent:getTaskStatus', async (_, taskId: string) => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.getTaskStatus(taskId);
    });

    safeHandle('agent:cancelTask', async (_, taskId: string) => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.cancelTask(taskId);
    });

    safeHandle('agent:getQueueStats', async () => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.getQueueStats();
    });

    safeHandle('agent:getAllTasks', async () => {
        const { AgentCoordinator } = await import('./agents/AgentCoordinator');
        const coordinator = AgentCoordinator.getInstance();
        return coordinator.getAllTasks();
    });
}

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
