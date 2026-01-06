/**
 * Enhancement 230+ IPC Handlers - Kilo.ai-inspired platform features
 */

import { ipcMain } from 'electron';

export function setupEnhancement230Handlers(): void {
    // COST OPTIMIZER
    ipcMain.handle('cost:analyze', async (_, { usage }: any) => {
        try { const { getCostOptimizer } = await import('../costoptimizer/CostOptimizer'); return { success: true, optimizations: await getCostOptimizer().analyze(usage) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // USAGE TRACKER
    ipcMain.handle('usage:record', async (_, { model, inputTokens, outputTokens, cost, latency }: any) => {
        try { const { getUsageTracker } = await import('../usagetracker/UsageTracker'); return { success: true, record: getUsageTracker().record(model, inputTokens, outputTokens, cost, latency) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('usage:getStats', async (_, { period }: any = {}) => {
        try { const { getUsageTracker } = await import('../usagetracker/UsageTracker'); return { success: true, stats: getUsageTracker().getStats(period) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BILLING
    ipcMain.handle('billing:subscribe', async (_, { plan, billingCycle }: any) => {
        try { const { getBillingManager } = await import('../billingmgr/BillingManager'); return { success: true, subscription: getBillingManager().subscribe(plan, billingCycle) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOKEN COUNTER
    ipcMain.handle('tokens:count', async (_, { text, model }: any) => {
        try { const { getTokenCounter } = await import('../tokencounter/TokenCounter'); return { success: true, count: getTokenCounter().count(text, model) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // MODEL COST
    ipcMain.handle('modelcost:compare', async (_, { inputTokens, outputTokens }: any) => {
        try { const { getModelCostAnalyzer } = await import('../modelcost/ModelCostAnalyzer'); return { success: true, comparison: getModelCostAnalyzer().compare(inputTokens, outputTokens) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // BUDGET ALERTS
    ipcMain.handle('budget:create', async (_, { name, threshold, action }: any) => {
        try { const { getBudgetAlerts } = await import('../budgetalerts/BudgetAlerts'); return { success: true, alert: getBudgetAlerts().create(name, threshold, action) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TEAM QUOTAS
    ipcMain.handle('quota:create', async (_, { name, dailyLimit, monthlyLimit }: any) => {
        try { const { getTeamQuotaManager } = await import('../teamquotas/TeamQuotaManager'); return { success: true, quota: getTeamQuotaManager().create(name, dailyLimit, monthlyLimit) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // API KEY ROTATION
    ipcMain.handle('apikey:create', async (_, { name, rotationDays }: any) => {
        try { const { getApiKeyRotation } = await import('../apikeyrotation/ApiKeyRotation'); return { success: true, key: getApiKeyRotation().create(name, rotationDays) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('apikey:rotate', async (_, { id }: any) => {
        try { const { getApiKeyRotation } = await import('../apikeyrotation/ApiKeyRotation'); return { success: true, key: getApiKeyRotation().rotate(id) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RATE LIMIT
    ipcMain.handle('ratelimit:check', async (_, { endpoint, tokens }: any) => {
        try { const { getRateLimitManager } = await import('../ratelimitmgr/RateLimitManager'); return { success: true, result: getRateLimitManager().check(endpoint, tokens) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // INVOICE
    ipcMain.handle('invoice:create', async (_, { items }: any) => {
        try { const { getInvoiceGenerator } = await import('../invoicegen/InvoiceGenerator'); return { success: true, invoice: getInvoiceGenerator().create(items) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 230+ IPC handlers registered (12 handlers)');
}
