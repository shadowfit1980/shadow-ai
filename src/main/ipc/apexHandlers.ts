/**
 * Apex Feature IPC Handlers
 * IPC bridge for SessionManager and ThemeEngine
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let sessionManager: any = null;
let themeEngine: any = null;

async function getSessionManager() {
    if (!sessionManager) {
        try {
            const { getSessionManager: getSM } = await import('../session/SessionManager');
            sessionManager = getSM();
        } catch (error) {
            console.warn('⚠️ SessionManager not available:', (error as Error).message);
            return null;
        }
    }
    return sessionManager;
}

async function getThemeEngine() {
    if (!themeEngine) {
        try {
            const { getThemeEngine: getTE } = await import('../themes/ThemeEngine');
            themeEngine = getTE();
        } catch (error) {
            console.warn('⚠️ ThemeEngine not available:', (error as Error).message);
            return null;
        }
    }
    return themeEngine;
}

/**
 * Setup apex feature handlers
 */
export function setupApexHandlers(): void {
    // === SESSION MANAGER ===

    ipcMain.handle('session:create', async (_, { userId }: any = {}) => {
        try {
            const sm = await getSessionManager();
            if (!sm) return { success: false, error: 'SessionManager not available' };

            const session = sm.create(userId);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('session:getCurrent', async () => {
        try {
            const sm = await getSessionManager();
            if (!sm) return { success: false, error: 'SessionManager not available' };

            const session = sm.getCurrent();
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('session:update', async (_, { id, data }: any) => {
        try {
            const sm = await getSessionManager();
            if (!sm) return { success: false, error: 'SessionManager not available' };

            sm.update(id, data);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('session:end', async (_, { id }: { id: string }) => {
        try {
            const sm = await getSessionManager();
            if (!sm) return { success: false, error: 'SessionManager not available' };

            sm.end(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('session:getAll', async () => {
        try {
            const sm = await getSessionManager();
            if (!sm) return { success: false, error: 'SessionManager not available' };

            const sessions = sm.getAll();
            return { success: true, sessions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === THEME ENGINE ===

    ipcMain.handle('theme:getCurrent', async () => {
        try {
            const te = await getThemeEngine();
            if (!te) return { success: false, error: 'ThemeEngine not available' };

            const theme = te.getCurrent();
            return { success: true, theme };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('theme:set', async (_, { id }: { id: string }) => {
        try {
            const te = await getThemeEngine();
            if (!te) return { success: false, error: 'ThemeEngine not available' };

            te.setTheme(id);
            return { success: true, theme: te.getCurrent() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('theme:getAll', async () => {
        try {
            const te = await getThemeEngine();
            if (!te) return { success: false, error: 'ThemeEngine not available' };

            const themes = te.getAll();
            return { success: true, themes };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('theme:add', async (_, theme: any) => {
        try {
            const te = await getThemeEngine();
            if (!te) return { success: false, error: 'ThemeEngine not available' };

            te.addTheme(theme);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('theme:toCSSVariables', async () => {
        try {
            const te = await getThemeEngine();
            if (!te) return { success: false, error: 'ThemeEngine not available' };

            const css = te.toCSSVariables();
            return { success: true, css };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Apex feature IPC handlers registered');
}
