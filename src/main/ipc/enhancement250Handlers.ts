/**
 * Enhancement 250+ IPC Handlers - SonarSource-inspired code quality
 */

import { ipcMain } from 'electron';

export function setupEnhancement250Handlers(): void {
    // CODE SMELL
    ipcMain.handle('codesmell:detect', async (_, { file, code }: any) => {
        try { const { getCodeSmellDetector } = await import('../codesmell/CodeSmellDetector'); return { success: true, smells: getCodeSmellDetector().detect(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TECH DEBT
    ipcMain.handle('techdebt:add', async (_, { file, type, remediationTime }: any) => {
        try { const { getTechnicalDebtTracker } = await import('../techdebt/TechnicalDebtTracker'); return { success: true, item: getTechnicalDebtTracker().add(file, type, remediationTime) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('techdebt:getTotal', async () => {
        try { const { getTechnicalDebtTracker } = await import('../techdebt/TechnicalDebtTracker'); return { success: true, debt: getTechnicalDebtTracker().getTotalDebt() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SECURITY HOTSPOTS
    ipcMain.handle('security:scan', async (_, { file, code }: any) => {
        try { const { getSecurityHotspots } = await import('../sechotspots/SecurityHotspots'); return { success: true, hotspots: getSecurityHotspots().scan(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // DUPLICATION
    ipcMain.handle('duplication:scan', async (_, { files }: any) => {
        try { const { getDuplicationScanner } = await import('../duplication/DuplicationScanner'); return { success: true, blocks: getDuplicationScanner().scan(files) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // COMPLEXITY
    ipcMain.handle('complexity:analyze', async (_, { file, code }: any) => {
        try { const { getComplexityAnalyzer } = await import('../complexity/ComplexityAnalyzer'); return { success: true, result: getComplexityAnalyzer().analyze(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // QUALITY PROFILES
    ipcMain.handle('qualityprofile:getDefault', async (_, { language }: any) => {
        try { const { getQualityProfiles } = await import('../qualityprofiles/QualityProfiles'); return { success: true, profile: getQualityProfiles().getDefault(language) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ISSUES
    ipcMain.handle('issue:create', async (_, { file, line, type, severity, message }: any) => {
        try { const { getIssueTracker2 } = await import('../issuetracker2/IssueTracker2'); return { success: true, issue: getIssueTracker2().create(file, line, type, severity, message) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // CLEAN CODE
    ipcMain.handle('cleancode:analyze', async (_, { file, code }: any) => {
        try { const { getCleanCodeGuide } = await import('../cleancode/CleanCodeGuide'); return { success: true, violations: getCleanCodeGuide().analyze(file, code) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // RULES
    ipcMain.handle('rules:getEnabled', async () => {
        try { const { getRuleEngine } = await import('../ruleengine/RuleEngine'); return { success: true, rules: getRuleEngine().getEnabled() }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // METRICS
    ipcMain.handle('metrics:update', async (_, { projectId, metrics }: any) => {
        try { const { getMetricsDashboard } = await import('../metricsdash/MetricsDashboard'); return { success: true, metrics: getMetricsDashboard().update(projectId, metrics) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    ipcMain.handle('metrics:getQualityGate', async (_, { projectId }: any) => {
        try { const { getMetricsDashboard } = await import('../metricsdash/MetricsDashboard'); return { success: true, qualityGate: getMetricsDashboard().getQualityGate(projectId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 250+ IPC handlers registered (12 handlers)');
}
