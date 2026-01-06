/**
 * CodeRabbit Feature IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupCoderabbitHandlers(): void {
    // JIRA
    ipcMain.handle('jira:configure', async (_, config: any) => {
        try { const { getJiraIntegration } = await import('../jira/JiraIntegration'); getJiraIntegration().configure(config); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('jira:getIssue', async (_, { key }: any) => {
        try { const { getJiraIntegration } = await import('../jira/JiraIntegration'); return { success: true, issue: await getJiraIntegration().getIssue(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('jira:createIssue', async (_, { summary, description, type }: any) => {
        try { const { getJiraIntegration } = await import('../jira/JiraIntegration'); return { success: true, issue: await getJiraIntegration().createIssue(summary, description, type) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('jira:searchIssues', async (_, { jql }: any) => {
        try { const { getJiraIntegration } = await import('../jira/JiraIntegration'); return { success: true, issues: await getJiraIntegration().searchIssues(jql) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('jira:addComment', async (_, { key, comment }: any) => {
        try { const { getJiraIntegration } = await import('../jira/JiraIntegration'); await getJiraIntegration().addComment(key, comment); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LINEAR
    ipcMain.handle('linear:configure', async (_, config: any) => {
        try { const { getLinearIntegration } = await import('../linear/LinearIntegration'); getLinearIntegration().configure(config); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('linear:getIssue', async (_, { id }: any) => {
        try { const { getLinearIntegration } = await import('../linear/LinearIntegration'); return { success: true, issue: await getLinearIntegration().getIssue(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('linear:createIssue', async (_, { title, description }: any) => {
        try { const { getLinearIntegration } = await import('../linear/LinearIntegration'); return { success: true, issue: await getLinearIntegration().createIssue(title, description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('linear:getTeamIssues', async () => {
        try { const { getLinearIntegration } = await import('../linear/LinearIntegration'); return { success: true, issues: await getLinearIntegration().getTeamIssues() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LINTER HUB
    ipcMain.handle('linter:run', async (_, { linter, file }: any) => {
        try { const { getLinterHub } = await import('../linters/LinterHub'); return { success: true, results: await getLinterHub().run(linter, file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('linter:runAll', async (_, { file }: any) => {
        try { const { getLinterHub } = await import('../linters/LinterHub'); return { success: true, results: await getLinterHub().runAll(file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('linter:getLinters', async () => {
        try { const { getLinterHub } = await import('../linters/LinterHub'); return { success: true, linters: getLinterHub().getLinters(), count: getLinterHub().getLinterCount() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CLI
    ipcMain.handle('cli:execute', async (_, { command, args }: any) => {
        try { const { getCLITool } = await import('../cli/CLITool'); await getCLITool().execute(command, args); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('cli:getCommands', async () => {
        try { const { getCLITool } = await import('../cli/CLITool'); return { success: true, commands: getCLITool().getCommands().map(c => ({ name: c.name, description: c.description, usage: c.usage })) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('cli:getHelp', async () => {
        try { const { getCLITool } = await import('../cli/CLITool'); return { success: true, help: getCLITool().getHelp() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ CodeRabbit feature IPC handlers registered (15 handlers)');
}
