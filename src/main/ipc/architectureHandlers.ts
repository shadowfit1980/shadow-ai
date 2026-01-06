/**
 * Architecture Enhancement IPC Handlers
 * 
 * Exposes the new architectural improvements to the renderer:
 * - ObservabilityHub
 * - SecretsVault
 * - ServiceRegistry
 * - UnifiedMemory
 * - DiffPreviewEngine
 * - OnboardingEngine
 */

import { ipcMain } from 'electron';

export function registerArchitectureHandlers(): void {
    console.log('📦 [IPC] Registering architecture enhancement handlers...');

    // ========================================================================
    // OBSERVABILITY HUB
    // ========================================================================

    ipcMain.handle('observability:log', async (_, level, service, message, context) => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        observabilityHub.log(level, service, message, context);
        return { success: true };
    });

    ipcMain.handle('observability:incrementCounter', async (_, name, labels, delta) => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        observabilityHub.incrementCounter(name, labels, delta);
        return { success: true };
    });

    ipcMain.handle('observability:setGauge', async (_, name, value, labels) => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        observabilityHub.setGauge(name, value, labels);
        return { success: true };
    });

    ipcMain.handle('observability:queryLogs', async (_, options) => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        return observabilityHub.queryLogs(options);
    });

    ipcMain.handle('observability:getMetrics', async () => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        return observabilityHub.getMetrics();
    });

    ipcMain.handle('observability:getActiveAlerts', async () => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        return observabilityHub.getActiveAlerts();
    });

    ipcMain.handle('observability:getStats', async () => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        return observabilityHub.getStats();
    });

    ipcMain.handle('observability:exportLogs', async (_, filePath) => {
        const { observabilityHub } = await import('../ai/observability/ObservabilityHub');
        return observabilityHub.exportLogs(filePath);
    });

    // ========================================================================
    // SECRETS VAULT
    // ========================================================================

    ipcMain.handle('secrets:set', async (_, key, value, options) => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        await secretsVault.setSecret(key, value, options);
        return { success: true };
    });

    ipcMain.handle('secrets:get', async (_, key, source) => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        return secretsVault.getSecret(key, source);
    });

    ipcMain.handle('secrets:delete', async (_, key) => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        return secretsVault.deleteSecret(key);
    });

    ipcMain.handle('secrets:rotate', async (_, key, newValue) => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        await secretsVault.rotateSecret(key, newValue);
        return { success: true };
    });

    ipcMain.handle('secrets:list', async () => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        return secretsVault.listSecrets();
    });

    ipcMain.handle('secrets:getAuditLog', async (_, options) => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        return secretsVault.getAuditLog(options);
    });

    ipcMain.handle('secrets:getStats', async () => {
        const { secretsVault } = await import('../ai/security/SecretsVault');
        return secretsVault.getStats();
    });

    // ========================================================================
    // SERVICE REGISTRY
    // ========================================================================

    ipcMain.handle('services:register', async (_, id, name, options) => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.register(id, name, options);
    });

    ipcMain.handle('services:get', async (_, id) => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.get(id);
    });

    ipcMain.handle('services:findByCapability', async (_, capability) => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.findByCapability(capability);
    });

    ipcMain.handle('services:findByCategory', async (_, category) => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.findByCategory(category);
    });

    ipcMain.handle('services:query', async (_, options) => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.query(options);
    });

    ipcMain.handle('services:getAll', async () => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.getAll();
    });

    ipcMain.handle('services:getHealth', async () => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.getHealthStatus();
    });

    ipcMain.handle('services:getStats', async () => {
        const { serviceRegistry } = await import('../core/ServiceRegistry');
        return serviceRegistry.getStats();
    });

    // ========================================================================
    // UNIFIED MEMORY
    // ========================================================================

    ipcMain.handle('memory:store', async (_, entry) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.store(entry);
    });

    ipcMain.handle('memory:storeThought', async (_, content, metadata) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.storeThought(content, metadata);
    });

    ipcMain.handle('memory:storeDecision', async (_, decision, alternatives, rationale, outcome) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.storeDecision(decision, alternatives, rationale, outcome);
    });

    ipcMain.handle('memory:storePattern', async (_, pattern, context, successRate) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.storePattern(pattern, context, successRate);
    });

    ipcMain.handle('memory:storeKnowledge', async (_, fact, source, confidence) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.storeKnowledge(fact, source, confidence);
    });

    ipcMain.handle('memory:get', async (_, id) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.get(id);
    });

    ipcMain.handle('memory:query', async (_, options) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.query(options);
    });

    ipcMain.handle('memory:getCurrentContext', async (_, limit) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.getCurrentContext(limit);
    });

    ipcMain.handle('memory:findSimilarExperiences', async (_, query, limit) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.findSimilarExperiences(query, limit);
    });

    ipcMain.handle('memory:getLearnedPatterns', async (_, context, limit) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.getLearnedPatterns(context, limit);
    });

    ipcMain.handle('memory:forget', async (_, id) => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.forget(id);
    });

    ipcMain.handle('memory:getStats', async () => {
        const { unifiedMemory } = await import('../ai/memory/UnifiedMemory');
        return unifiedMemory.getStats();
    });

    // ========================================================================
    // DIFF PREVIEW ENGINE
    // ========================================================================

    ipcMain.handle('diff:createChangeSet', async (_, description, changes) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.createChangeSet(description, changes);
    });

    ipcMain.handle('diff:getChangeSet', async (_, id) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.getChangeSet(id);
    });

    ipcMain.handle('diff:getPending', async () => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.getPendingChangeSets();
    });

    ipcMain.handle('diff:approve', async (_, id, approver) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.approve(id, approver);
    });

    ipcMain.handle('diff:reject', async (_, id, reason) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.reject(id, reason);
    });

    ipcMain.handle('diff:apply', async (_, id) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.apply(id);
    });

    ipcMain.handle('diff:rollback', async (_, id) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.rollback(id);
    });

    ipcMain.handle('diff:format', async (_, id) => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.formatUnifiedDiff(id);
    });

    ipcMain.handle('diff:getStats', async () => {
        const { diffPreviewEngine } = await import('../ai/editing/DiffPreviewEngine');
        return diffPreviewEngine.getStats();
    });

    // ========================================================================
    // ONBOARDING ENGINE
    // ========================================================================

    ipcMain.handle('onboarding:getUser', async (_, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getUser(userId);
    });

    ipcMain.handle('onboarding:awardXP', async (_, userId, amount, reason) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        onboardingEngine.awardXP(userId, amount, reason);
        return { success: true };
    });

    ipcMain.handle('onboarding:isFeatureUnlocked', async (_, featureId, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.isFeatureUnlocked(featureId, userId);
    });

    ipcMain.handle('onboarding:getAvailableFeatures', async (_, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getAvailableFeatures(userId);
    });

    ipcMain.handle('onboarding:getUpcomingFeatures', async (_, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getUpcomingFeatures(userId);
    });

    ipcMain.handle('onboarding:getTutorials', async (_, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getAvailableTutorials(userId);
    });

    ipcMain.handle('onboarding:completeTutorial', async (_, tutorialId, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.completeTutorial(tutorialId, userId);
    });

    ipcMain.handle('onboarding:trackAction', async (_, action, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        onboardingEngine.trackAction(action, userId);
        return { success: true };
    });

    ipcMain.handle('onboarding:getProgress', async (_, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getProgress(userId);
    });

    ipcMain.handle('onboarding:getTip', async (_, trigger, userId) => {
        const { onboardingEngine } = await import('../ai/experience/OnboardingEngine');
        return onboardingEngine.getTip(trigger, userId);
    });

    console.log('✅ [IPC] Architecture enhancement handlers registered (50+ handlers)');
}
