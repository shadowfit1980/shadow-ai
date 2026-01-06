/**
 * Comprehensive IPC Handlers for All New Features
 * Exposes predictive analytics, budget tracking, sustainability, and more
 */
import { ipcMain } from 'electron';
import { predictiveAnalyticsEngine } from '../ai/analytics/PredictiveAnalyticsEngine';
import { projectBudgetTracker } from '../ai/budget/ProjectBudgetTracker';

export function registerComprehensiveGrokHandlers(): void {
    // ============ Predictive Analytics Engine ============
    ipcMain.handle('analytics:predict-bug-risk', async (_, code: string, filePath: string) => {
        return predictiveAnalyticsEngine.predictBugRisk(code, filePath);
    });

    ipcMain.handle('analytics:predict-performance', async (_, code: string) => {
        return predictiveAnalyticsEngine.predictPerformance(code);
    });

    ipcMain.handle('analytics:analyze-trends', async (_, historicalData: unknown) => {
        return predictiveAnalyticsEngine.analyzeTrends(historicalData as Parameters<typeof predictiveAnalyticsEngine.analyzeTrends>[0]);
    });

    ipcMain.handle('analytics:generate-forecast', async (_, projectName: string, horizon: string) => {
        return predictiveAnalyticsEngine.generateForecast(projectName, horizon as Parameters<typeof predictiveAnalyticsEngine.generateForecast>[1]);
    });

    ipcMain.handle('analytics:get-prediction', async (_, id: string) => {
        return predictiveAnalyticsEngine.getPrediction(id);
    });

    ipcMain.handle('analytics:get-predictions', async () => {
        return predictiveAnalyticsEngine.getPredictions();
    });

    ipcMain.handle('analytics:get-trends', async (_, projectId: string) => {
        return predictiveAnalyticsEngine.getTrends(projectId);
    });

    ipcMain.handle('analytics:get-forecast', async (_, id: string) => {
        return predictiveAnalyticsEngine.getForecast(id);
    });

    // ============ Project Budget Tracker ============
    ipcMain.handle('budget:create', async (_, config: unknown) => {
        return projectBudgetTracker.createBudget(config as Parameters<typeof projectBudgetTracker.createBudget>[0]);
    });

    ipcMain.handle('budget:add-expense', async (_, budgetId: string, expense: unknown) => {
        return projectBudgetTracker.addExpense(budgetId, expense as Parameters<typeof projectBudgetTracker.addExpense>[1]);
    });

    ipcMain.handle('budget:add-allocation', async (_, budgetId: string, allocation: unknown) => {
        return projectBudgetTracker.addAllocation(budgetId, allocation as Parameters<typeof projectBudgetTracker.addAllocation>[1]);
    });

    ipcMain.handle('budget:log-time', async (_, budgetId: string, entry: unknown) => {
        return projectBudgetTracker.logTime(budgetId, entry as Parameters<typeof projectBudgetTracker.logTime>[1]);
    });

    ipcMain.handle('budget:generate-report', async (_, budgetId: string, period?: unknown) => {
        return projectBudgetTracker.generateReport(budgetId, period as Parameters<typeof projectBudgetTracker.generateReport>[1]);
    });

    ipcMain.handle('budget:get', async (_, id: string) => {
        return projectBudgetTracker.getBudget(id);
    });

    ipcMain.handle('budget:get-all', async () => {
        return projectBudgetTracker.getBudgets();
    });

    ipcMain.handle('budget:get-time-entries', async (_, budgetId: string) => {
        return projectBudgetTracker.getTimeEntries(budgetId);
    });

    ipcMain.handle('budget:delete', async (_, id: string) => {
        return projectBudgetTracker.deleteBudget(id);
    });
}
