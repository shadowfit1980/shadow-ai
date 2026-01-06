/**
 * Context IPC Handlers
 * 
 * Exposes ProjectContext functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { ProjectContext } from '../ai/context';

export function setupContextHandlers(): void {
    console.log('🔧 Setting up Context IPC handlers...');

    const context = ProjectContext.getInstance();

    // Index a project
    ipcMain.handle('context:indexProject', async (_, projectPath: string) => {
        try {
            const summary = await context.indexProject(projectPath);
            return { success: true, summary };
        } catch (error: any) {
            console.error('Context indexing error:', error);
            return { success: false, error: error.message };
        }
    });

    // Get project architecture
    ipcMain.handle('context:getArchitecture', async () => {
        return context.getArchitecture();
    });

    // Get all indexed files
    ipcMain.handle('context:getAllFiles', async () => {
        return context.getAllFiles();
    });

    // Get dependencies of a file
    ipcMain.handle('context:getDependencies', async (_, filePath: string) => {
        return context.getDependencies(filePath);
    });

    // Get dependents of a file
    ipcMain.handle('context:getDependents', async (_, filePath: string) => {
        return context.getDependents(filePath);
    });

    // Get related files
    ipcMain.handle('context:getRelatedFiles', async (_, filePath: string, maxDepth?: number) => {
        return context.getRelatedFiles(filePath, maxDepth);
    });

    // Get file group (by directory)
    ipcMain.handle('context:getFileGroup', async (_, directory: string) => {
        return context.getFileGroup(directory);
    });

    // Get AI-consumable context
    ipcMain.handle('context:getAIContext', async (_, focusFiles?: string[]) => {
        return context.getAIContext(focusFiles);
    });

    // Check if indexed
    ipcMain.handle('context:isIndexed', async () => {
        return context.isProjectIndexed();
    });

    // Get indexing progress
    ipcMain.handle('context:getProgress', async () => {
        return context.getIndexProgress();
    });

    console.log('✅ Context IPC handlers registered');
}
