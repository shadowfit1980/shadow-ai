/**
 * Code Review IPC Handlers
 */

import { ipcMain } from 'electron';
import { CodeReviewAgent } from '../ai/review';

export function setupReviewHandlers(): void {
    console.log('🔧 Setting up Review IPC handlers...');

    const reviewer = CodeReviewAgent.getInstance();

    // Review single file
    ipcMain.handle('review:file', async (_, filePath: string) => {
        try {
            const issues = await reviewer.reviewFile(filePath);
            return { success: true, issues };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Review project/directory
    ipcMain.handle('review:project', async (_, params: any) => {
        try {
            const result = await reviewer.reviewProject(params);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get suggestions for an issue
    ipcMain.handle('review:getSuggestions', async (_, issue: any) => {
        return reviewer.getSuggestions(issue);
    });

    // Get review history
    ipcMain.handle('review:getHistory', async (_, limit?: number) => {
        return reviewer.getHistory(limit);
    });

    // Get latest review
    ipcMain.handle('review:getLatest', async () => {
        return reviewer.getLatestReview();
    });

    // Get all rules
    ipcMain.handle('review:getRules', async () => {
        return reviewer.getRules();
    });

    console.log('✅ Review IPC handlers registered');
}
