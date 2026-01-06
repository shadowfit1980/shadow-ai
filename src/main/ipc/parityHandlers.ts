/**
 * Parity Enhancement IPC Handlers
 * IPC bridge for Changelog, AIDebugger, and AgentConversationLogger
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let changelogManager: any = null;
let aiDebugger: any = null;
let conversationLogger: any = null;

async function getChangelogManager() {
    if (!changelogManager) {
        try {
            const { getChangelogManager: getCM } = await import('../changelog/ChangelogManager');
            changelogManager = getCM();
        } catch (error) {
            console.warn('⚠️ ChangelogManager not available:', (error as Error).message);
            return null;
        }
    }
    return changelogManager;
}

async function getAIDebugger() {
    if (!aiDebugger) {
        try {
            const { getAIDebugger: getAD } = await import('../debug/AIDebugger');
            aiDebugger = getAD();
        } catch (error) {
            console.warn('⚠️ AIDebugger not available:', (error as Error).message);
            return null;
        }
    }
    return aiDebugger;
}

async function getConversationLogger() {
    if (!conversationLogger) {
        try {
            const { getAgentConversationLogger: getACL } = await import('../agents/AgentConversationLogger');
            conversationLogger = getACL();
        } catch (error) {
            console.warn('⚠️ AgentConversationLogger not available:', (error as Error).message);
            return null;
        }
    }
    return conversationLogger;
}

/**
 * Setup parity enhancement handlers
 */
export function setupParityHandlers(): void {
    // === CHANGELOG HANDLERS ===

    ipcMain.handle('changelog:load', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const cm = await getChangelogManager();
            if (!cm) return { success: false, error: 'Changelog manager not available' };

            const versions = await cm.loadChangelog(projectPath);
            return { success: true, versions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('changelog:addEntry', async (_, { projectPath, entry }: any) => {
        try {
            const cm = await getChangelogManager();
            if (!cm) return { success: false, error: 'Changelog manager not available' };

            const newEntry = await cm.addEntry(projectPath, entry);
            return { success: true, entry: newEntry };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('changelog:getVersions', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const cm = await getChangelogManager();
            if (!cm) return { success: false, error: 'Changelog manager not available' };

            const versions = cm.getVersions(projectPath);
            return { success: true, versions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('changelog:bumpVersion', async (_, { current, type }: any) => {
        try {
            const cm = await getChangelogManager();
            if (!cm) return { success: false, error: 'Changelog manager not available' };

            const newVersion = cm.bumpVersion(current, type);
            return { success: true, version: newVersion };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AI DEBUGGER HANDLERS ===

    ipcMain.handle('debug:analyze', async (_, context: any) => {
        try {
            const ad = await getAIDebugger();
            if (!ad) return { success: false, error: 'AI debugger not available' };

            const result = await ad.analyzeCode(context);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('debug:analyzeError', async (_, { error, code, file }: any) => {
        try {
            const ad = await getAIDebugger();
            if (!ad) return { success: false, error: 'AI debugger not available' };

            const result = await ad.analyzeError(error, code, file);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('debug:history', async (_, { limit }: { limit?: number } = {}) => {
        try {
            const ad = await getAIDebugger();
            if (!ad) return { success: false, error: 'AI debugger not available' };

            const history = ad.getHistory(limit);
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AGENT CONVERSATION LOGGER HANDLERS ===

    ipcMain.handle('agentlog:start', async (_, { task, agentId }: any) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversation = cl.startConversation(task, agentId);
            return { success: true, conversation };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:addStep', async (_, { type, content, metadata }: any) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const step = cl.addStep(type, content, metadata);
            return { success: true, step };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:complete', async (_, { result }: any = {}) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversation = cl.completeConversation(result);
            return { success: true, conversation };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:fail', async (_, { error }: { error: string }) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversation = cl.failConversation(error);
            return { success: true, conversation };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:get', async (_, { id }: { id: string }) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversation = cl.getConversation(id);
            return { success: true, conversation };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:getActive', async () => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversation = cl.getActiveConversation();
            return { success: true, conversation };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:list', async () => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const conversations = cl.getAllConversations();
            return { success: true, conversations };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('agentlog:summary', async (_, { id }: { id: string }) => {
        try {
            const cl = await getConversationLogger();
            if (!cl) return { success: false, error: 'Conversation logger not available' };

            const summary = cl.generateSummary(id);
            return { success: true, summary };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Parity enhancement IPC handlers registered');
}
