/**
 * Webhook IPC Handlers
 * 
 * IPC handlers for notification webhooks
 */

import { ipcMain } from 'electron';
import { NotificationWebhooks } from '../services/NotificationWebhooks';

export function registerWebhookHandlers() {
    const webhooks = NotificationWebhooks.getInstance();

    ipcMain.handle('webhooks:register', async (_, config) => {
        return webhooks.registerWebhook(config);
    });

    ipcMain.handle('webhooks:update', async (_, id, updates) => {
        return webhooks.updateWebhook(id, updates);
    });

    ipcMain.handle('webhooks:remove', async (_, id) => {
        return webhooks.removeWebhook(id);
    });

    ipcMain.handle('webhooks:getAll', async () => {
        return webhooks.getWebhooks();
    });

    ipcMain.handle('webhooks:toggle', async (_, id) => {
        return webhooks.toggleWebhook(id);
    });

    ipcMain.handle('webhooks:notify', async (_, payload) => {
        return webhooks.notify(payload);
    });

    ipcMain.handle('webhooks:test', async (_, id) => {
        return webhooks.testWebhook(id);
    });

    ipcMain.handle('webhooks:getHistory', async (_, limit) => {
        return webhooks.getHistory(limit);
    });

    ipcMain.handle('webhooks:clearHistory', async () => {
        webhooks.clearHistory();
        return true;
    });
}
