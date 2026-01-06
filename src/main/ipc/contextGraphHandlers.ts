/**
 * Context Graph IPC Handlers
 */

import { ipcMain } from 'electron';
import { ProjectContextGraph } from '../ai/context';

export function setupContextGraphHandlers(): void {
    console.log('🔧 Setting up Context Graph IPC handlers...');

    const graph = ProjectContextGraph.getInstance();

    // Build graph for a project
    ipcMain.handle('contextGraph:build', async (_, projectPath: string) => {
        try {
            const stats = await graph.buildGraph(projectPath);
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get impact analysis for a file
    ipcMain.handle('contextGraph:getImpact', async (_, filePath: string) => {
        return graph.getImpactAnalysis(filePath);
    });

    // Find symbol usages
    ipcMain.handle('contextGraph:findUsages', async (_, symbolName: string) => {
        return graph.findSymbolUsages(symbolName);
    });

    // Get graph stats
    ipcMain.handle('contextGraph:getStats', async () => {
        return graph.getStats();
    });

    // Get file node
    ipcMain.handle('contextGraph:getNode', async (_, relativePath: string) => {
        return graph.getNode(relativePath);
    });

    // Get all nodes
    ipcMain.handle('contextGraph:getAllNodes', async () => {
        return graph.getAllNodes();
    });

    // Get dependencies for a file
    ipcMain.handle('contextGraph:getDependencies', async (_, relativePath: string) => {
        return graph.getDependencies(relativePath);
    });

    console.log('✅ Context Graph IPC handlers registered');
}
