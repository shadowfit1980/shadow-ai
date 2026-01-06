/**
 * TUI IPC Handlers
 * IPC bridge for Terminal UI interactions (vim, htop, etc.)
 */

import { ipcMain } from 'electron';

// Lazy-loaded TUI interactor
let tuiInteractor: any = null;

async function getTUIInteractor() {
    if (!tuiInteractor) {
        try {
            const { getTUIInteractor: getInteractor } = await import('../terminal/TUIInteractor');
            tuiInteractor = getInteractor();
        } catch (error) {
            console.warn('⚠️ TUIInteractor not available:', (error as Error).message);
            return null;
        }
    }
    return tuiInteractor;
}

/**
 * Setup TUI IPC handlers
 */
export function setupTUIHandlers(): void {
    // Start TUI session
    ipcMain.handle('tui:start', async (_, { command, args, options }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const sessionId = await interactor.startSession(command, args || [], options);
            return { success: true, sessionId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Send input to TUI
    ipcMain.handle('tui:input', async (_, { sessionId, input }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            await interactor.sendInput(sessionId, input);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Send key sequence
    ipcMain.handle('tui:key', async (_, { sessionId, key }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            await interactor.sendKey(sessionId, key);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Capture screen buffer
    ipcMain.handle('tui:capture', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const buffer = await interactor.captureScreen(sessionId);
            return { success: true, buffer };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get screen as text
    ipcMain.handle('tui:text', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const text = await interactor.getScreenText(sessionId);
            return { success: true, text };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Wait for pattern
    ipcMain.handle('tui:waitFor', async (_, { sessionId, pattern, timeout }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const result = await interactor.waitForPattern(
                sessionId,
                new RegExp(pattern),
                timeout
            );
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Resize terminal
    ipcMain.handle('tui:resize', async (_, { sessionId, cols, rows }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            await interactor.resize(sessionId, cols, rows);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Stop session
    ipcMain.handle('tui:stop', async (_, { sessionId, signal }: any) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            await interactor.stopSession(sessionId, signal);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get session info
    ipcMain.handle('tui:session', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const session = interactor.getSession(sessionId);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // List active sessions
    ipcMain.handle('tui:sessions', async () => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const sessions = interactor.getActiveSessions();
            return { success: true, sessions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Cleanup old sessions
    ipcMain.handle('tui:cleanup', async () => {
        try {
            const interactor = await getTUIInteractor();
            if (!interactor) return { success: false, error: 'TUI interactor not available' };

            const cleaned = interactor.cleanupSessions();
            return { success: true, cleaned };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ TUI IPC handlers registered');
}
