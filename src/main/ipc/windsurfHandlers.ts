/**
 * Windsurf Feature IPC Handlers
 * IPC bridge for TurboMode, DatabaseMCP, GitWorktrees
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let turboMode: any = null;
let databaseMCP: any = null;
let gitWorktrees: any = null;

async function getTurboMode() {
    if (!turboMode) {
        try {
            const { getTurboMode: getTM } = await import('../turbo/TurboMode');
            turboMode = getTM();
        } catch (error) {
            console.warn('⚠️ TurboMode not available:', (error as Error).message);
            return null;
        }
    }
    return turboMode;
}

async function getDatabaseMCP() {
    if (!databaseMCP) {
        try {
            const { getDatabaseMCP: getDB } = await import('../mcp/providers/DatabaseMCP');
            databaseMCP = getDB();
        } catch (error) {
            console.warn('⚠️ DatabaseMCP not available:', (error as Error).message);
            return null;
        }
    }
    return databaseMCP;
}

async function getGitWorktrees() {
    if (!gitWorktrees) {
        try {
            const { getGitWorktrees: getGW } = await import('../git/GitWorktrees');
            gitWorktrees = getGW();
        } catch (error) {
            console.warn('⚠️ GitWorktrees not available:', (error as Error).message);
            return null;
        }
    }
    return gitWorktrees;
}

/**
 * Setup Windsurf feature handlers
 */
export function setupWindsurfHandlers(): void {
    // === TURBO MODE ===

    ipcMain.handle('turbo:enable', async () => {
        try {
            const tm = await getTurboMode();
            if (!tm) return { success: false, error: 'Turbo mode not available' };

            tm.enable();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('turbo:disable', async () => {
        try {
            const tm = await getTurboMode();
            if (!tm) return { success: false, error: 'Turbo mode not available' };

            tm.disable();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('turbo:configure', async (_, options: any) => {
        try {
            const tm = await getTurboMode();
            if (!tm) return { success: false, error: 'Turbo mode not available' };

            tm.configure(options);
            return { success: true, config: tm.getConfig() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('turbo:execute', async (_, { command, cwd }: any) => {
        try {
            const tm = await getTurboMode();
            if (!tm) return { success: false, error: 'Turbo mode not available' };

            const execution = await tm.executeTerminal(command, cwd);
            return { success: true, execution };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('turbo:getStatus', async () => {
        try {
            const tm = await getTurboMode();
            if (!tm) return { success: false, error: 'Turbo mode not available' };

            return {
                success: true,
                enabled: tm.isEnabled(),
                config: tm.getConfig(),
                executions: tm.getRecentExecutions(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === DATABASE MCP ===

    ipcMain.handle('db:addConnection', async (_, config: any) => {
        try {
            const db = await getDatabaseMCP();
            if (!db) return { success: false, error: 'Database MCP not available' };

            const conn = db.addConnection(config);
            return { success: true, connection: conn };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:connect', async (_, { connectionId }: { connectionId: string }) => {
        try {
            const db = await getDatabaseMCP();
            if (!db) return { success: false, error: 'Database MCP not available' };

            const connected = await db.connect(connectionId);
            return { success: connected };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:query', async (_, { connectionId, sql }: any) => {
        try {
            const db = await getDatabaseMCP();
            if (!db) return { success: false, error: 'Database MCP not available' };

            const result = await db.query(connectionId, sql);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:listTables', async (_, { connectionId }: { connectionId: string }) => {
        try {
            const db = await getDatabaseMCP();
            if (!db) return { success: false, error: 'Database MCP not available' };

            const tables = await db.listTables(connectionId);
            return { success: true, tables };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db:getConnections', async () => {
        try {
            const db = await getDatabaseMCP();
            if (!db) return { success: false, error: 'Database MCP not available' };

            const connections = db.getConnections();
            return { success: true, connections };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === GIT WORKTREES ===

    ipcMain.handle('worktree:list', async () => {
        try {
            const gw = await getGitWorktrees();
            if (!gw) return { success: false, error: 'Git worktrees not available' };

            const worktrees = await gw.list();
            return { success: true, worktrees };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('worktree:create', async (_, options: any) => {
        try {
            const gw = await getGitWorktrees();
            if (!gw) return { success: false, error: 'Git worktrees not available' };

            const worktree = await gw.create(options);
            return { success: true, worktree };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('worktree:remove', async (_, { path, force }: any) => {
        try {
            const gw = await getGitWorktrees();
            if (!gw) return { success: false, error: 'Git worktrees not available' };

            const removed = await gw.remove(path, force);
            return { success: removed };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('worktree:setRepo', async (_, { repoPath }: { repoPath: string }) => {
        try {
            const gw = await getGitWorktrees();
            if (!gw) return { success: false, error: 'Git worktrees not available' };

            gw.setRepoPath(repoPath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Windsurf feature IPC handlers registered');
}
