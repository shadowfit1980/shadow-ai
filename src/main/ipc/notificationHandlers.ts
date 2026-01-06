/**
 * Notification IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import { NotificationService } from '../ai/notification/NotificationService';

export function setupNotificationHandlers(): void {
    console.log('🔧 Setting up Notification IPC handlers...');

    const notifications = NotificationService.getInstance();

    // Forward events to renderer
    notifications.on('notification:created', (notification) => {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('notification:new', notification);
        });
    });

    // Send notification
    ipcMain.handle('notification:send', async (_, params: any) => {
        const notification = notifications.notify(params);
        return notification;
    });

    // Quick helpers
    ipcMain.handle('notification:info', async (_, title: string, message: string) => {
        return notifications.info(title, message);
    });

    ipcMain.handle('notification:success', async (_, title: string, message: string) => {
        return notifications.success(title, message);
    });

    ipcMain.handle('notification:warning', async (_, title: string, message: string) => {
        return notifications.warning(title, message);
    });

    ipcMain.handle('notification:error', async (_, title: string, message: string) => {
        return notifications.error(title, message);
    });

    // Get all
    ipcMain.handle('notification:getAll', async () => {
        return notifications.getAll();
    });

    // Get unread count
    ipcMain.handle('notification:getUnreadCount', async () => {
        return notifications.getUnreadCount();
    });

    // Mark read
    ipcMain.handle('notification:markRead', async (_, id: string) => {
        return notifications.markRead(id);
    });

    // Mark all read
    ipcMain.handle('notification:markAllRead', async () => {
        return notifications.markAllRead();
    });

    // Dismiss
    ipcMain.handle('notification:dismiss', async (_, id: string) => {
        return notifications.dismiss(id);
    });

    // Execute action
    ipcMain.handle('notification:executeAction', async (_, notificationId: string, actionId: string) => {
        notifications.executeAction(notificationId, actionId);
        return { success: true };
    });

    console.log('✅ Notification IPC handlers registered');
}
