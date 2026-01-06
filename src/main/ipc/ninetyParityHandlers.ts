/**
 * 90%+ Parity IPC Handlers
 * IPC bridge for TabCompletion, Collaboration, and Scaffolding
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let tabEngine: any = null;
let collab: any = null;
let scaffolder: any = null;

async function getTabCompletionEngine() {
    if (!tabEngine) {
        try {
            const { getTabCompletionEngine: getTCE } = await import('../completion/TabCompletionEngine');
            tabEngine = getTCE();
        } catch (error) {
            console.warn('⚠️ TabCompletionEngine not available:', (error as Error).message);
            return null;
        }
    }
    return tabEngine;
}

async function getCollaboration() {
    if (!collab) {
        try {
            const { getRealTimeCollaboration: getRTC } = await import('../collaboration/RealTimeCollaboration');
            collab = getRTC();
        } catch (error) {
            console.warn('⚠️ RealTimeCollaboration not available:', (error as Error).message);
            return null;
        }
    }
    return collab;
}

async function getScaffolder() {
    if (!scaffolder) {
        try {
            const { getProjectScaffolder: getPS } = await import('../scaffold/ProjectScaffolder');
            scaffolder = getPS();
        } catch (error) {
            console.warn('⚠️ ProjectScaffolder not available:', (error as Error).message);
            return null;
        }
    }
    return scaffolder;
}

/**
 * Setup 90%+ parity handlers
 */
export function setup90ParityHandlers(): void {
    // === TAB COMPLETION HANDLERS ===

    ipcMain.handle('tab:complete', async (_, context: any) => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            const items = await engine.getCompletions(context);
            return { success: true, items };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tab:accept', async (_, { sessionId }: { sessionId?: string } = {}) => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            const item = engine.acceptCompletion(sessionId);
            return { success: true, item };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tab:acceptPartial', async (_, { sessionId }: { sessionId?: string } = {}) => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            const text = engine.acceptPartial(sessionId);
            return { success: true, text };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tab:reject', async (_, { sessionId }: { sessionId?: string } = {}) => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            engine.rejectCompletion(sessionId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tab:next', async (_, { sessionId }: { sessionId?: string } = {}) => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            const item = engine.nextItem(sessionId);
            return { success: true, item };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('tab:getSession', async () => {
        try {
            const engine = await getTabCompletionEngine();
            if (!engine) return { success: false, error: 'Tab engine not available' };

            const session = engine.getActiveSession();
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === COLLABORATION HANDLERS ===

    ipcMain.handle('collab:setUser', async (_, { name }: { name: string }) => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            c.setLocalUser(name);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:create', async (_, { projectPath }: { projectPath: string }) => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            const session = c.createSession(projectPath);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:join', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            const joined = c.joinSession(sessionId);
            return { success: joined };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:leave', async () => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            c.leaveSession();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:updateCursor', async (_, cursor: any) => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            c.updateCursor(cursor);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:getCollaborators', async () => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            const collaborators = c.getCollaborators();
            return { success: true, collaborators };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('collab:getShareLink', async () => {
        try {
            const c = await getCollaboration();
            if (!c) return { success: false, error: 'Collaboration not available' };

            const link = c.getShareLink();
            return { success: true, link };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === SCAFFOLDER HANDLERS ===

    ipcMain.handle('scaffold:create', async (_, config: any) => {
        try {
            const s = await getScaffolder();
            if (!s) return { success: false, error: 'Scaffolder not available' };

            const result = await s.scaffold(config);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ 90%+ Parity IPC handlers registered');
}
