/**
 * Bugbot IPC Handlers
 * IPC bridge for bug detection and fix suggestions
 */

import { ipcMain } from 'electron';

// Lazy-loaded bugbot agent
let bugbotAgent: any = null;

async function getBugbotAgent() {
    if (!bugbotAgent) {
        try {
            const { getBugbotAgent: getAgent } = await import('../ai/agents/BugbotAgent');
            bugbotAgent = getAgent();
        } catch (error) {
            console.warn('⚠️ BugbotAgent not available:', (error as Error).message);
            return null;
        }
    }
    return bugbotAgent;
}

/**
 * Setup all bugbot IPC handlers
 */
export function setupBugbotHandlers(): void {
    // Scan project for bugs
    ipcMain.handle('bugbot:scan', async (_, { projectPath, options }: any) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const result = await agent.scanProject(projectPath, options);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Scan single file
    ipcMain.handle('bugbot:scanFile', async (_, { filePath, categories }: any) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const bugs = await agent.scanFile(filePath, categories);
            return { success: true, bugs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get all bugs
    ipcMain.handle('bugbot:bugs', async () => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const bugs = agent.getBugs();
            return { success: true, bugs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get single bug
    ipcMain.handle('bugbot:bug', async (_, { bugId }: { bugId: string }) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const bug = agent.getBug(bugId);
            return { success: true, bug };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Analyze bug
    ipcMain.handle('bugbot:analyze', async (_, { bugId }: { bugId: string }) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const analysis = await agent.analyzeBug(bugId);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Suggest fixes
    ipcMain.handle('bugbot:suggestFix', async (_, { bugId }: { bugId: string }) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const fixes = await agent.suggestFix(bugId);
            return { success: true, fixes };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Apply fix
    ipcMain.handle('bugbot:applyFix', async (_, { fixId }: { fixId: string }) => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const result = await agent.applyFix(fixId);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get statistics
    ipcMain.handle('bugbot:stats', async () => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            const stats = agent.getStats();
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Clear history
    ipcMain.handle('bugbot:clear', async () => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            agent.clearHistory();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check scanning status
    ipcMain.handle('bugbot:isScanning', async () => {
        try {
            const agent = await getBugbotAgent();
            if (!agent) return { success: false, error: 'Bugbot not available' };

            return { success: true, scanning: agent.isCurrentlyScanning() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Bugbot IPC handlers registered');
}
