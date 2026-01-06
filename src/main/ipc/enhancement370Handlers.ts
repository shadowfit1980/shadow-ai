/**
 * Enhancement 370+ IPC Handlers - Ollama local LLM server features
 */

import { ipcMain } from 'electron';

export function setupEnhancement370Handlers(): void {
    // OLLAMA SERVER
    ipcMain.handle('ollama:start', async () => {
        try { const { getOllamaServerEngine } = await import('../ollamaserver/OllamaServerEngine'); return { success: true, started: await getOllamaServerEngine().start() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL PULL
    ipcMain.handle('ollama:pull', async (_, { model, tag }: any) => {
        try { const { getModelPullEngine } = await import('../modelpull/ModelPullEngine'); return { success: true, operation: await getModelPullEngine().pull(model, tag) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODELFILE PARSER
    ipcMain.handle('modelfile:parse', async (_, { content }: any) => {
        try { const { getModelfileParserEngine } = await import('../modelfile/ModelfileParserEngine'); return { success: true, config: getModelfileParserEngine().parse(content) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LAYER CACHE
    ipcMain.handle('layercache:getStats', async () => {
        try { const { getLayerCacheEngine } = await import('../layercache/LayerCacheEngine'); return { success: true, stats: getLayerCacheEngine().getStats() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GPU MANAGER
    ipcMain.handle('gpu:getDevices', async () => {
        try { const { getGPUManagerEngine } = await import('../gpumanager/GPUManagerEngine'); return { success: true, devices: getGPUManagerEngine().getDevices() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // STREAMING CHAT
    ipcMain.handle('streamchat:getActiveCount', async () => {
        try { const { getStreamingChatEngine } = await import('../streamingchat/StreamingChatEngine'); return { success: true, count: getStreamingChatEngine().getActiveCount() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL CUSTOMIZER
    ipcMain.handle('modelcustom:create', async (_, { name, baseModel, systemPrompt, parameters }: any) => {
        try { const { getModelCustomizerEngine } = await import('../modelcustom/ModelCustomizerEngine'); return { success: true, model: getModelCustomizerEngine().create(name, baseModel, systemPrompt, parameters) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MULTIMODAL PROCESSOR
    ipcMain.handle('multimodal:process', async (_, { model, prompt, inputs }: any) => {
        try { const { getMultimodalProcessorEngine } = await import('../multimodalproc/MultimodalProcessorEngine'); return { success: true, result: await getMultimodalProcessorEngine().process(model, prompt, inputs) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SERVER BINDING
    ipcMain.handle('serverbind:bind', async (_, { host, port, protocol, cors }: any) => {
        try { const { getServerBindingEngine } = await import('../serverbind/ServerBindingEngine'); return { success: true, binding: getServerBindingEngine().bind(host, port, protocol, cors) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL BLOBS
    ipcMain.handle('blobs:store', async (_, { digest, size, contentType }: any) => {
        try { const { getModelBlobsEngine } = await import('../modelblobs/ModelBlobsEngine'); return { success: true, blob: getModelBlobsEngine().store(digest, size, contentType) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 370+ IPC handlers registered (10 handlers)');
}
