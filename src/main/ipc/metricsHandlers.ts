/**
 * Metrics IPC Handlers
 * 
 * Exposes MetricsCollector to renderer
 */

import { ipcMain } from 'electron';
import { MetricsCollector } from '../ai/metrics';

export function setupMetricsHandlers(): void {
    console.log('🔧 Setting up Metrics IPC handlers...');

    const metrics = MetricsCollector.getInstance();
    metrics.initialize().catch(console.error);

    // Record a metric
    ipcMain.handle('metrics:record', async (_, params: {
        category: 'correctness' | 'safety' | 'productivity' | 'quality' | 'confidence';
        name: string;
        value: number;
        unit?: string;
        context?: Record<string, any>;
    }) => {
        const id = metrics.recordMetric(params);
        return { success: true, id };
    });

    // Record calibration
    ipcMain.handle('metrics:recordCalibration', async (_, params: {
        predicted: number;
        actual: number;
        task: string;
    }) => {
        metrics.recordCalibration(params);
        return { success: true };
    });

    // Record test result
    ipcMain.handle('metrics:recordTestResult', async (_, passed: boolean, testName: string) => {
        metrics.recordTestResult(passed, testName);
        return { success: true };
    });

    // Record safety event
    ipcMain.handle('metrics:recordSafetyEvent', async (_, type: 'violation' | 'approval_required' | 'blocked', context?: any) => {
        metrics.recordSafetyEvent(type, context);
        return { success: true };
    });

    // Record productivity
    ipcMain.handle('metrics:recordProductivity', async (_, type: 'task_completed' | 'code_generated' | 'pr_created', value: number, context?: any) => {
        metrics.recordProductivity(type, value, context);
        return { success: true };
    });

    // Get summary
    ipcMain.handle('metrics:getSummary', async (_, since?: string) => {
        const sinceDate = since ? new Date(since) : undefined;
        return metrics.getSummary(sinceDate);
    });

    // Calculate improvement delta
    ipcMain.handle('metrics:getImprovementDelta', async (_, metric: string, period: 'day' | 'week' | 'month') => {
        return metrics.calculateImprovementDelta(metric, period);
    });

    // Get calibration data
    ipcMain.handle('metrics:getCalibrationData', async () => {
        return metrics.getCalibrationData();
    });

    // Get metrics by category
    ipcMain.handle('metrics:getByCategory', async (_, category: string, limit?: number) => {
        return metrics.getMetricsByCategory(category as any, limit);
    });

    // Get improvement history
    ipcMain.handle('metrics:getImprovementHistory', async () => {
        return metrics.getImprovementHistory();
    });

    console.log('✅ Metrics IPC handlers registered');
}
