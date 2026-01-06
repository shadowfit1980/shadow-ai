/**
 * Learning IPC Handlers
 * 
 * Exposes CrossProjectLearning to renderer
 */

import { ipcMain } from 'electron';
import { CrossProjectLearning } from '../ai/learning';

export function setupLearningHandlers(): void {
    console.log('🔧 Setting up Learning IPC handlers...');

    const learning = CrossProjectLearning.getInstance();

    // Get all patterns
    ipcMain.handle('learning:getAllPatterns', async () => {
        return learning.getAllPatterns();
    });

    // Get pattern by ID
    ipcMain.handle('learning:getPattern', async (_, id: string) => {
        return learning.getPattern(id);
    });

    // Get patterns by type
    ipcMain.handle('learning:getPatternsByType', async (_, type: string) => {
        return learning.getPatternsByType(type as any);
    });

    // Find patterns matching context
    ipcMain.handle('learning:findPatterns', async (_, params: any) => {
        return learning.findPatterns(params);
    });

    // Apply pattern
    ipcMain.handle('learning:applyPattern', async (_, patternId: string, params: any) => {
        try {
            const code = learning.applyPattern(patternId, params);
            return { success: true, code };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Add pattern
    ipcMain.handle('learning:addPattern', async (_, pattern: any) => {
        const newPattern = learning.addPattern(pattern);
        return { success: true, pattern: newPattern };
    });

    // Record feedback
    ipcMain.handle('learning:recordFeedback', async (_, patternId: string, success: boolean) => {
        learning.recordFeedback(patternId, success);
        return { success: true };
    });

    // Extract patterns from project
    ipcMain.handle('learning:extractFromProject', async (_, params: any) => {
        try {
            const result = await learning.extractPatternsFromProject(params);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get project learnings
    ipcMain.handle('learning:getProjectLearnings', async () => {
        return learning.getProjectLearnings();
    });

    console.log('✅ Learning IPC handlers registered');
}
