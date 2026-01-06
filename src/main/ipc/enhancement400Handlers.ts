/**
 * Enhancement 400+ IPC Handlers - Trae.ai SOLO/IDE features
 */

import { ipcMain } from 'electron';

export function setupEnhancement400Handlers(): void {
    // BUILDER MODE
    ipcMain.handle('builder:start', async (_, { description }: any) => {
        try { const { getBuilderModeEngine } = await import('../buildermode/BuilderModeEngine'); return { success: true, task: await getBuilderModeEngine().startBuild(description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INLINE ASSIST
    ipcMain.handle('inline:assist', async (_, { filePath, lineNumber, prompt, selection }: any) => {
        try { const { getInlineAssistEngine } = await import('../inlineassist/InlineAssistEngine'); return { success: true, result: await getInlineAssistEngine().assist(filePath, lineNumber, prompt, selection) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROJECT SCAFFOLD
    ipcMain.handle('scaffold:create', async (_, { templateId, projectPath }: any) => {
        try { const { getProjectScaffoldEngine } = await import('../projectscaffold/ProjectScaffoldEngine'); return { success: true, result: await getProjectScaffoldEngine().scaffold(templateId, projectPath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DIFF PREVIEW
    ipcMain.handle('diff:create', async (_, { filePath, oldContent, newContent }: any) => {
        try { const { getDiffPreviewEngine } = await import('../diffpreview/DiffPreviewEngine'); return { success: true, preview: getDiffPreviewEngine().createPreview(filePath, oldContent, newContent) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TERMINAL AGENT
    ipcMain.handle('terminal:execute', async (_, { sessionId, command }: any) => {
        try { const { getTerminalAgentEngine } = await import('../terminalagent/TerminalAgentEngine'); return { success: true, result: await getTerminalAgentEngine().execute(sessionId, command) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTEXT PICKER
    ipcMain.handle('context:create', async () => {
        try { const { getContextPickerEngine } = await import('../contextpicker/ContextPickerEngine'); return { success: true, selection: getContextPickerEngine().createSelection() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MENTION SYSTEM
    ipcMain.handle('mention:parse', async (_, { text }: any) => {
        try { const { getMentionSystemEngine } = await import('../mentionsystem/MentionSystemEngine'); return { success: true, mentions: getMentionSystemEngine().parse(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROJECT CHAT
    ipcMain.handle('pchat:send', async (_, { sessionId, content, attachments }: any) => {
        try { const { getProjectChatEngine } = await import('../projectchat/ProjectChatEngine'); return { success: true, message: await getProjectChatEngine().sendMessage(sessionId, content, attachments) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // FILE SEARCH
    ipcMain.handle('filesearch:search', async (_, { options }: any) => {
        try { const { getFileSearchEngine } = await import('../filesearch/FileSearchEngine'); return { success: true, results: getFileSearchEngine().search(options) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMMAND PALETTE
    ipcMain.handle('cmd:search', async (_, { query }: any) => {
        try { const { getCommandPaletteEngine } = await import('../cmdpalette/CommandPaletteEngine'); return { success: true, commands: getCommandPaletteEngine().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 400+ IPC handlers registered (10 handlers)');
}
