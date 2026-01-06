/**
 * Enhancement 170+ IPC Handlers - Advanced Copilot features
 */

import { ipcMain } from 'electron';

export function setupEnhancement170Handlers(): void {
    // EDIT MODE
    ipcMain.handle('editmode:proposeEdit', async (_, { file, original, instruction }: any) => {
        try { const { getEditModeManager } = await import('../editmode/EditModeManager'); return { success: true, edit: await getEditModeManager().proposeEdit(file, original, instruction) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CHAT HISTORY
    ipcMain.handle('chathistory:newSession', async (_, { title }: any = {}) => {
        try { const { getChatHistoryManager } = await import('../chathistory/ChatHistoryManager'); return { success: true, session: getChatHistoryManager().newSession(title) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('chathistory:addMessage', async (_, { role, content }: any) => {
        try { const { getChatHistoryManager } = await import('../chathistory/ChatHistoryManager'); return { success: true, message: getChatHistoryManager().addMessage(role, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE ACTIONS
    ipcMain.handle('codeactions:getActions', async (_, { file, code, range }: any) => {
        try { const { getCodeActionsProvider } = await import('../codeactions/CodeActionsProvider'); return { success: true, actions: await getCodeActionsProvider().getActions(file, code, range) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INLINE EDIT
    ipcMain.handle('inlineedit:edit', async (_, { file, line, instruction, originalLine }: any) => {
        try { const { getInlineEditManager } = await import('../inlineedit/InlineEditManager'); return { success: true, edit: await getInlineEditManager().edit({ file, line, instruction }, originalLine) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MULTI-FILE
    ipcMain.handle('multifile:createSession', async (_, { description }: any) => {
        try { const { getMultiFileEditor } = await import('../multifile/MultiFileEditor'); return { success: true, session: getMultiFileEditor().createSession(description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEST GENERATOR
    ipcMain.handle('testgen:generate', async (_, { file, code, framework }: any) => {
        try { const { getTestGenerator } = await import('../testgen/TestGenerator'); return { success: true, tests: await getTestGenerator().generate(file, code, framework) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DOC GENERATOR
    ipcMain.handle('docgen:generateMarkdown', async (_, { file, code }: any) => {
        try { const { getDocGenerator } = await import('../docgen/DocGenerator'); return { success: true, doc: await getDocGenerator().generateMarkdown(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('docgen:generateJSDoc', async (_, { file, fnName, fnCode }: any) => {
        try { const { getDocGenerator } = await import('../docgen/DocGenerator'); return { success: true, doc: await getDocGenerator().generateJSDoc(file, fnName, fnCode) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SECURITY SCANNER
    ipcMain.handle('security:scan', async (_, { file, code }: any) => {
        try { const { getSecurityScanner } = await import('../securityscan/SecurityScanner'); return { success: true, issues: await getSecurityScanner().scan(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE METRICS
    ipcMain.handle('metrics:analyze', async (_, { file, code }: any) => {
        try { const { getCodeMetricsAnalyzer } = await import('../codemetrics/CodeMetricsAnalyzer'); return { success: true, metrics: await getCodeMetricsAnalyzer().analyze(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('metrics:getProject', async () => {
        try { const { getCodeMetricsAnalyzer } = await import('../codemetrics/CodeMetricsAnalyzer'); return { success: true, metrics: getCodeMetricsAnalyzer().getProjectMetrics() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AI REVIEW
    ipcMain.handle('aireview:review', async (_, { files, code }: any) => {
        try { const { getAIReviewEngine } = await import('../aireview/AIReviewEngine'); return { success: true, review: await getAIReviewEngine().review(files, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 170+ IPC handlers registered (13 handlers)');
}
