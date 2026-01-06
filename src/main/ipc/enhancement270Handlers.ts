/**
 * Enhancement 270+ IPC Handlers - AutoGPT-inspired autonomous agent features
 */

import { ipcMain } from 'electron';

export function setupEnhancement270Handlers(): void {
    // GOAL DECOMPOSER
    ipcMain.handle('goal:create', async (_, { description }: any) => {
        try { const { getGoalDecomposer } = await import('../goaldecomposer/GoalDecomposer'); return { success: true, goal: getGoalDecomposer().create(description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('goal:decompose', async (_, { goalId, subgoals }: any) => {
        try { const { getGoalDecomposer } = await import('../goaldecomposer/GoalDecomposer'); return { success: getGoalDecomposer().decompose(goalId, subgoals) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TASK PRIORITIZER
    ipcMain.handle('taskpriority:add', async (_, { description, priority, deps }: any) => {
        try { const { getTaskPrioritizer } = await import('../taskprioritizer/TaskPrioritizer'); return { success: true, task: getTaskPrioritizer().add(description, priority, deps) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('taskpriority:getNext', async () => {
        try { const { getTaskPrioritizer } = await import('../taskprioritizer/TaskPrioritizer'); return { success: true, task: getTaskPrioritizer().getNext() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LONG TERM MEMORY
    ipcMain.handle('memory:store', async (_, { type, content, importance }: any) => {
        try { const { getLongTermMemory } = await import('../longtermmemory/LongTermMemory'); return { success: true, entry: getLongTermMemory().store(type, content, importance) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('memory:search', async (_, { query, limit }: any) => {
        try { const { getLongTermMemory } = await import('../longtermmemory/LongTermMemory'); return { success: true, results: getLongTermMemory().search(query, limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOOL REGISTRY
    ipcMain.handle('tools:getEnabled', async () => {
        try { const { getToolRegistry } = await import('../toolregistry/ToolRegistry'); return { success: true, tools: getToolRegistry().getEnabled() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WEB BROWSER
    ipcMain.handle('browser:browse', async (_, { url }: any) => {
        try { const { getWebBrowserAgent } = await import('../webbrowser/WebBrowserAgent'); return { success: true, result: await getWebBrowserAgent().browse(url) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE EXECUTOR
    ipcMain.handle('executor:execute', async (_, { code, language }: any) => {
        try { const { getCodeExecutorAgent } = await import('../codeexecutor/CodeExecutorAgent'); return { success: true, result: await getCodeExecutorAgent().execute(code, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT LOOP
    ipcMain.handle('agentloop:start', async (_, { goal, maxIterations }: any) => {
        try { const { getAgentLoopEngine } = await import('../agentloop/AgentLoopEngine'); return { success: true, session: getAgentLoopEngine().start(goal, maxIterations) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROMPT LIBRARY
    ipcMain.handle('prompts:render', async (_, { promptId, vars }: any) => {
        try { const { getPromptLibrary } = await import('../promptlib/PromptLibrary'); return { success: true, result: getPromptLibrary().render(promptId, vars) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SYSTEM PROMPTS
    ipcMain.handle('systemprompts:getActive', async () => {
        try { const { getSystemPromptManager } = await import('../systemprompts/SystemPromptManager'); return { success: true, prompt: getSystemPromptManager().getActive() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 270+ IPC handlers registered (12 handlers)');
}
