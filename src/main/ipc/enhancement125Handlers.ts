/**
 * Enhancement 125+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement125Handlers(): void {
    // CODE SNIPPETS
    ipcMain.handle('snippets2:add', async (_, { name, language, code, tags }: any) => {
        try { const { getCodeSnippetsLibrary } = await import('../snippets2/CodeSnippetsLibrary'); return { success: true, snippet: getCodeSnippetsLibrary().add(name, language, code, tags) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('snippets2:search', async (_, { query }: any) => {
        try { const { getCodeSnippetsLibrary } = await import('../snippets2/CodeSnippetsLibrary'); return { success: true, snippets: getCodeSnippetsLibrary().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('snippets2:getPopular', async (_, { limit }: any = {}) => {
        try { const { getCodeSnippetsLibrary } = await import('../snippets2/CodeSnippetsLibrary'); return { success: true, snippets: getCodeSnippetsLibrary().getPopular(limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AI MODELS
    ipcMain.handle('aimodels:getAll', async () => {
        try { const { getAIModelRegistry } = await import('../aimodels/AIModelRegistry'); return { success: true, models: getAIModelRegistry().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('aimodels:getByProvider', async (_, { provider }: any) => {
        try { const { getAIModelRegistry } = await import('../aimodels/AIModelRegistry'); return { success: true, models: getAIModelRegistry().getByProvider(provider) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EXTENSIONS
    ipcMain.handle('extensions:install', async (_, ext: any) => {
        try { const { getExtensionManager } = await import('../extensions/ExtensionManager'); return { success: true, extension: getExtensionManager().install(ext) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('extensions:getEnabled', async () => {
        try { const { getExtensionManager } = await import('../extensions/ExtensionManager'); return { success: true, extensions: getExtensionManager().getEnabled() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MARKETPLACE
    ipcMain.handle('marketplace:search', async (_, { query }: any) => {
        try { const { getMarketplaceManager } = await import('../marketplace/MarketplaceManager'); return { success: true, items: getMarketplaceManager().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('marketplace:getPopular', async (_, { limit }: any = {}) => {
        try { const { getMarketplaceManager } = await import('../marketplace/MarketplaceManager'); return { success: true, items: getMarketplaceManager().getPopular(limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // UPDATES
    ipcMain.handle('updates:check', async () => {
        try { const { getUpdateManager } = await import('../updates/UpdateManager'); return { success: true, update: await getUpdateManager().checkForUpdates() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('updates:download', async () => {
        try { const { getUpdateManager } = await import('../updates/UpdateManager'); return { success: await getUpdateManager().downloadUpdate() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('updates:getVersion', async () => {
        try { const { getUpdateManager } = await import('../updates/UpdateManager'); return { success: true, version: getUpdateManager().getCurrentVersion() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 125+ IPC handlers registered (12 handlers)');
}
