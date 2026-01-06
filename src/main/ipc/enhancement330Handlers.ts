/**
 * Enhancement 330+ IPC Handlers - Novita-inspired API cloud features
 */

import { ipcMain } from 'electron';

export function setupEnhancement330Handlers(): void {
    // IMAGE GENERATOR
    ipcMain.handle('imagegen:generate', async (_, { prompt, model, width, height, steps }: any) => {
        try { const { getImageGeneratorEngine } = await import('../imagegenerator/ImageGeneratorEngine'); return { success: true, result: await getImageGeneratorEngine().generate(prompt, model, width, height, steps) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // VIDEO GENERATOR
    ipcMain.handle('videogen:generate', async (_, { prompt, model, duration, width, height }: any) => {
        try { const { getVideoGeneratorEngine } = await import('../videogenerator/VideoGeneratorEngine'); return { success: true, result: await getVideoGeneratorEngine().generate(prompt, model, duration, width, height) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AUDIO GENERATOR
    ipcMain.handle('audiogen:tts', async (_, { text, voice }: any) => {
        try { const { getAudioGeneratorEngine } = await import('../audiogenerator/AudioGeneratorEngine'); return { success: true, result: await getAudioGeneratorEngine().textToSpeech(text, voice) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WEBHOOK
    ipcMain.handle('webhook:register', async (_, { url, events }: any) => {
        try { const { getWebhookManager } = await import('../webhookmgr/WebhookManager'); return { success: true, webhook: getWebhookManager().register(url, events) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // API GATEWAY
    ipcMain.handle('gateway:route', async (_, { path, method }: any) => {
        try { const { getAPIGatewayEngine } = await import('../apigateway/APIGatewayEngine'); return { success: true, request: await getAPIGatewayEngine().route(path, method) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RATE LIMITER
    ipcMain.handle('ratelimit:check', async (_, { endpoint }: any) => {
        try { const { getRateLimiterEngine } = await import('../ratelimiter/RateLimiterEngine'); return { success: true, state: getRateLimiterEngine().check(endpoint) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // USAGE METER
    ipcMain.handle('usage:getSummary', async (_, { startTime }: any) => {
        try { const { getUsageMeterEngine } = await import('../usagemeter/UsageMeterEngine'); return { success: true, summary: getUsageMeterEngine().getSummary(startTime) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CREDITS
    ipcMain.handle('credits:getBalance', async () => {
        try { const { getCreditsManagerEngine } = await import('../creditsmgr/CreditsManagerEngine'); return { success: true, balance: getCreditsManagerEngine().getBalance() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL CATALOG
    ipcMain.handle('catalog:getAll', async () => {
        try { const { getModelCatalogEngine } = await import('../modelcatalog/ModelCatalogEngine'); return { success: true, models: getModelCatalogEngine().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BATCH PROCESSOR
    ipcMain.handle('batch:create', async (_, { type, inputs }: any) => {
        try { const { getBatchProcessorEngine } = await import('../batchproc/BatchProcessorEngine'); return { success: true, job: getBatchProcessorEngine().create(type, inputs) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 330+ IPC handlers registered (10 handlers)');
}
