/**
 * JetBrains Feature IPC Handlers
 * IPC bridge for Grammar, Notebook, Auth, and BigData
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let grammarChecker: any = null;
let notebookEngine: any = null;
let authHub: any = null;
let bigDataTools: any = null;

async function getGrammarChecker() {
    if (!grammarChecker) {
        try {
            const { getGrammarChecker: getGC } = await import('../grammar/GrammarChecker');
            grammarChecker = getGC();
        } catch (error) {
            console.warn('⚠️ GrammarChecker not available:', (error as Error).message);
            return null;
        }
    }
    return grammarChecker;
}

async function getNotebookEngine() {
    if (!notebookEngine) {
        try {
            const { getJupyterNotebookEngine: getNE } = await import('../notebooks/JupyterNotebookEngine');
            notebookEngine = getNE();
        } catch (error) {
            console.warn('⚠️ NotebookEngine not available:', (error as Error).message);
            return null;
        }
    }
    return notebookEngine;
}

async function getAuthHub() {
    if (!authHub) {
        try {
            const { getAuthHub: getAH } = await import('../auth/AuthHub');
            authHub = getAH();
        } catch (error) {
            console.warn('⚠️ AuthHub not available:', (error as Error).message);
            return null;
        }
    }
    return authHub;
}

async function getBigDataTools() {
    if (!bigDataTools) {
        try {
            const { getBigDataTools: getBDT } = await import('../bigdata/BigDataTools');
            bigDataTools = getBDT();
        } catch (error) {
            console.warn('⚠️ BigDataTools not available:', (error as Error).message);
            return null;
        }
    }
    return bigDataTools;
}

/**
 * Setup JetBrains feature handlers
 */
export function setupJetBrainsHandlers(): void {
    // === GRAMMAR CHECKER ===

    ipcMain.handle('grammar:check', async (_, { text, language }: any) => {
        try {
            const gc = await getGrammarChecker();
            if (!gc) return { success: false, error: 'Grammar checker not available' };

            const result = await gc.check(text, language);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('grammar:fix', async (_, { text, issue }: any) => {
        try {
            const gc = await getGrammarChecker();
            if (!gc) return { success: false, error: 'Grammar checker not available' };

            const fixed = gc.applyFix(text, issue);
            return { success: true, text: fixed };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('grammar:fixAll', async (_, { text, issues }: any) => {
        try {
            const gc = await getGrammarChecker();
            if (!gc) return { success: false, error: 'Grammar checker not available' };

            const fixed = gc.applyAllFixes(text, issues);
            return { success: true, text: fixed };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('grammar:addWord', async (_, { word, language }: any) => {
        try {
            const gc = await getGrammarChecker();
            if (!gc) return { success: false, error: 'Grammar checker not available' };

            gc.addToDictionary(word, language);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === NOTEBOOK ENGINE ===

    ipcMain.handle('notebook:create', async (_, { name, language }: any) => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            const notebook = ne.createNotebook(name, language);
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notebook:open', async (_, { filePath }: { filePath: string }) => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            const notebook = await ne.openNotebook(filePath);
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notebook:save', async (_, { notebookId }: any = {}) => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            await ne.saveNotebook(notebookId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notebook:addCell', async (_, { type }: any = {}) => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            const cell = ne.addCell(type);
            return { success: true, cell };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notebook:updateCell', async (_, { cellId, source }: any) => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            ne.updateCellSource(cellId, source);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('notebook:getActive', async () => {
        try {
            const ne = await getNotebookEngine();
            if (!ne) return { success: false, error: 'Notebook engine not available' };

            const notebook = ne.getActiveNotebook();
            return { success: true, notebook };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AUTH HUB ===

    ipcMain.handle('auth:createUser', async (_, { email, name, role }: any) => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const user = ah.createUser(email, name, role);
            return { success: true, user };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:getUsers', async () => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const users = ah.getAllUsers();
            return { success: true, users };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:createTeam', async (_, { name, adminId }: any) => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const team = ah.createTeam(name, adminId);
            return { success: true, team };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:getTeams', async () => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const teams = ah.getAllTeams();
            return { success: true, teams };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:getLicenses', async () => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const licenses = ah.getAllLicenses();
            return { success: true, licenses };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('auth:createSession', async (_, { userId }: { userId: string }) => {
        try {
            const ah = await getAuthHub();
            if (!ah) return { success: false, error: 'Auth hub not available' };

            const sessionId = ah.createSession(userId);
            return { success: true, sessionId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === BIG DATA TOOLS ===

    ipcMain.handle('bigdata:submitJob', async (_, options: any) => {
        try {
            const bdt = await getBigDataTools();
            if (!bdt) return { success: false, error: 'Big data tools not available' };

            const job = await bdt.submitSparkJob(options);
            return { success: true, job };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bigdata:getJobs', async () => {
        try {
            const bdt = await getBigDataTools();
            if (!bdt) return { success: false, error: 'Big data tools not available' };

            const jobs = bdt.getAllJobs();
            return { success: true, jobs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bigdata:listHDFS', async (_, { path }: { path: string }) => {
        try {
            const bdt = await getBigDataTools();
            if (!bdt) return { success: false, error: 'Big data tools not available' };

            const files = await bdt.listHDFS(path);
            return { success: true, files };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bigdata:getClusters', async () => {
        try {
            const bdt = await getBigDataTools();
            if (!bdt) return { success: false, error: 'Big data tools not available' };

            const clusters = bdt.getAllClusters();
            return { success: true, clusters };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bigdata:registerCluster', async (_, options: any) => {
        try {
            const bdt = await getBigDataTools();
            if (!bdt) return { success: false, error: 'Big data tools not available' };

            const cluster = bdt.registerCluster(options);
            return { success: true, cluster };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ JetBrains feature IPC handlers registered');
}
