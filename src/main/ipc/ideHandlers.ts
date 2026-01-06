/**
 * IDE Integration IPC Handlers
 * IPC bridge for VS Code Client, LSP Server, and Jira
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let vsCodeClient: any = null;
let lspServer: any = null;
let jiraIntegration: any = null;

async function getVSCodeClient() {
    if (!vsCodeClient) {
        try {
            const { getVSCodeClient: getVSC } = await import('../ide/VSCodeClient');
            vsCodeClient = getVSC();
        } catch (error) {
            console.warn('⚠️ VSCodeClient not available:', (error as Error).message);
            return null;
        }
    }
    return vsCodeClient;
}

async function getLSPServer() {
    if (!lspServer) {
        try {
            const { getLSPServer: getLSP } = await import('../lsp/LSPServer');
            lspServer = getLSP();
        } catch (error) {
            console.warn('⚠️ LSPServer not available:', (error as Error).message);
            return null;
        }
    }
    return lspServer;
}

async function getJiraIntegration() {
    if (!jiraIntegration) {
        try {
            const { getJiraIntegration: getJira } = await import('../integrations/JiraIntegration');
            jiraIntegration = getJira();
        } catch (error) {
            console.warn('⚠️ JiraIntegration not available:', (error as Error).message);
            return null;
        }
    }
    return jiraIntegration;
}

/**
 * Setup IDE integration IPC handlers
 */
export function setupIDEHandlers(): void {
    // === VS CODE CLIENT HANDLERS ===

    ipcMain.handle('vscode:start', async (_, { port }: { port?: number } = {}) => {
        try {
            const vsc = await getVSCodeClient();
            if (!vsc) return { success: false, error: 'VS Code client not available' };

            vsc.start(port);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:stop', async () => {
        try {
            const vsc = await getVSCodeClient();
            if (!vsc) return { success: false, error: 'VS Code client not available' };

            vsc.stop();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:clients', async () => {
        try {
            const vsc = await getVSCodeClient();
            if (!vsc) return { success: false, error: 'VS Code client not available' };

            const clients = vsc.getConnectedClients();
            return { success: true, clients };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:sendCompletion', async (_, { clientId, completions }: any) => {
        try {
            const vsc = await getVSCodeClient();
            if (!vsc) return { success: false, error: 'VS Code client not available' };

            vsc.sendCompletions(clientId, completions);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('vscode:broadcast', async (_, { method, params }: any) => {
        try {
            const vsc = await getVSCodeClient();
            if (!vsc) return { success: false, error: 'VS Code client not available' };

            vsc.broadcast(method, params);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === LSP SERVER HANDLERS ===

    ipcMain.handle('lsp:start', async (_, { port }: { port?: number } = {}) => {
        try {
            const lsp = await getLSPServer();
            if (!lsp) return { success: false, error: 'LSP server not available' };

            lsp.start(port);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('lsp:stop', async () => {
        try {
            const lsp = await getLSPServer();
            if (!lsp) return { success: false, error: 'LSP server not available' };

            lsp.stop();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('lsp:publishDiagnostics', async (_, { uri, diagnostics }: any) => {
        try {
            const lsp = await getLSPServer();
            if (!lsp) return { success: false, error: 'LSP server not available' };

            lsp.publishDiagnostics(uri, diagnostics);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === JIRA INTEGRATION HANDLERS ===

    ipcMain.handle('jira:configure', async (_, config: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            jira.configure(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:testConnection', async () => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const connected = await jira.testConnection();
            return { success: true, connected };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:getIssue', async (_, { issueKey }: { issueKey: string }) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const issue = await jira.getIssue(issueKey);
            return { success: true, issue };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:searchIssues', async (_, { jql, maxResults }: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const issues = await jira.searchIssues(jql, maxResults);
            return { success: true, issues };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:createIssue', async (_, options: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const issue = await jira.createIssue(options);
            return { success: true, issue };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:updateIssue', async (_, { issueKey, updates }: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const result = await jira.updateIssue(issueKey, updates);
            return { success: true, updated: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:addComment', async (_, { issueKey, comment }: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const result = await jira.addComment(issueKey, comment);
            return { success: true, added: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('jira:transitionIssue', async (_, { issueKey, transitionId }: any) => {
        try {
            const jira = await getJiraIntegration();
            if (!jira) return { success: false, error: 'Jira integration not available' };

            const result = await jira.transitionIssue(issueKey, transitionId);
            return { success: true, transitioned: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ IDE integration IPC handlers registered');
}
