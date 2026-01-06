/**
 * Cloud Sync IPC Handlers
 */

import { ipcMain } from 'electron';
import CloudSyncService from '../services/CloudSyncService';

export function registerCloudSyncHandlers(): void {
    const sync = CloudSyncService.getInstance();

    // Configure sync
    ipcMain.handle('sync:configure', async (_event, config: any) => {
        sync.configure(config);
        return { success: true };
    });

    // Sync now
    ipcMain.handle('sync:now', async () => {
        return sync.sync();
    });

    // Get status
    ipcMain.handle('sync:getStatus', async () => {
        return sync.getStatus();
    });

    // Get item count
    ipcMain.handle('sync:getItemCount', async () => {
        return sync.getItemCount();
    });

    // Add item
    ipcMain.handle('sync:addItem', async (_event, type: string, id: string, data: any) => {
        return sync.addItem(type as any, id, data);
    });

    // Get item
    ipcMain.handle('sync:getItem', async (_event, id: string) => {
        return sync.getItem(id);
    });

    // Delete item
    ipcMain.handle('sync:deleteItem', async (_event, id: string) => {
        return sync.deleteItem(id);
    });

    // Get items by type
    ipcMain.handle('sync:getItemsByType', async (_event, type: string) => {
        return sync.getItemsByType(type as any);
    });

    // Export memories
    ipcMain.handle('sync:exportMemories', async () => {
        return sync.exportMemories();
    });

    // Import memories
    ipcMain.handle('sync:importMemories', async (_event, jsonData: string) => {
        return sync.importMemories(jsonData);
    });

    // Resolve conflict
    ipcMain.handle('sync:resolveConflict', async (_event, itemId: string, resolution: string, mergedData?: any) => {
        await sync.resolveConflict(itemId, resolution as any, mergedData);
        return { success: true };
    });

    // Start auto sync
    ipcMain.handle('sync:startAutoSync', async (_event, intervalMinutes: number) => {
        sync.startAutoSync(intervalMinutes);
        return { success: true };
    });

    // Stop auto sync
    ipcMain.handle('sync:stopAutoSync', async () => {
        sync.stopAutoSync();
        return { success: true };
    });

    console.log('☁️ Cloud Sync IPC handlers registered');
}
