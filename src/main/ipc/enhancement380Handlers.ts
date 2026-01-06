/**
 * Enhancement 380+ IPC Handlers - LM Studio desktop AI features
 */

import { ipcMain } from 'electron';

export function setupEnhancement380Handlers(): void {
    // CHAT PLAYGROUND
    ipcMain.handle('playground:createSession', async (_, { modelId, settings }: any) => {
        try { const { getChatPlaygroundEngine } = await import('../chatplayground/ChatPlaygroundEngine'); return { success: true, session: getChatPlaygroundEngine().createSession(modelId, settings) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL BROWSER
    ipcMain.handle('modelbrowser:search', async (_, { filters }: any) => {
        try { const { getModelBrowserEngine } = await import('../modelbrowser/ModelBrowserEngine'); return { success: true, models: getModelBrowserEngine().search(filters) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INFERENCE ENGINE
    ipcMain.handle('inference:infer', async (_, { modelId, prompt, options }: any) => {
        try { const { getInferenceEngineCore } = await import('../inferenceeng/InferenceEngineCore'); return { success: true, result: await getInferenceEngineCore().infer(modelId, prompt, options) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PERFORMANCE MONITOR
    ipcMain.handle('perfmon:getStats', async (_, { modelId }: any) => {
        try { const { getPerformanceMonitorEngine } = await import('../perfmonitor/PerformanceMonitorEngine'); return { success: true, stats: getPerformanceMonitorEngine().getStats(modelId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL VALIDATOR
    ipcMain.handle('modelval:validate', async (_, { filePath }: any) => {
        try { const { getModelValidatorEngine } = await import('../modelvalidator/ModelValidatorEngine'); return { success: true, result: await getModelValidatorEngine().validate(filePath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CHAT HISTORY
    ipcMain.handle('chathistory:getAll', async () => {
        try { const { getChatHistoryEngine } = await import('../chathistory/ChatHistoryEngine'); return { success: true, conversations: getChatHistoryEngine().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SYSTEM PROMPT EDITOR
    ipcMain.handle('sysprompt:create', async (_, { name, content, category }: any) => {
        try { const { getSystemPromptEditorEngine } = await import('../sysprompteditor/SystemPromptEditorEngine'); return { success: true, prompt: getSystemPromptEditorEngine().create(name, content, category) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOKEN COUNTER
    ipcMain.handle('tokens:count', async (_, { text }: any) => {
        try { const { getTokenCounterEngine } = await import('../tokencounter/TokenCounterEngine'); return { success: true, count: getTokenCounterEngine().count(text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL PRELOADER
    ipcMain.handle('preload:preload', async (_, { modelId, memoryUsed }: any) => {
        try { const { getModelPreloaderEngine } = await import('../modelpreload/ModelPreloaderEngine'); return { success: true, preloaded: await getModelPreloaderEngine().preload(modelId, memoryUsed) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LOCAL API SERVER
    ipcMain.handle('apiserver:start', async () => {
        try { const { getLocalAPIServerEngine } = await import('../localapiserver/LocalAPIServerEngine'); return { success: true, started: await getLocalAPIServerEngine().start() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 380+ IPC handlers registered (10 handlers)');
}
