/**
 * Enhancement 350+ IPC Handlers - GPT4All local LLM features
 */

import { ipcMain } from 'electron';

export function setupEnhancement350Handlers(): void {
    // LOCAL MODEL RUNNER
    ipcMain.handle('localmodel:generate', async (_, { prompt, config }: any) => {
        try { const { getLocalModelRunner } = await import('../localmodel/LocalModelRunner'); return { success: true, result: await getLocalModelRunner().generate(prompt, config) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GGUF LOADER
    ipcMain.handle('gguf:parseMetadata', async (_, { filePath }: any) => {
        try { const { getGGUFLoaderEngine } = await import('../ggufloader/GGUFLoaderEngine'); return { success: true, metadata: await getGGUFLoaderEngine().parseMetadata(filePath) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // QUANTIZATION
    ipcMain.handle('quant:quantize', async (_, { inputPath, outputPath, targetFormat }: any) => {
        try { const { getQuantizationEngine } = await import('../quantization/QuantizationEngine'); return { success: true, job: await getQuantizationEngine().quantize(inputPath, outputPath, targetFormat) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LOCAL DOC CHAT
    ipcMain.handle('localdoc:chat', async (_, { collectionId, question }: any) => {
        try { const { getLocalDocChatEngine } = await import('../localdocchat/LocalDocChatEngine'); return { success: true, result: await getLocalDocChatEngine().chat(collectionId, question) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL DOWNLOADER
    ipcMain.handle('modeldownload:download', async (_, { modelId, fileName, url, size }: any) => {
        try { const { getModelDownloaderEngine } = await import('../modeldownload/ModelDownloaderEngine'); return { success: true, download: await getModelDownloaderEngine().download(modelId, fileName, url, size) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // HARDWARE DETECTOR
    ipcMain.handle('hardware:detect', async () => {
        try { const { getHardwareDetectorEngine } = await import('../hardwaredetect/HardwareDetectorEngine'); return { success: true, info: await getHardwareDetectorEngine().detect() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CONTEXT WINDOW
    ipcMain.handle('context:create', async (_, { maxTokens }: any) => {
        try { const { getContextWindowManager } = await import('../contextwindow/ContextWindowManager'); return { success: true, window: getContextWindowManager().create(maxTokens) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROMPT TEMPLATES
    ipcMain.handle('prompttpl:format', async (_, { templateId, messages }: any) => {
        try { const { getPromptTemplatesEngine } = await import('../prompttemplates/PromptTemplatesEngine'); return { success: true, formatted: getPromptTemplatesEngine().format(templateId, messages) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LOCAL EMBEDDING
    ipcMain.handle('localembed:embed', async (_, { texts }: any) => {
        try { const { getLocalEmbeddingEngine } = await import('../localembed/LocalEmbeddingEngine'); return { success: true, embeddings: await getLocalEmbeddingEngine().embed(texts) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PRIVACY MODE
    ipcMain.handle('privacy:getConfig', async () => {
        try { const { getPrivacyModeEngine } = await import('../privacymode/PrivacyModeEngine'); return { success: true, config: getPrivacyModeEngine().getConfig() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 350+ IPC handlers registered (10 handlers)');
}
