/**
 * Integration IPC Handlers
 * IPC bridge for Slack and Linear integrations
 */

import { ipcMain } from 'electron';

// Lazy-loaded integrations
let slackIntegration: any = null;
let linearIntegration: any = null;

async function getSlackIntegration() {
    if (!slackIntegration) {
        try {
            const { getSlackIntegration: getSlack } = await import('../integrations/SlackIntegration');
            slackIntegration = getSlack();
        } catch (error) {
            console.warn('⚠️ SlackIntegration not available:', (error as Error).message);
            return null;
        }
    }
    return slackIntegration;
}

async function getLinearIntegration() {
    if (!linearIntegration) {
        try {
            const { getLinearIntegration: getLinear } = await import('../integrations/LinearIntegration');
            linearIntegration = getLinear();
        } catch (error) {
            console.warn('⚠️ LinearIntegration not available:', (error as Error).message);
            return null;
        }
    }
    return linearIntegration;
}

/**
 * Setup all integration-related IPC handlers
 */
export function setupIntegrationHandlers(): void {
    // ==================== SLACK ====================

    // Connect to Slack
    ipcMain.handle('slack:connect', async (_, config: any) => {
        try {
            const slack = await getSlackIntegration();
            if (!slack) return { success: false, error: 'Slack integration not available' };

            await slack.connect(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Disconnect from Slack
    ipcMain.handle('slack:disconnect', async () => {
        try {
            const slack = await getSlackIntegration();
            if (!slack) return { success: false, error: 'Slack integration not available' };

            slack.disconnect();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check Slack status
    ipcMain.handle('slack:status', async () => {
        try {
            const slack = await getSlackIntegration();
            if (!slack) return { success: false, error: 'Slack integration not available' };

            return {
                success: true,
                connected: slack.isActive(),
                config: slack.getConfig(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Send Slack message
    ipcMain.handle('slack:send', async (_, { channel, text, threadTs }: any) => {
        try {
            const slack = await getSlackIntegration();
            if (!slack) return { success: false, error: 'Slack integration not available' };

            const ts = await slack.sendMessage(channel, text, { threadTs });
            return { success: true, timestamp: ts };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Post task result to Slack
    ipcMain.handle('slack:postResult', async (_, { channel, result, threadTs }: any) => {
        try {
            const slack = await getSlackIntegration();
            if (!slack) return { success: false, error: 'Slack integration not available' };

            const ts = await slack.postTaskResult(channel, result, threadTs);
            return { success: true, timestamp: ts };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ==================== LINEAR ====================

    // Connect to Linear
    ipcMain.handle('linear:connect', async (_, { apiKey }: { apiKey: string }) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            await linear.connect(apiKey);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Disconnect from Linear
    ipcMain.handle('linear:disconnect', async () => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            linear.disconnect();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Check Linear status
    ipcMain.handle('linear:status', async () => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            return {
                success: true,
                connected: linear.isActive(),
                config: linear.getConfig(),
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get Linear teams
    ipcMain.handle('linear:teams', async () => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            const teams = await linear.getTeams();
            return { success: true, teams };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get Linear projects
    ipcMain.handle('linear:projects', async (_, { teamId }: { teamId: string }) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            const projects = await linear.getProjects(teamId);
            return { success: true, projects };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get Linear issues
    ipcMain.handle('linear:issues', async (_, options: any) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            const issues = await linear.getIssues(options);
            return { success: true, issues };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Create Linear issue
    ipcMain.handle('linear:createIssue', async (_, input: any) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            const issue = await linear.createIssue(input);
            return { success: true, issue };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Update Linear issue status
    ipcMain.handle('linear:updateStatus', async (_, { issueId, stateId }: any) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            await linear.updateIssueStatus(issueId, stateId);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Link commit to Linear issue
    ipcMain.handle('linear:linkCommit', async (_, { issueId, commitHash, message }: any) => {
        try {
            const linear = await getLinearIntegration();
            if (!linear) return { success: false, error: 'Linear integration not available' };

            await linear.linkCommit(issueId, commitHash, message);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Integration IPC handlers registered');
}
