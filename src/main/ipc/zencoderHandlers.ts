/**
 * ZenCoder Feature IPC Handlers
 * IPC bridge for Ticket Monitor, Test Agents, Repo Indexer, and GitHub Actions
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let ticketMonitor: any = null;
let unitTestAgent: any = null;
let e2eTestAgent: any = null;
let repoIndexer: any = null;
let gitHubActions: any = null;

async function getTicketMonitor() {
    if (!ticketMonitor) {
        try {
            const { getTicketMonitor: getTM } = await import('../automation/TicketMonitor');
            ticketMonitor = getTM();
        } catch (error) {
            console.warn('⚠️ TicketMonitor not available:', (error as Error).message);
            return null;
        }
    }
    return ticketMonitor;
}

async function getUnitTestAgent() {
    if (!unitTestAgent) {
        try {
            const { getUnitTestAgent: getUTA } = await import('../testing/UnitTestAgent');
            unitTestAgent = getUTA();
        } catch (error) {
            console.warn('⚠️ UnitTestAgent not available:', (error as Error).message);
            return null;
        }
    }
    return unitTestAgent;
}

async function getE2ETestAgent() {
    if (!e2eTestAgent) {
        try {
            const { getE2ETestAgent: getE2E } = await import('../testing/E2ETestAgent');
            e2eTestAgent = getE2E();
        } catch (error) {
            console.warn('⚠️ E2ETestAgent not available:', (error as Error).message);
            return null;
        }
    }
    return e2eTestAgent;
}

async function getRepoIndexer() {
    if (!repoIndexer) {
        try {
            const { getRepoIndexer: getRI } = await import('../indexing/RepoIndexer');
            repoIndexer = getRI();
        } catch (error) {
            console.warn('⚠️ RepoIndexer not available:', (error as Error).message);
            return null;
        }
    }
    return repoIndexer;
}

async function getGitHubActions() {
    if (!gitHubActions) {
        try {
            const { getGitHubActionsManager } = await import('../automation/GitHubActionsManager');
            gitHubActions = getGitHubActionsManager();
        } catch (error) {
            console.warn('⚠️ GitHubActions not available:', (error as Error).message);
            return null;
        }
    }
    return gitHubActions;
}

/**
 * Setup ZenCoder feature IPC handlers
 */
