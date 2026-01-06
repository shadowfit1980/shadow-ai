/**
 * Enhancement 300+ IPC Handlers - Windsurf Cascade-inspired features 🏆
 */

import { ipcMain } from 'electron';

export function setupEnhancement300Handlers(): void {
    // CASCADE ENGINE
    ipcMain.handle('cascade:start', async (_, { goal, context }: any) => {
        try { const { getCascadeEngine } = await import('../cascade/CascadeEngine'); return { success: true, session: getCascadeEngine().start(goal, context) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FLOWS
    ipcMain.handle('flows:trigger', async (_, { trigger }: any) => {
        try { const { getFlowsManager } = await import('../flows/FlowsManager'); return { success: true, flows: getFlowsManager().trigger(trigger) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MEMORY INDEX
    ipcMain.handle('memindex:add', async (_, { path, content }: any) => {
        try { const { getMemoryIndex } = await import('../memoryindex/MemoryIndex'); return { success: true, file: getMemoryIndex().add(path, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOOL EXECUTION
    ipcMain.handle('toolexec:execute', async (_, { tool, args }: any) => {
        try { const { getToolExecution } = await import('../toolexec/ToolExecution'); return { success: true, result: await getToolExecution().execute(tool, args) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMMAND PALETTE
    ipcMain.handle('cmdpalette:search', async (_, { query }: any) => {
        try { const { getCommandPalette } = await import('../cmdpalette/CommandPalette'); return { success: true, commands: getCommandPalette().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INLINE ASSIST
    ipcMain.handle('inline:create', async (_, { file, startLine, endLine, original, instruction }: any) => {
        try { const { getInlineAssist } = await import('../inlineassist/InlineAssist'); return { success: true, edit: getInlineAssist().create(file, startLine, endLine, original, instruction) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE LENS
    ipcMain.handle('codelens:generate', async (_, { file, content }: any) => {
        try { const { getCodeLensManager } = await import('../codelens/CodeLensManager'); return { success: true, lenses: getCodeLensManager().generate(file, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROBLEM DETECTOR
    ipcMain.handle('problems:detect', async (_, { file, content }: any) => {
        try { const { getProblemDetector } = await import('../problemdetect/ProblemDetector'); return { success: true, problems: getProblemDetector().detect(file, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SUGGESTIONS PANEL
    ipcMain.handle('suggestions:generate', async (_, { context }: any) => {
        try { const { getSuggestionsPanel } = await import('../suggestpanel/SuggestionsPanel'); return { success: true, suggestions: getSuggestionsPanel().generate(context) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTEXT RANKING
    ipcMain.handle('contextrank:rank', async (_, { query, files }: any) => {
        try { const { getContextRanking } = await import('../contextrank/ContextRanking'); return { success: true, ranked: getContextRanking().rank(query, files) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 300+ IPC handlers registered (10 handlers) 🏆🏆🏆');
}
