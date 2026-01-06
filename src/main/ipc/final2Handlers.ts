/**
 * Final Enhancement IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupFinal2Handlers(): void {
    // I18N
    ipcMain.handle('i18n:setLocale', async (_, { locale }: any) => {
        try { const { getI18nManager } = await import('../i18n/I18nManager'); getI18nManager().setLocale(locale); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('i18n:t', async (_, { key, fallback }: any) => {
        try { const { getI18nManager } = await import('../i18n/I18nManager'); return { success: true, text: getI18nManager().t(key, fallback) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('i18n:getLocales', async () => {
        try { const { getI18nManager } = await import('../i18n/I18nManager'); return { success: true, locales: getI18nManager().getLocales() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DEPLOYMENT
    ipcMain.handle('deployment:create', async (_, { name, environment }: any) => {
        try { const { getDeploymentManager } = await import('../deployment/DeploymentManager'); return { success: true, deployment: getDeploymentManager().create(name, environment) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('deployment:deploy', async (_, { id }: any) => {
        try { const { getDeploymentManager } = await import('../deployment/DeploymentManager'); return { success: await getDeploymentManager().deploy(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('deployment:getAll', async () => {
        try { const { getDeploymentManager } = await import('../deployment/DeploymentManager'); return { success: true, deployments: getDeploymentManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROMPT
    ipcMain.handle('prompt:getAll', async () => {
        try { const { getAIPromptManager } = await import('../prompt/AIPromptManager'); return { success: true, prompts: getAIPromptManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('prompt:render', async (_, { id, vars }: any) => {
        try { const { getAIPromptManager } = await import('../prompt/AIPromptManager'); return { success: true, text: getAIPromptManager().render(id, vars) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WEBSOCKET
    ipcMain.handle('ws:connect', async (_, { url }: any) => {
        try { const { getWebSocketHub } = await import('../websocket/WebSocketHub'); return { success: true, connection: getWebSocketHub().connect(url) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('ws:getConnected', async () => {
        try { const { getWebSocketHub } = await import('../websocket/WebSocketHub'); return { success: true, connections: getWebSocketHub().getConnected() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RATE LIMITER
    ipcMain.handle('ratelimit:check', async (_, { ruleId, key }: any) => {
        try { const { getRateLimiter } = await import('../ratelimit/RateLimiter'); return { success: true, result: getRateLimiter().check(ruleId, key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('ratelimit:getRules', async () => {
        try { const { getRateLimiter } = await import('../ratelimit/RateLimiter'); return { success: true, rules: getRateLimiter().getRules() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Final2 feature IPC handlers registered (12 handlers)');
}
