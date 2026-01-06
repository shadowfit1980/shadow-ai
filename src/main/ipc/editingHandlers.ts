/**
 * Editing IPC Handlers
 * 
 * Exposes AtomicEditor functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { AtomicEditor, FileEdit } from '../ai/editing';

export function setupEditingHandlers(): void {
    console.log('🔧 Setting up Editing IPC handlers...');

    const editor = AtomicEditor.getInstance();

    // Set project root
    ipcMain.handle('editing:setProjectRoot', async (_, projectPath: string) => {
        editor.setProjectRoot(projectPath);
        return { success: true };
    });

    // Begin a transaction
    ipcMain.handle('editing:beginTransaction', async (_, edits: FileEdit[]) => {
        try {
            const id = editor.beginTransaction(edits);
            return { success: true, transactionId: id };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Commit current transaction
    ipcMain.handle('editing:commitTransaction', async () => {
        try {
            const result = await editor.commitTransaction();
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Rollback current transaction
    ipcMain.handle('editing:rollbackTransaction', async () => {
        try {
            await editor.rollbackTransaction();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Preview a transaction
    ipcMain.handle('editing:previewTransaction', async (_, edits: FileEdit[]) => {
        try {
            const preview = await editor.previewTransaction(edits);
            return { success: true, preview };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Edit multiple files atomically
    ipcMain.handle('editing:editFilesAtomically', async (_, edits: Array<{ path: string; content: string }>) => {
        try {
            const result = await editor.editFilesAtomically(edits);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Rename file with import updates
    ipcMain.handle('editing:renameFileWithImports', async (_, oldPath: string, newPath: string) => {
        try {
            const result = await editor.renameFileWithImports(oldPath, newPath);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Create multiple files atomically
    ipcMain.handle('editing:createFilesAtomically', async (_, files: Array<{ path: string; content: string }>) => {
        try {
            const result = await editor.createFilesAtomically(files);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete multiple files atomically
    ipcMain.handle('editing:deleteFilesAtomically', async (_, paths: string[]) => {
        try {
            const result = await editor.deleteFilesAtomically(paths);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get transaction history
    ipcMain.handle('editing:getTransactionHistory', async () => {
        return editor.getTransactionHistory();
    });

    // Get last transaction
    ipcMain.handle('editing:getLastTransaction', async () => {
        return editor.getLastTransaction();
    });

    // Check if there's an active transaction
    ipcMain.handle('editing:hasActiveTransaction', async () => {
        return editor.hasActiveTransaction();
    });

    console.log('✅ Editing IPC handlers registered');
}
