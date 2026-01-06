/**
 * Enhancement 110+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement110Handlers(): void {
    // NOTIFICATION HUB
    ipcMain.handle('notifHub:send', async (_, { title, body, type }: any) => {
        try { const { getNotificationHub } = await import('../notification2/NotificationHub'); return { success: true, notification: getNotificationHub().send(title, body, type) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('notifHub:getUnread', async () => {
        try { const { getNotificationHub } = await import('../notification2/NotificationHub'); return { success: true, notifications: getNotificationHub().getUnread() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PERMISSIONS
    ipcMain.handle('permissions:hasPermission', async (_, { userId, permission }: any) => {
        try { const { getPermissionsManager } = await import('../permissions/PermissionsManager'); return { success: true, hasPermission: getPermissionsManager().hasPermission(userId, permission) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('permissions:getRoles', async () => {
        try { const { getPermissionsManager } = await import('../permissions/PermissionsManager'); return { success: true, roles: getPermissionsManager().getRoles() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SECRETS
    ipcMain.handle('secrets:set', async (_, { key, value }: any) => {
        try { const { getSecretsManager } = await import('../secrets/SecretsManager'); getSecretsManager().set(key, value); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('secrets:get', async (_, { key }: any) => {
        try { const { getSecretsManager } = await import('../secrets/SecretsManager'); return { success: true, value: getSecretsManager().get(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('secrets:list', async () => {
        try { const { getSecretsManager } = await import('../secrets/SecretsManager'); return { success: true, keys: getSecretsManager().list() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PREFERENCES
    ipcMain.handle('prefs:get', async (_, { key }: any) => {
        try { const { getPreferencesManager } = await import('../preferences/PreferencesManager'); return { success: true, value: getPreferencesManager().get(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('prefs:set', async (_, { key, value }: any) => {
        try { const { getPreferencesManager } = await import('../preferences/PreferencesManager'); return { success: getPreferencesManager().set(key, value) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('prefs:getAll', async () => {
        try { const { getPreferencesManager } = await import('../preferences/PreferencesManager'); return { success: true, preferences: getPreferencesManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CURSOR
    ipcMain.handle('cursor:setPosition', async (_, { file, line, column }: any) => {
        try { const { getCursorManager } = await import('../cursor/CursorManager'); getCursorManager().setPosition(file, line, column); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('cursor:getHistory', async (_, { limit }: any = {}) => {
        try { const { getCursorManager } = await import('../cursor/CursorManager'); return { success: true, history: getCursorManager().getHistory(limit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SELECTION
    ipcMain.handle('selection:set', async (_, sel: any) => {
        try { const { getSelectionManager } = await import('../selection/SelectionManager'); return { success: true, selection: getSelectionManager().setSelection(sel.file, sel.startLine, sel.startColumn, sel.endLine, sel.endColumn, sel.text) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('selection:get', async (_, { file }: any) => {
        try { const { getSelectionManager } = await import('../selection/SelectionManager'); return { success: true, selection: getSelectionManager().getSelection(file) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 110+ IPC handlers registered (14 handlers)');
}
