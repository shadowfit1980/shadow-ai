/**
 * Enhancement 116+ IPC Handlers
 */

import { ipcMain } from 'electron';

export function setupEnhancement116Handlers(): void {
    // FILE TREE
    ipcMain.handle('filetree:get', async (_, { path, depth }: any) => {
        try { const { getFileTreeManager } = await import('../filetree/FileTreeManager'); return { success: true, tree: await getFileTreeManager().getTree(path, depth) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // WORKSPACE
    ipcMain.handle('workspace:create', async (_, { name, paths }: any) => {
        try { const { getWorkspaceManager } = await import('../workspace/WorkspaceManager'); return { success: true, workspace: getWorkspaceManager().create(name, paths) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('workspace:getCurrent', async () => {
        try { const { getWorkspaceManager } = await import('../workspace/WorkspaceManager'); return { success: true, workspace: getWorkspaceManager().getCurrent() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('workspace:getAll', async () => {
        try { const { getWorkspaceManager } = await import('../workspace/WorkspaceManager'); return { success: true, workspaces: getWorkspaceManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROJECT
    ipcMain.handle('project:register', async (_, { name, path, type }: any) => {
        try { const { getProjectManager } = await import('../project/ProjectManager'); return { success: true, project: getProjectManager().register(name, path, type) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('project:getAll', async () => {
        try { const { getProjectManager } = await import('../project/ProjectManager'); return { success: true, projects: getProjectManager().getAll() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DATABASE
    ipcMain.handle('db:createTable', async (_, { name, columns }: any) => {
        try { const { getDatabaseManager } = await import('../database/DatabaseManager'); getDatabaseManager().createTable(name, columns); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('db:insert', async (_, { table, row }: any) => {
        try { const { getDatabaseManager } = await import('../database/DatabaseManager'); return { success: getDatabaseManager().insert(table, row) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('db:select', async (_, { table }: any) => {
        try { const { getDatabaseManager } = await import('../database/DatabaseManager'); return { success: true, rows: getDatabaseManager().select(table) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // STORAGE
    ipcMain.handle('storage:set', async (_, { key, value }: any) => {
        try { const { getStorageManager } = await import('../storage/StorageManager'); await getStorageManager().set(key, value); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('storage:get', async (_, { key }: any) => {
        try { const { getStorageManager } = await import('../storage/StorageManager'); return { success: true, value: getStorageManager().get(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // LRU CACHE
    ipcMain.handle('lru:set', async (_, { key, value }: any) => {
        try { const { getLRUCache } = await import('../cache2/LRUCache'); getLRUCache().set(key, value); return { success: true }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('lru:get', async (_, { key }: any) => {
        try { const { getLRUCache } = await import('../cache2/LRUCache'); return { success: true, value: getLRUCache().get(key) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 116+ IPC handlers registered (13 handlers)');
}
