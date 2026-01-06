/**
 * Enhancement 210+ IPC Handlers - VSCodium-inspired IDE features
 */

import { ipcMain } from 'electron';

export function setupEnhancement210Handlers(): void {
    // PRIVACY
    ipcMain.handle('privacy:set', async (_, { name, enabled }: any) => {
        try { const { getPrivacyManager } = await import('../privacymgr/PrivacyManager'); return { success: getPrivacyManager().set(name, enabled) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('privacy:getAll', async () => {
        try { const { getPrivacyManager } = await import('../privacymgr/PrivacyManager'); return { success: true, settings: getPrivacyManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TELEMETRY
    ipcMain.handle('telemetry:setEnabled', async (_, { enabled }: any) => {
        try { const { getTelemetryControl } = await import('../telemetryctl/TelemetryControl'); getTelemetryControl().setEnabled(enabled); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // EXTENSION STORE
    ipcMain.handle('extstore:search', async (_, { query }: any) => {
        try { const { getExtensionStore } = await import('../extensionstore/ExtensionStore'); return { success: true, extensions: getExtensionStore().search(query) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('extstore:install', async (_, { id }: any) => {
        try { const { getExtensionStore } = await import('../extensionstore/ExtensionStore'); return { success: getExtensionStore().install(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SETTINGS SYNC
    ipcMain.handle('settingssync:sync', async (_, { profileId }: any) => {
        try { const { getSettingsSyncManager } = await import('../settingssync2/SettingsSyncManager'); return { success: await getSettingsSyncManager().sync(profileId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // THEME ENGINE
    ipcMain.handle('theme:setActive', async (_, { themeId }: any) => {
        try { const { getThemeEngine } = await import('../themeengine/ThemeEngine'); return { success: getThemeEngine().setActive(themeId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('theme:getAll', async () => {
        try { const { getThemeEngine } = await import('../themeengine/ThemeEngine'); return { success: true, themes: getThemeEngine().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LANGUAGE SERVER
    ipcMain.handle('lsp:start', async (_, { id }: any) => {
        try { const { getLanguageServerManager } = await import('../langserver/LanguageServerManager'); return { success: await getLanguageServerManager().start(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // OUTLINE
    ipcMain.handle('outline:parse', async (_, { file, code }: any) => {
        try { const { getOutlineViewManager } = await import('../outlineview/OutlineViewManager'); return { success: true, outline: await getOutlineViewManager().parse(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BREADCRUMB
    ipcMain.handle('breadcrumb:setPath', async (_, { filePath, symbol }: any) => {
        try { const { getBreadcrumbNavigation } = await import('../breadcrumb/BreadcrumbNavigation'); return { success: true, breadcrumbs: getBreadcrumbNavigation().setPath(filePath, symbol) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MINIMAP
    ipcMain.handle('minimap:toggle', async () => {
        try { const { getMiniMapManager } = await import('../minimap/MiniMapManager'); return { success: true, enabled: getMiniMapManager().toggle() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROBLEMS
    ipcMain.handle('problems:add', async (_, { file, line, column, severity, message, source }: any) => {
        try { const { getProblemPanelManager } = await import('../problempanel/ProblemPanelManager'); return { success: true, problem: getProblemPanelManager().add(file, line, column, severity, message, source) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('problems:getStats', async () => {
        try { const { getProblemPanelManager } = await import('../problempanel/ProblemPanelManager'); return { success: true, stats: getProblemPanelManager().getStats() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 210+ IPC handlers registered (14 handlers)');
}
