/**
 * Persistent Memory IPC Handlers
 */

import { ipcMain } from 'electron';
import { PersistentMemory } from '../ai/memory/PersistentMemory';

export function setupPersistentMemoryHandlers(): void {
    console.log('🔧 Setting up Persistent Memory IPC handlers...');

    const memory = PersistentMemory.getInstance();

    // Store memory
    ipcMain.handle('memory:store', async (_, params: any) => {
        try {
            const entry = await memory.store(params);
            return { success: true, entry };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Retrieve by key
    ipcMain.handle('memory:retrieve', async (_, key: string) => {
        return memory.retrieve(key);
    });

    // Query memories
    ipcMain.handle('memory:query', async (_, query: any) => {
        return memory.query(query);
    });

    // Update memory
    ipcMain.handle('memory:update', async (_, id: string, value: any, metadata?: any) => {
        return memory.update(id, value, metadata);
    });

    // Delete memory
    ipcMain.handle('memory:delete', async (_, id: string) => {
        return memory.delete(id);
    });

    // Set preference
    ipcMain.handle('memory:setPreference', async (_, key: string, value: any) => {
        await memory.setPreference(key, value);
        return { success: true };
    });

    // Get preference
    ipcMain.handle('memory:getPreference', async (_, key: string, defaultValue?: any) => {
        return memory.getPreference(key, defaultValue);
    });

    // Remember solution
    ipcMain.handle('memory:rememberSolution', async (_, params: any) => {
        return memory.rememberSolution(params);
    });

    // Find similar solutions
    ipcMain.handle('memory:findSolutions', async (_, problem: string) => {
        return memory.findSimilarSolutions(problem);
    });

    // Get stats
    ipcMain.handle('persistentMemory:getStats', async () => {
        return memory.getStats();
    });

    // Consolidate
    ipcMain.handle('memory:consolidate', async () => {
        return memory.consolidate();
    });

    // Export
    ipcMain.handle('memory:export', async () => {
        return memory.exportMemories();
    });

    // Import
    ipcMain.handle('memory:import', async (_, entries: any[]) => {
        return memory.importMemories(entries);
    });

    console.log('✅ Persistent Memory IPC handlers registered');
}
