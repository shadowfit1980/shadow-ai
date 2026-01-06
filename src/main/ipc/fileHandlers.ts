/**
 * File Handling IPC Handlers
 * 
 * Exposes file operations to the renderer process
 */

import { ipcMain } from 'electron';
import { getFileHandler } from '../services/FileHandler';

export function setupFileIPCHandlers() {
    const fileHandler = getFileHandler();

    /**
     * Download a file from URL
     */
    ipcMain.handle('file:download', async (_, url: string, customFileName?: string) => {
        try {
            const result = await fileHandler.downloadFile(url, customFileName);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get web page content
     */
    ipcMain.handle('file:getWebContent', async (_, url: string) => {
        try {
            const result = await fileHandler.getWebContent(url);
            return result;
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get file information
     */
    ipcMain.handle('file:getInfo', async (_, filePath: string) => {
        try {
            const info = await fileHandler.getFileInfo(filePath);
            return { success: true, info };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Check if string is a URL
     */
    ipcMain.handle('file:isUrl', async (_, str: string) => {
        return fileHandler.isUrl(str);
    });

    /**
     * List downloaded files
     */
    ipcMain.handle('file:listDownloads', async () => {
        try {
            const files = await fileHandler.listDownloads();
            return { success: true, files };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    /**
     * Get/Set download path
     */
    ipcMain.handle('file:getDownloadPath', async () => {
        return fileHandler.getDownloadPath();
    });

    ipcMain.handle('file:setDownloadPath', async (_, newPath: string) => {
        try {
            fileHandler.setDownloadPath(newPath);
            return { success: true, path: newPath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ File IPC handlers registered');
}
