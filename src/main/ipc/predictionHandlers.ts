/**
 * Prediction IPC Handlers
 * IPC bridge for edit prediction between renderer and main process
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { EditorContext, Position } from '../ai/completion/types';

// Lazy-loaded prediction engines
let predictionEngine: any = null;
let patternAnalyzer: any = null;

async function getPredictionEngine() {
    if (!predictionEngine) {
        try {
            const { getEditPredictionEngine } = await import('../ai/prediction/EditPredictionEngine');
            predictionEngine = getEditPredictionEngine();
        } catch (error) {
            console.warn('⚠️ EditPredictionEngine not available:', (error as Error).message);
            return null;
        }
    }
    return predictionEngine;
}

async function getPatternAnalyzer() {
    if (!patternAnalyzer) {
        try {
            const { getEditPatternAnalyzer } = await import('../ai/prediction/EditPatternAnalyzer');
            patternAnalyzer = getEditPatternAnalyzer();
        } catch (error) {
            console.warn('⚠️ EditPatternAnalyzer not available:', (error as Error).message);
            return null;
        }
    }
    return patternAnalyzer;
}

/**
 * Setup all prediction-related IPC handlers
 */
export function setupPredictionHandlers(): void {
    // Track edit event
    ipcMain.handle('prediction:trackEdit', async (_, edit: any) => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            engine.trackEdit(edit);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Track cursor movement
    ipcMain.handle('prediction:trackCursor', async (_, movement: any) => {
        try {
            const analyzer = await getPatternAnalyzer();
            if (!analyzer) return { success: false, error: 'Pattern analyzer not available' };
            analyzer.trackCursorMovement(movement);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get predictions for context
    ipcMain.handle('prediction:get', async (_, context: EditorContext) => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const predictions = await engine.predictNextEdit(context);
            return { success: true, predictions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Navigate to next prediction
    ipcMain.handle('prediction:next', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const prediction = engine.navigateToNext();
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Navigate to previous prediction
    ipcMain.handle('prediction:previous', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const prediction = engine.navigateToPrevious();
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Accept current prediction
    ipcMain.handle('prediction:accept', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const prediction = engine.acceptPrediction();
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Reject current prediction
    ipcMain.handle('prediction:reject', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            engine.rejectPrediction();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Clear predictions
    ipcMain.handle('prediction:clear', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            engine.clearPredictions();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get active predictions
    ipcMain.handle('prediction:active', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const predictions = engine.getActivePredictions();
            return { success: true, predictions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get current prediction
    ipcMain.handle('prediction:current', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const prediction = engine.getCurrentPrediction();
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get edit history
    ipcMain.handle('prediction:history', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            const history = engine.getEditHistory();
            return { success: true, history };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Analyze patterns
    ipcMain.handle('prediction:analyze', async (_, context: EditorContext) => {
        try {
            const analyzer = await getPatternAnalyzer();
            const engine = await getPredictionEngine();
            if (!analyzer || !engine) {
                return { success: false, error: 'Analyzers not available' };
            }

            const history = engine.getEditHistory();
            const analysis = analyzer.analyzeEditPatterns(history, context);
            return { success: true, analysis };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Configuration
    ipcMain.handle('prediction:config:get', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            return { success: true, config: engine.getConfig() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prediction:config:set', async (_, config: any) => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            engine.setConfig(config);
            return { success: true, config: engine.getConfig() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Metrics
    ipcMain.handle('prediction:metrics', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            return { success: true, metrics: engine.getMetrics() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('prediction:metrics:reset', async () => {
        try {
            const engine = await getPredictionEngine();
            if (!engine) return { success: false, error: 'Prediction engine not available' };
            engine.resetMetrics();
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Prediction IPC handlers registered');
}
