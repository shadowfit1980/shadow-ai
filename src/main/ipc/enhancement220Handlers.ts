/**
 * Enhancement 220+ IPC Handlers - Claude.ai-inspired AI features
 */

import { ipcMain } from 'electron';

export function setupEnhancement220Handlers(): void {
    // ARTIFACT SYSTEM
    ipcMain.handle('artifact:create', async (_, { title, type, content, language }: any) => {
        try { const { getArtifactSystem } = await import('../artifact/ArtifactSystem'); return { success: true, artifact: getArtifactSystem().create(title, type, content, language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('artifact:getAll', async () => {
        try { const { getArtifactSystem } = await import('../artifact/ArtifactSystem'); return { success: true, artifacts: getArtifactSystem().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LONG CONTEXT
    ipcMain.handle('longcontext:create', async (_, { maxTokens }: any = {}) => {
        try { const { getLongContextManager } = await import('../longcontext/LongContextManager'); return { success: true, window: getLongContextManager().create(maxTokens) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VISION
    ipcMain.handle('vision:analyze', async (_, { imagePath }: any) => {
        try { const { getVisionProcessor } = await import('../visionproc/VisionProcessor'); return { success: true, analysis: await getVisionProcessor().analyze(imagePath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SAFETY
    ipcMain.handle('safety:check', async (_, { content }: any) => {
        try { const { getSafetyFilter } = await import('../safetyfilter/SafetyFilter'); return { success: true, check: await getSafetyFilter().check(content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROJECTS
    ipcMain.handle('project:create', async (_, { name, instructions }: any) => {
        try { const { getProjectMemory } = await import('../projectmem/ProjectMemory'); return { success: true, project: getProjectMemory().create(name, instructions) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('project:addKnowledge', async (_, { id, knowledge }: any) => {
        try { const { getProjectMemory } = await import('../projectmem/ProjectMemory'); return { success: getProjectMemory().addKnowledge(id, knowledge) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONVERSATION TREE
    ipcMain.handle('convtree:addMessage', async (_, { branchId, parentId, role, content }: any) => {
        try { const { getConversationTree } = await import('../convtree/ConversationTree'); return { success: true, node: getConversationTree().addMessage(branchId, parentId, role, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DOC ANALYSIS
    ipcMain.handle('docanalysis:analyze', async (_, { path }: any) => {
        try { const { getDocumentAnalyzer } = await import('../docanalysis/DocumentAnalyzer'); return { success: true, result: await getDocumentAnalyzer().analyze(path) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CODE ARTIFACT
    ipcMain.handle('codeartifact:run', async (_, { id }: any) => {
        try { const { getCodeArtifactManager } = await import('../codeartifact/CodeArtifactManager'); return { success: true, result: await getCodeArtifactManager().run(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // THINKING MODE
    ipcMain.handle('thinking:think', async (_, { prompt }: any) => {
        try { const { getThinkingModeEngine } = await import('../thinkmode/ThinkingModeEngine'); return { success: true, session: await getThinkingModeEngine().think(prompt) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // OUTPUT STREAM
    ipcMain.handle('stream:start', async () => {
        try { const { getOutputStreamer } = await import('../outputstream/OutputStreamer'); return { success: true, session: getOutputStreamer().startStream() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('stream:push', async (_, { sessionId, chunk }: any) => {
        try { const { getOutputStreamer } = await import('../outputstream/OutputStreamer'); return { success: getOutputStreamer().pushChunk(sessionId, chunk) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 220+ IPC handlers registered (13 handlers)');
}
