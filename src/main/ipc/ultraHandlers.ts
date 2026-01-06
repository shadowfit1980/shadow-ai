/**
 * Ultra Feature IPC Handlers
 */

import { ipcMain } from 'electron';

let hotkeyManager: any = null;
let historyManager: any = null;
let eventBus: any = null;
let pluginRegistry: any = null;

export function setupUltraHandlers(): void {
    // === HOTKEY MANAGER ===
    ipcMain.handle('hotkey:getAll', async () => {
        try {
            const hm = hotkeyManager || (hotkeyManager = (await import('../hotkeys/HotkeyManager')).getHotkeyManager());
            return { success: true, hotkeys: hm.getAll().map((h: any) => ({ id: h.id, keys: h.keys, action: h.action, enabled: h.enabled })) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('hotkey:enable', async (_, { id }: any) => {
        try {
            const hm = hotkeyManager || (hotkeyManager = (await import('../hotkeys/HotkeyManager')).getHotkeyManager());
            return { success: hm.enable(id) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('hotkey:disable', async (_, { id }: any) => {
        try {
            const hm = hotkeyManager || (hotkeyManager = (await import('../hotkeys/HotkeyManager')).getHotkeyManager());
            return { success: hm.disable(id) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === HISTORY MANAGER ===
    ipcMain.handle('history:undo', async () => {
        try {
            const hm = historyManager || (historyManager = (await import('../history/HistoryManager')).getHistoryManager());
            const action = hm.undo();
            return { success: !!action, action };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('history:redo', async () => {
        try {
            const hm = historyManager || (historyManager = (await import('../history/HistoryManager')).getHistoryManager());
            const action = hm.redo();
            return { success: !!action, action };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('history:getAll', async () => {
        try {
            const hm = historyManager || (historyManager = (await import('../history/HistoryManager')).getHistoryManager());
            return { success: true, history: hm.getHistory(), canUndo: hm.canUndo(), canRedo: hm.canRedo() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === EVENT BUS ===
    ipcMain.handle('bus:publish', async (_, { topic, payload, source }: any) => {
        try {
            const eb = eventBus || (eventBus = (await import('../eventbus/EventBus')).getEventBus());
            eb.publish(topic, payload, source);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bus:getHistory', async (_, { topic }: any = {}) => {
        try {
            const eb = eventBus || (eventBus = (await import('../eventbus/EventBus')).getEventBus());
            return { success: true, events: eb.getHistory(topic) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('bus:getTopics', async () => {
        try {
            const eb = eventBus || (eventBus = (await import('../eventbus/EventBus')).getEventBus());
            return { success: true, topics: eb.getTopics() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === PLUGIN REGISTRY ===
    ipcMain.handle('plugins:getAll', async () => {
        try {
            const pr = pluginRegistry || (pluginRegistry = (await import('../plugins/PluginRegistry')).getPluginRegistry());
            return { success: true, plugins: pr.getAll().map((p: any) => ({ id: p.id, name: p.name, version: p.version, enabled: p.enabled })) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('plugins:enable', async (_, { id }: any) => {
        try {
            const pr = pluginRegistry || (pluginRegistry = (await import('../plugins/PluginRegistry')).getPluginRegistry());
            return { success: await pr.enable(id) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('plugins:disable', async (_, { id }: any) => {
        try {
            const pr = pluginRegistry || (pluginRegistry = (await import('../plugins/PluginRegistry')).getPluginRegistry());
            return { success: await pr.disable(id) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Ultra feature IPC handlers registered (12 handlers)');
}