export function setupZencoderHandlers(): void {
    // === TICKET MONITOR HANDLERS ===

    ipcMain.handle('tickets:configure', async (_, { name, config }: any) => {
        try {
            const tm = await getTicketMonitor();
            if (!tm) return { success: false, error: 'Ticket monitor not available' };

            tm.configure(name, config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tickets:start', async () => {
        try {
            const tm = await getTicketMonitor();
            if (!tm) return { success: false, error: 'Ticket monitor not available' };

            tm.start();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tickets:stop', async () => {
        try {
            const tm = await getTicketMonitor();
            if (!tm) return { success: false, error: 'Ticket monitor not available' };

            tm.stop();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tickets:status', async () => {
        try {
            const tm = await getTicketMonitor();
            if (!tm) return { success: false, error: 'Ticket monitor not available' };

            const status = tm.getStatus();
            return { success: true, status };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === UNIT TEST AGENT HANDLERS ===

    ipcMain.handle('unitTest:generate', async (_, { filePath, options }: any) => {
        try {
            const uta = await getUnitTestAgent();
            if (!uta) return { success: false, error: 'Unit test agent not available' };

            const testFile = await uta.generateTests(filePath, options);
            return { success: true, testFile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('unitTest:analyze', async (_, { filePath }: { filePath: string }) => {
        try {
            const uta = await getUnitTestAgent();
            if (!uta) return { success: false, error: 'Unit test agent not available' };

            const analysis = await uta.analyzeSourceFile(filePath);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('unitTest:save', async (_, { testFile }: any) => {
        try {
            const uta = await getUnitTestAgent();
            if (!uta) return { success: false, error: 'Unit test agent not available' };

            await uta.saveTestFile(testFile);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === E2E TEST AGENT HANDLERS ===

    ipcMain.handle('e2eTest:generate', async (_, { description, options }: any) => {
        try {
            const e2e = await getE2ETestAgent();
            if (!e2e) return { success: false, error: 'E2E test agent not available' };

            const scenario = await e2e.generateFromDescription(description, options);
            return { success: true, scenario };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('e2eTest:generateLogin', async (_, options: any) => {
        try {
            const e2e = await getE2ETestAgent();
            if (!e2e) return { success: false, error: 'E2E test agent not available' };

            const scenario = await e2e.generateLoginTest(options);
            return { success: true, scenario };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('e2eTest:getCode', async (_, { scenarioId, framework, options }: any) => {
        try {
            const e2e = await getE2ETestAgent();
            if (!e2e) return { success: false, error: 'E2E test agent not available' };

            const scenario = e2e.getScenario(scenarioId);
            if (!scenario) return { success: false, error: 'Scenario not found' };

            const code = framework === 'cypress'
                ? e2e.generateCypressCode(scenario, options)
                : e2e.generatePlaywrightCode(scenario, options);

            return { success: true, code };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === REPO INDEXER HANDLERS ===

    ipcMain.handle('indexer:index', async (_, { repoPath, options }: any) => {
        try {
            const ri = await getRepoIndexer();
            if (!ri) return { success: false, error: 'Repo indexer not available' };

            const index = await ri.indexRepository(repoPath, options);
            return { success: true, index };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('indexer:findSymbol', async (_, { name, options }: any) => {
        try {
            const ri = await getRepoIndexer();
            if (!ri) return { success: false, error: 'Repo indexer not available' };

            const symbols = ri.findSymbol(name, options);
            return { success: true, symbols };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('indexer:search', async (_, { query, options }: any) => {
        try {
            const ri = await getRepoIndexer();
            if (!ri) return { success: false, error: 'Repo indexer not available' };

            const results = ri.search(query, options);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('indexer:crossRepoRefs', async (_, { symbol }: { symbol: string }) => {
        try {
            const ri = await getRepoIndexer();
            if (!ri) return { success: false, error: 'Repo indexer not available' };

            const references = ri.findCrossRepoReferences(symbol);
            return { success: true, references };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('indexer:stats', async () => {
        try {
            const ri = await getRepoIndexer();
            if (!ri) return { success: false, error: 'Repo indexer not available' };

            const stats = ri.getGlobalStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === GITHUB ACTIONS HANDLERS ===

    ipcMain.handle('actions:configure', async (_, config: any) => {
        try {
            const ga = await getGitHubActions();
            if (!ga) return { success: false, error: 'GitHub Actions not available' };

            ga.configure(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('actions:trigger', async (_, { workflowId, ref, inputs }: any) => {
        try {
            const ga = await getGitHubActions();
            if (!ga) return { success: false, error: 'GitHub Actions not available' };

            const result = await ga.triggerWorkflow(workflowId, ref, inputs);
            return { success: true, triggered: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('actions:getRuns', async (_, { workflowId, status, limit }: any = {}) => {
        try {
            const ga = await getGitHubActions();
            if (!ga) return { success: false, error: 'GitHub Actions not available' };

            const runs = await ga.getWorkflowRuns(workflowId, status, limit);
            return { success: true, runs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('actions:listWorkflows', async () => {
        try {
            const ga = await getGitHubActions();
            if (!ga) return { success: false, error: 'GitHub Actions not available' };

            const workflows = await ga.listWorkflows();
            return { success: true, workflows };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('actions:generateWorkflow', async (_, { type, options }: any) => {
        try {
            const ga = await getGitHubActions();
            if (!ga) return { success: false, error: 'GitHub Actions not available' };

            const content = ga.generateWorkflow(type, options);
            return { success: true, content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ ZenCoder feature IPC handlers registered');
}
