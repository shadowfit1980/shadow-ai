/**
 * Local Model IPC Handlers
 * 
 * IPC handlers for LocalModelManager and ModelDownloadManager
 */

import { ipcMain, dialog } from 'electron';
import { LocalModelManager } from '../ai/providers/LocalModelManager';
import { ModelDownloadManager } from '../ai/providers/ModelDownloadManager';

export function registerLocalModelHandlers() {
    const manager = LocalModelManager.getInstance();
    const downloadManager = ModelDownloadManager.getInstance();

    // ===== Ollama Status & Operations =====
    ipcMain.handle('localModel:checkStatus', async () => {
        return manager.checkOllamaStatus();
    });

    ipcMain.handle('localModel:listModels', async () => {
        return manager.listModels();
    });

    ipcMain.handle('localModel:pullModel', async (_, modelName) => {
        return manager.pullModel(modelName);
    });

    ipcMain.handle('localModel:deleteModel', async (_, modelName) => {
        return manager.deleteModel(modelName);
    });

    ipcMain.handle('localModel:chat', async (_, modelName, messages, options) => {
        return manager.chat(modelName, messages, options);
    });

    ipcMain.handle('localModel:embed', async (_, modelName, text) => {
        return manager.embed(modelName, text);
    });

    ipcMain.handle('localModel:startOllama', async () => {
        return manager.startOllama();
    });

    ipcMain.handle('localModel:isInstalled', async () => {
        return manager.isOllamaInstalled();
    });

    ipcMain.handle('localModel:getRecommended', async () => {
        return manager.getRecommendedModels();
    });

    ipcMain.handle('localModel:isRunning', async () => {
        return manager.isRunning();
    });

    // ===== Settings Management =====
    ipcMain.handle('localModel:getSettings', async () => {
        return manager.getSettings();
    });

    ipcMain.handle('localModel:updateSettings', async (_, settings) => {
        manager.updateSettings(settings);
        return manager.getSettings();
    });

    ipcMain.handle('localModel:setStoragePath', async (_, path) => {
        manager.setStoragePath(path);
        downloadManager.setStoragePath(path);
        return path;
    });

    ipcMain.handle('localModel:getStoragePath', async () => {
        return manager.getStoragePath();
    });

    ipcMain.handle('localModel:selectStorageFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Model Storage Folder',
        });
        if (!result.canceled && result.filePaths.length > 0) {
            const path = result.filePaths[0];
            manager.setStoragePath(path);
            downloadManager.setStoragePath(path);
            return path;
        }
        return null;
    });

    // ===== Model Browser & Download =====
    ipcMain.handle('localModel:browseModels', async (_, source, search) => {
        return downloadManager.browseModels(source, search);
    });

    ipcMain.handle('localModel:getInstalledModels', async () => {
        return downloadManager.getInstalledModels();
    });

    ipcMain.handle('localModel:downloadModel', async (_, modelId) => {
        return downloadManager.downloadModel(modelId);
    });

    ipcMain.handle('localModel:cancelDownload', async (_, modelId) => {
        return downloadManager.cancelDownload(modelId);
    });

    ipcMain.handle('localModel:getDownloadProgress', async (_, modelId) => {
        return downloadManager.getDownloadProgress(modelId);
    });

    ipcMain.handle('localModel:getActiveDownloads', async () => {
        return downloadManager.getActiveDownloads();
    });

    ipcMain.handle('localModel:deleteLocalModel', async (_, modelId) => {
        return downloadManager.deleteModel(modelId);
    });

    ipcMain.handle('localModel:getStorageInfo', async () => {
        return downloadManager.getStorageInfo();
    });

    ipcMain.handle('localModel:scanDirectory', async (_, dirPath) => {
        return downloadManager.scanDirectory(dirPath);
    });

    ipcMain.handle('localModel:selectAndScanFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Folder to Scan for Models',
        });
        if (!result.canceled && result.filePaths.length > 0) {
            return downloadManager.scanDirectory(result.filePaths[0]);
        }
        return [];
    });

    // Forward download events to renderer
    downloadManager.on('download:started', (progress) => {
        // Emit to all windows if needed
    });
    downloadManager.on('download:progress', (progress) => {
        // Emit to all windows if needed
    });
    downloadManager.on('download:completed', (progress) => {
        // Emit to all windows if needed
    });
    downloadManager.on('download:error', (data) => {
        // Emit to all windows if needed
    });
}

