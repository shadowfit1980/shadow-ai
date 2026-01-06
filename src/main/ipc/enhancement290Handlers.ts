/**
 * Enhancement 290+ IPC Handlers - Trae.ai-inspired AI IDE features
 */

import { ipcMain } from 'electron';

export function setupEnhancement290Handlers(): void {
    // BUILDER MODE
    ipcMain.handle('builder:create', async (_, { name, description }: any) => {
        try { const { getBuilderModeEngine } = await import('../buildermode/BuilderModeEngine'); return { success: true, project: await getBuilderModeEngine().startBuild(description || name) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PANEL MANAGER
    ipcMain.handle('panels:toggle', async (_, { panelId }: any) => {
        try { const { getPanelManager } = await import('../panelmgr/PanelManager'); return { success: getPanelManager().toggle(panelId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DIFF VIEWER
    ipcMain.handle('diff:compute', async (_, { file, original, modified }: any) => {
        try { const { getDiffViewer } = await import('../diffviewer/DiffViewer'); return { success: true, diff: getDiffViewer().compute(file, original, modified) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CHECKPOINT
    ipcMain.handle('checkpoint:create', async (_, { name, files, description }: any) => {
        try { const { getCheckpointManager } = await import('../checkpointmgr/CheckpointManager'); return { success: true, checkpoint: getCheckpointManager().create(name, files, description) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTEXT PICKER
    ipcMain.handle('context:add', async (_, { type, path, content }: any) => {
        try { const { getContextPicker } = await import('../contextpicker/ContextPicker'); return { success: true, item: getContextPicker().add(type, path, content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MENTIONS
    ipcMain.handle('mentions:parse', async (_, { text }: any) => {
        try { const { getMentionSystem } = await import('../mentions/MentionSystem'); return { success: true, mentions: getMentionSystem().parse(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // IMAGE GEN
    ipcMain.handle('image:generate', async (_, { prompt, width, height }: any) => {
        try { const { getImageGenerationEngine } = await import('../imagegen/ImageGenerationEngine'); return { success: true, image: await getImageGenerationEngine().generate(prompt, width, height) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // UI PREVIEW
    ipcMain.handle('preview:create', async (_, { type, html, css, js }: any) => {
        try { const { getUIPreviewEngine } = await import('../uipreview/UIPreviewEngine'); return { success: true, preview: getUIPreviewEngine().create(type, html, css, js) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TERMINAL
    ipcMain.handle('terminal:execute', async (_, { sessionId, command }: any) => {
        try { const { getTerminalIntegration } = await import('../termintegration/TerminalIntegration'); return { success: true, result: await getTerminalIntegration().execute(sessionId, command) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT BUILDER
    ipcMain.handle('agentbuilder:create', async (_, { name, description, instructions, tools, model }: any) => {
        try { const { getAgentBuilder } = await import('../agentbuilder/AgentBuilder'); return { success: true, agent: getAgentBuilder().create(name, description, instructions, tools, model) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 290+ IPC handlers registered (10 handlers)');
}
