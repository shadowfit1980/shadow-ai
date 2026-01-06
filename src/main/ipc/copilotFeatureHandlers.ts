/**
 * Copilot Feature IPC Handlers
 * IPC bridge for Issue Agent and Audit Logger
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let issueAgent: any = null;
let auditLogger: any = null;

async function getCopilotIssueAgent() {
    if (!issueAgent) {
        try {
            const { getCopilotIssueAgent: getCIA } = await import('../github/CopilotIssueAgent');
            issueAgent = getCIA();
        } catch (error) {
            console.warn('⚠️ CopilotIssueAgent not available:', (error as Error).message);
            return null;
        }
    }
    return issueAgent;
}

async function getAuditLogger() {
    if (!auditLogger) {
        try {
            const { getAuditLogger: getAL } = await import('../audit/AuditLogger');
            auditLogger = getAL();
        } catch (error) {
            console.warn('⚠️ AuditLogger not available:', (error as Error).message);
            return null;
        }
    }
    return auditLogger;
}

/**
 * Setup Copilot feature handlers
 */
export function setupCopilotFeatureHandlers(): void {
    // === ISSUE AGENT ===

    ipcMain.handle('copilot:configure', async (_, options: any) => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            agent.configure(options);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:startMonitoring', async (_, { repo }: { repo: string }) => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            agent.startMonitoring(repo);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:stopMonitoring', async (_, { repo }: { repo: string }) => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            agent.stopMonitoring(repo);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:assignIssue', async (_, { repo, issueNumber }: any) => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            const task = await agent.assignIssue(repo, issueNumber);
            return { success: true, task };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:getTasks', async () => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            const tasks = agent.getAllTasks();
            return { success: true, tasks };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:cancelTask', async (_, { taskId }: { taskId: string }) => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            const cancelled = agent.cancelTask(taskId);
            return { success: cancelled };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:getMonitored', async () => {
        try {
            const agent = await getCopilotIssueAgent();
            if (!agent) return { success: false, error: 'Issue agent not available' };

            const repos = agent.getMonitoredRepos();
            return { success: true, repos };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AUDIT LOGGER ===

    ipcMain.handle('audit:log', async (_, event: any) => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            const logged = await logger.log(event);
            return { success: true, event: logged };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audit:query', async (_, options: any = {}) => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            const events = logger.query(options);
            return { success: true, events };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audit:summary', async (_, { startDate, endDate }: any = {}) => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            const summary = logger.getSummary(startDate, endDate);
            return { success: true, summary };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audit:exportJSON', async () => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            const json = await logger.exportToJSON();
            return { success: true, data: json };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audit:exportCSV', async () => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            const csv = await logger.exportToCSV();
            return { success: true, data: csv };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audit:flush', async () => {
        try {
            const logger = await getAuditLogger();
            if (!logger) return { success: false, error: 'Audit logger not available' };

            await logger.flushToDisk();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Copilot feature IPC handlers registered');
}
