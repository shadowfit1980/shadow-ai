/**
 * Self-Improvement IPC Handlers
 */

import { ipcMain } from 'electron';
import { SelfImprovementLoop } from '../ai/improvement/SelfImprovementLoop';

export function setupImprovementHandlers(): void {
    console.log('🔧 Setting up Improvement IPC handlers...');

    const improvement = SelfImprovementLoop.getInstance();

    // Get all strategies
    ipcMain.handle('improvement:getStrategies', async () => {
        return improvement.getStrategies();
    });

    // Get specific strategy
    ipcMain.handle('improvement:getStrategy', async (_, id: string) => {
        return improvement.getStrategy(id);
    });

    // Add strategy
    ipcMain.handle('improvement:addStrategy', async (_, params: any) => {
        try {
            const strategy = improvement.addStrategy(params);
            return { success: true, strategy };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Select strategy for type
    ipcMain.handle('improvement:selectStrategy', async (_, type: string, experimentId?: string) => {
        return improvement.selectStrategy(type as any, experimentId);
    });

    // Record result
    ipcMain.handle('improvement:recordResult', async (_, params: any) => {
        improvement.recordResult(params);
        return { success: true };
    });

    // Create experiment
    ipcMain.handle('improvement:createExperiment', async (_, params: any) => {
        try {
            const experiment = improvement.createExperiment(params);
            return { success: true, experiment };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get experiments
    ipcMain.handle('improvement:getExperiments', async () => {
        return improvement.getExperiments();
    });

    // Get experiment
    ipcMain.handle('improvement:getExperiment', async (_, id: string) => {
        return improvement.getExperiment(id);
    });

    // Get suggestions
    ipcMain.handle('improvement:getSuggestions', async () => {
        return improvement.getSuggestions();
    });

    // Get stats
    ipcMain.handle('improvement:getStats', async () => {
        return improvement.getStats();
    });

    console.log('✅ Improvement IPC handlers registered');
}
