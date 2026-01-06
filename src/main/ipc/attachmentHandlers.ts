/**
 * File Attachment IPC Handlers
 * 
 * Exposes FileAttachmentHandler to the renderer process
 */

import { ipcMain, dialog } from 'electron';
import { fileAttachmentHandler } from '../attachments/FileAttachmentHandler';

export function registerAttachmentHandlers(): void {
    // Process file from path
    ipcMain.handle('attachment:processFile', async (_, filePath: string) => {
        try {
            return await fileAttachmentHandler.processFile(filePath);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Process URL
    ipcMain.handle('attachment:processUrl', async (_, url: string) => {
        try {
            return await fileAttachmentHandler.processUrl(url);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Process clipboard data
    ipcMain.handle('attachment:processClipboard', async (_, data: any) => {
        try {
            return await fileAttachmentHandler.processClipboard(data);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Open file dialog
    ipcMain.handle('attachment:openDialog', async (event) => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                {
                    name: 'All Supported', extensions: [
                        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
                        'pdf',
                        'txt', 'md', 'json', 'xml', 'yaml', 'yml',
                        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h',
                        'html', 'css', 'scss', 'sql', 'sh',
                        'doc', 'docx'
                    ]
                },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'] },
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
                { name: 'Code', extensions: ['js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { canceled: true, files: [] };
        }

        // Process all selected files
        const results = await Promise.all(
            result.filePaths.map(fp => fileAttachmentHandler.processFile(fp))
        );

        return { canceled: false, files: results };
    });

    // Get attachment by ID
    ipcMain.handle('attachment:get', async (_, id: string) => {
        return fileAttachmentHandler.getAttachment(id);
    });

    // Get all attachments
    ipcMain.handle('attachment:getAll', async () => {
        return fileAttachmentHandler.getAllAttachments();
    });

    // Remove attachment
    ipcMain.handle('attachment:remove', async (_, id: string) => {
        return fileAttachmentHandler.removeAttachment(id);
    });

    // Clear all
    ipcMain.handle('attachment:clearAll', async () => {
        fileAttachmentHandler.clearAll();
        return { success: true };
    });

    // Get context string
    ipcMain.handle('attachment:getContext', async () => {
        return fileAttachmentHandler.getContextString();
    });

    // Get images for vision
    ipcMain.handle('attachment:getImagesForVision', async () => {
        return fileAttachmentHandler.getImagesForVision();
    });

    // Get stats
    ipcMain.handle('attachment:stats', async () => {
        return fileAttachmentHandler.getStats();
    });

    console.log('[IPC] Registered file attachment handlers (11 handlers)');
}
