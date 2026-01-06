/**
 * Sandbox Snapshot IPC Handlers
 * 
 * Exposes SandboxSnapshotManager to renderer
 */

import { ipcMain } from 'electron';
import { SandboxSnapshotManager } from '../ai/sandbox/SandboxSnapshotManager';

export function setupSnapshotHandlers(): void {
    console.log('🔧 Setting up Snapshot IPC handlers...');

    const snapManager = SandboxSnapshotManager.getInstance();
    snapManager.initialize().catch(console.error);

    // Create snapshot
    ipcMain.handle('snapshot:create', async (_, params: any) => {
        try {
            const snapshot = await snapManager.createSnapshot(params);
            return { success: true, snapshot };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get all snapshots
    ipcMain.handle('snapshot:getAll', async () => {
        return snapManager.getAllSnapshots();
    });

    // Get snapshot by ID
    ipcMain.handle('snapshot:get', async (_, id: string) => {
        return snapManager.getSnapshot(id);
    });

    // Restore snapshot
    ipcMain.handle('snapshot:restore', async (_, id: string) => {
        try {
            await snapManager.restoreSnapshot(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete snapshot
    ipcMain.handle('snapshot:delete', async (_, id: string) => {
        return snapManager.deleteSnapshot(id);
    });

    // Compare snapshots
    ipcMain.handle('snapshot:compare', async (_, id1: string, id2: string) => {
        try {
            const diff = snapManager.compareSnapshots(id1, id2);
            return { success: true, diff };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Create branch
    ipcMain.handle('snapshot:createBranch', async (_, name: string, baseSnapshotId?: string) => {
        const branch = snapManager.createBranch(name, baseSnapshotId);
        return { success: true, branch };
    });

    // Switch branch
    ipcMain.handle('snapshot:switchBranch', async (_, branchName: string) => {
        try {
            await snapManager.switchBranch(branchName);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get all branches
    ipcMain.handle('snapshot:getAllBranches', async () => {
        return snapManager.getAllBranches();
    });

    // Get current branch
    ipcMain.handle('snapshot:getCurrentBranch', async () => {
        return snapManager.getCurrentBranch();
    });

    // Get sandbox root
    ipcMain.handle('snapshot:getSandboxRoot', async () => {
        return snapManager.getSandboxRoot();
    });

    console.log('✅ Snapshot IPC handlers registered');
}
