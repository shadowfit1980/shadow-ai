/**
 * Background Agent IPC Handlers
 * IPC bridge for background task management
 */

import { ipcMain } from 'electron';

// Lazy-loaded background agent pool
let agentPool: any = null;

async function getAgentPool() {
    if (!agentPool) {
        try {
            const { getBackgroundAgentPool } = await import('../ai/agents/BackgroundAgentPool');
            agentPool = getBackgroundAgentPool();
        } catch (error) {
            console.warn('⚠️ BackgroundAgentPool not available:', (error as Error).message);
            return null;
        }
    }
    return agentPool;
}

/**
 * Setup all background agent IPC handlers
 */
export function setupBackgroundAgentHandlers(): void {
    // Submit a new task
    ipcMain.handle('bgagent:submit', async (_, task: any) => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const taskId = await pool.submitTask(task);
            return { success: true, taskId };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get task status
    ipcMain.handle('bgagent:status', async (_, { taskId }: { taskId: string }) => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const status = await pool.getTaskStatus(taskId);
            return { success: true, status };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Cancel a task
    ipcMain.handle('bgagent:cancel', async (_, { taskId }: { taskId: string }) => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const cancelled = await pool.cancelTask(taskId);
            return { success: true, cancelled };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get running tasks
    ipcMain.handle('bgagent:running', async () => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const tasks = pool.getRunningTasks();
            return { success: true, tasks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get queued tasks
    ipcMain.handle('bgagent:queued', async () => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const tasks = pool.getQueuedTasks();
            return { success: true, tasks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get completed tasks
    ipcMain.handle('bgagent:completed', async (_, { limit }: { limit?: number } = {}) => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const tasks = pool.getCompletedTasks(limit);
            return { success: true, tasks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get pool statistics
    ipcMain.handle('bgagent:stats', async () => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            const stats = pool.getStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Clear completed tasks
    ipcMain.handle('bgagent:clearCompleted', async () => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            pool.clearCompletedTasks();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Update pool configuration
    ipcMain.handle('bgagent:config', async (_, config: any) => {
        try {
            const pool = await getAgentPool();
            if (!pool) return { success: false, error: 'Agent pool not available' };

            if (config) {
                pool.setConfig(config);
            }
            return { success: true, config: pool.getConfig() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Background Agent IPC handlers registered');
}
