/**
 * Advanced Features IPC Handlers
 * 
 * Exposes advanced differentiating features to the renderer:
 * - AIReviewTeam
 * - CrossProjectIntelligence  
 * - IntelligentErrorRecovery
 */

import { ipcMain } from 'electron';

export function registerAdvancedFeatureHandlers(): void {
    console.log('🚀 [IPC] Registering advanced feature handlers...');

    // ========================================================================
    // AI REVIEW TEAM
    // ========================================================================

    ipcMain.handle('review:analyze', async (_, request) => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.review(request);
    });

    ipcMain.handle('review:security', async (_, content, filePath) => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.securityReview(content, filePath);
    });

    ipcMain.handle('review:performance', async (_, content, filePath) => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.performanceReview(content, filePath);
    });

    ipcMain.handle('review:getReviewers', async () => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.getReviewers();
    });

    ipcMain.handle('review:setReviewerEnabled', async (_, role, enabled) => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        aiReviewTeam.setReviewerEnabled(role, enabled);
        return { success: true };
    });

    ipcMain.handle('review:getHistory', async (_, limit) => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.getHistory(limit);
    });

    ipcMain.handle('review:getStats', async () => {
        const { aiReviewTeam } = await import('../ai/review/AIReviewTeam');
        return aiReviewTeam.getStats();
    });

    // ========================================================================
    // CROSS PROJECT INTELLIGENCE
    // ========================================================================

    ipcMain.handle('crossProject:analyze', async (_, projectPath, files) => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.analyzeProject(projectPath, files);
    });

    ipcMain.handle('crossProject:getProjects', async () => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.getProjects();
    });

    ipcMain.handle('crossProject:getPatterns', async () => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.getPatterns();
    });

    ipcMain.handle('crossProject:getPreferences', async () => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.getUserPreferences();
    });

    ipcMain.handle('crossProject:getSuggestions', async (_, context) => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.getSuggestions(context);
    });

    ipcMain.handle('crossProject:findSharedCode', async () => {
        const { crossProjectIntelligence } = await import('../ai/intelligence/CrossProjectIntelligence');
        return crossProjectIntelligence.findSharedCode();
    });

    // ========================================================================
    // INTELLIGENT ERROR RECOVERY
    // ========================================================================

    ipcMain.handle('errorRecovery:analyze', async (_, error) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.analyzeError(error);
    });

    ipcMain.handle('errorRecovery:applyFix', async (_, analysisId, suggestionId, codeToFix) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.applyFix(analysisId, suggestionId, codeToFix);
    });

    ipcMain.handle('errorRecovery:autoApply', async (_, analysis, codeToFix) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.autoApplyFixes(analysis, codeToFix);
    });

    ipcMain.handle('errorRecovery:rollback', async (_, suggestionId) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.rollback(suggestionId);
    });

    ipcMain.handle('errorRecovery:getErrors', async (_, options) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.getErrors(options);
    });

    ipcMain.handle('errorRecovery:getRecurring', async (_, minFrequency) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.getRecurringErrors(minFrequency);
    });

    ipcMain.handle('errorRecovery:getStats', async () => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        return intelligentErrorRecovery.getStats();
    });

    ipcMain.handle('errorRecovery:setThreshold', async (_, threshold) => {
        const { intelligentErrorRecovery } = await import('../ai/recovery/IntelligentErrorRecovery');
        intelligentErrorRecovery.setAutoApplyThreshold(threshold);
        return { success: true };
    });

    console.log('✅ [IPC] Advanced feature handlers registered (25+ handlers)');
}
