/**
 * Enhancement 160+ IPC Handlers - Copilot-inspired
 */

import { ipcMain } from 'electron';

export function setupEnhancement160Handlers(): void {
    // COPILOT MODE
    ipcMain.handle('copilot:suggest', async (_, { context, cursor }: any) => {
        try { const { getCopilotMode } = await import('../copilot/CopilotMode'); return { success: true, suggestions: await getCopilotMode().suggest(context, cursor) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ISSUE TRACKER
    ipcMain.handle('issues:create', async (_, { title, description, labels }: any) => {
        try { const { getIssueTracker } = await import('../issuetracker/IssueTracker'); return { success: true, issue: getIssueTracker().create(title, description, labels) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('issues:assignToAI', async (_, { id }: any) => {
        try { const { getIssueTracker } = await import('../issuetracker/IssueTracker'); return { success: getIssueTracker().assignToAI(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PULL REQUEST
    ipcMain.handle('pr:create', async (_, { title, description, branch, targetBranch, files }: any) => {
        try { const { getPullRequestManager } = await import('../pullrequest/PullRequestManager'); return { success: true, pr: getPullRequestManager().create(title, description, branch, targetBranch, files) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('pr:merge', async (_, { id }: any) => {
        try { const { getPullRequestManager } = await import('../pullrequest/PullRequestManager'); return { success: getPullRequestManager().merge(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE EXPLAINER
    ipcMain.handle('code:explain', async (_, { code, language }: any) => {
        try { const { getCodeExplainer } = await import('../codeexplain/CodeExplainer'); return { success: true, explanation: await getCodeExplainer().explain(code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT MODE
    ipcMain.handle('agent:execute', async (_, { description }: any) => {
        try { const { getAgentModeManager } = await import('../agentmode/AgentModeManager'); return { success: true, task: await getAgentModeManager().execute(description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTEXT
    ipcMain.handle('context:create', async (_, { name, files, description }: any) => {
        try { const { getContextManager } = await import('../context/ContextManager'); return { success: true, context: getContextManager().create(name, files, description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('context:activate', async (_, { id }: any) => {
        try { const { getContextManager } = await import('../context/ContextManager'); return { success: getContextManager().activate(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FEEDBACK
    ipcMain.handle('feedback:add', async (_, { type, message, file, line }: any) => {
        try { const { getFeedbackManager } = await import('../feedback/FeedbackManager'); return { success: true, feedback: getFeedbackManager().add(type, message, file, line) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BACKGROUND JOBS
    ipcMain.handle('jobs:queue', async (_, { name }: any) => {
        try { const { getBackgroundJobManager } = await import('../background/BackgroundJobManager'); return { success: true, job: getBackgroundJobManager().queue(name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('jobs:run', async (_, { id }: any) => {
        try { const { getBackgroundJobManager } = await import('../background/BackgroundJobManager'); return { success: true, job: await getBackgroundJobManager().run(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SPACES
    ipcMain.handle('spaces:create', async (_, { name, description, files }: any) => {
        try { const { getSpacesManager } = await import('../spaces/SpacesManager'); return { success: true, space: getSpacesManager().create(name, description, files) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AUTONOMY
    ipcMain.handle('autonomy:execute', async (_, { intent }: any) => {
        try { const { getAutonomyEngine } = await import('../autonomy/AutonomyEngine'); return { success: true, action: await getAutonomyEngine().execute(intent) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('autonomy:setLevel', async (_, { level }: any) => {
        try { const { getAutonomyEngine } = await import('../autonomy/AutonomyEngine'); getAutonomyEngine().setLevel(level); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 160+ IPC handlers registered (15 handlers)');
}
