/**
 * IPC Handlers for Shadow Memory System
 * 
 * Exposes memory functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { getMemoryEngine } from '../ai/memory';

export function setupMemoryHandlers() {
    console.log('🔧 Setting up Memory IPC handlers...');

    // Initialize memory engine
    ipcMain.handle('memory:initialize', async (_) => {
        try {
            const engine = getMemoryEngine();
            await engine.initialize();
            return { success: true };
        } catch (error: any) {
            console.error('❌ Memory initialization failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Remember something
    ipcMain.handle('memory:remember', async (_, memory: any) => {
        try {
            const engine = getMemoryEngine();
            const id = await engine.remember(memory);
            return { success: true, id };
        } catch (error: any) {
            console.error('❌ Remember failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Recall memories
    ipcMain.handle('memory:recall', async (_, query: string, k?: number, options?: any) => {
        try {
            const engine = getMemoryEngine();
            const memories = await engine.recall(query, k, options);
            return { success: true, memories };
        } catch (error: any) {
            console.error('❌ Recall failed:', error.message);
            return { success: false, error: error.message, memories: [] };
        }
    });

    // Get relevant context
    ipcMain.handle('memory:getContext', async (_, task: string, options?: any) => {
        try {
            const engine = getMemoryEngine();
            const context = await engine.getRelevantContext(task, options);
            return { success: true, context };
        } catch (error: any) {
            console.error('❌ Get context failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Index project
    ipcMain.handle('memory:indexProject', async (event, projectPath: string) => {
        try {
            const engine = getMemoryEngine();

            await engine.indexProject(projectPath, (progress) => {
                // Send progress updates to renderer
                event.sender.send('memory:indexProgress', progress);
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Index project failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Learn coding style
    ipcMain.handle('memory:learnStyle', async (_, projectPath: string) => {
        try {
            const engine = getMemoryEngine();
            const style = await engine.learnCodingStyle(projectPath);
            return { success: true, style };
        } catch (error: any) {
            console.error('❌ Learn style failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Remember decision
    ipcMain.handle('memory:rememberDecision', async (_, decision: any) => {
        try {
            const engine = getMemoryEngine();
            await engine.rememberDecision(decision);
            return { success: true };
        } catch (error: any) {
            console.error('❌ Remember decision failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Find similar code
    ipcMain.handle('memory:findSimilarCode', async (_, codeSnippet: string, limit?: number) => {
        try {
            const engine = getMemoryEngine();
            const matches = await engine.findSimilarCode(codeSnippet, limit);
            return { success: true, matches };
        } catch (error: any) {
            console.error('❌ Find similar code failed:', error.message);
            return { success: false, error: error.message, matches: [] };
        }
    });

    // Search decisions
    ipcMain.handle('memory:searchDecisions', async (_, topic: string, limit?: number) => {
        try {
            const engine = getMemoryEngine();
            const decisions = await engine.searchDecisions(topic, limit);
            return { success: true, decisions };
        } catch (error: any) {
            console.error('❌ Search decisions failed:', error.message);
            return { success: false, error: error.message, decisions: [] };
        }
    });

    // Get stats
    ipcMain.handle('memory:getStats', async (_) => {
        try {
            const engine = getMemoryEngine();
            const stats = await engine.getStats();
            return { success: true, stats };
        } catch (error: any) {
            console.error('❌ Get stats failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Forget memory
    ipcMain.handle('memory:forget', async (_, memoryId: string) => {
        try {
            const engine = getMemoryEngine();
            await engine.forget(memoryId);
            return { success: true };
        } catch (error: any) {
            console.error('❌ Forget failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    // Clear all memories
    ipcMain.handle('memory:clearAll', async (_) => {
        try {
            const engine = getMemoryEngine();
            await engine.clearAll();
            return { success: true };
        } catch (error: any) {
            console.error('❌ Clear all failed:', error.message);
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Memory IPC handlers registered');
}
