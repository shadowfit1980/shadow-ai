/**
 * Differentiation Features IPC Handlers
 * 
 * Exposes truly differentiating features:
 * - NaturalLanguageArchitect
 * - CostPredictionEngine
 */

import { ipcMain } from 'electron';

export function registerDifferentiationHandlers(): void {
    console.log('🌟 [IPC] Registering differentiation feature handlers...');

    // ========================================================================
    // NATURAL LANGUAGE ARCHITECT
    // ========================================================================

    ipcMain.handle('architect:generate', async (_, request) => {
        const { naturalLanguageArchitect } = await import('../ai/architecture/NaturalLanguageArchitect');
        return naturalLanguageArchitect.generate(request);
    });

    ipcMain.handle('architect:getArchitecture', async (_, id) => {
        const { naturalLanguageArchitect } = await import('../ai/architecture/NaturalLanguageArchitect');
        return naturalLanguageArchitect.getArchitecture(id);
    });

    ipcMain.handle('architect:getHistory', async () => {
        const { naturalLanguageArchitect } = await import('../ai/architecture/NaturalLanguageArchitect');
        return naturalLanguageArchitect.getHistory();
    });

    // ========================================================================
    // COST PREDICTION ENGINE  
    // ========================================================================

    ipcMain.handle('cost:analyze', async (_, request) => {
        const { costPredictionEngine } = await import('../ai/cost/CostPredictionEngine');
        return costPredictionEngine.analyze(request);
    });

    ipcMain.handle('cost:compare', async (_, before, after) => {
        const { costPredictionEngine } = await import('../ai/cost/CostPredictionEngine');
        return costPredictionEngine.compare(before, after);
    });

    ipcMain.handle('cost:getPrediction', async (_, id) => {
        const { costPredictionEngine } = await import('../ai/cost/CostPredictionEngine');
        return costPredictionEngine.getPrediction(id);
    });

    ipcMain.handle('cost:getHistory', async () => {
        const { costPredictionEngine } = await import('../ai/cost/CostPredictionEngine');
        return costPredictionEngine.getHistory();
    });

    console.log('✅ [IPC] Differentiation feature handlers registered (7 handlers)');
}
