/**
 * Safety IPC Handlers
 * 
 * Exposes PolicyStore, ModeManager, and new Phase 1 safety systems to renderer
 */

import { ipcMain } from 'electron';
import { PolicyStore } from '../ai/safety/PolicyStore';
import { ModeManager, OperatingMode } from '../ai/safety/ModeManager';
import { selfCorrectionEngine } from '../ai/safety/SelfCorrectionEngine';
import { commandSafetyNet } from '../ai/safety/CommandSafetyNet';
import { intentClassifier } from '../ai/intelligence/IntentClassifier';

export function setupSafetyHandlers(): void {
    console.log('🔧 Setting up Safety IPC handlers...');

    const policyStore = PolicyStore.getInstance();
    const modeManager = ModeManager.getInstance();

    // ====================== PolicyStore ======================

    // Get all policies
    ipcMain.handle('safety:getAllPolicies', async () => {
        return policyStore.getAllPolicies();
    });

    // Get policy by ID
    ipcMain.handle('safety:getPolicy', async (_, id: string) => {
        return policyStore.getPolicy(id);
    });

    // Enable/disable policy
    ipcMain.handle('safety:setPolicyEnabled', async (_, policyId: string, enabled: boolean) => {
        return policyStore.setPolicyEnabled(policyId, enabled);
    });

    // Check action against policies
    ipcMain.handle('safety:checkAction', async (_, params: {
        agent: string;
        action: string;
        target?: string;
        content?: string;
        context?: Record<string, any>;
    }) => {
        return await policyStore.checkAction(params);
    });

    // Approve a violation
    ipcMain.handle('safety:approveViolation', async (_, violationId: string, approvedBy: string, reason?: string) => {
        return policyStore.approveViolation(violationId, approvedBy, reason);
    });

    // Reject a violation
    ipcMain.handle('safety:rejectViolation', async (_, violationId: string, reason?: string) => {
        return policyStore.rejectViolation(violationId, reason);
    });

    // Get recent violations
    ipcMain.handle('safety:getRecentViolations', async (_, limit?: number) => {
        return policyStore.getRecentViolations(limit);
    });

    // Get violation stats
    ipcMain.handle('safety:getViolationStats', async () => {
        return policyStore.getViolationStats();
    });

    // ====================== ModeManager ======================

    // Get current mode
    ipcMain.handle('mode:getMode', async () => {
        return modeManager.getMode();
    });

    // Set mode
    ipcMain.handle('mode:setMode', async (_, mode: OperatingMode) => {
        modeManager.setMode(mode);
        return { success: true, mode };
    });

    // Get mode config
    ipcMain.handle('mode:getConfig', async () => {
        return modeManager.getConfig();
    });

    // Check action permission
    ipcMain.handle('mode:checkAction', async (_, params: {
        agent: string;
        action: string;
        context?: Record<string, any>;
    }) => {
        return await modeManager.checkAction(params);
    });

    // Approve pending action
    ipcMain.handle('mode:approveAction', async (_, actionId: string, approver: string, notes?: string) => {
        return modeManager.approveAction(actionId, approver, notes);
    });

    // Reject pending action
    ipcMain.handle('mode:rejectAction', async (_, actionId: string, rejecter: string, reason?: string) => {
        return modeManager.rejectAction(actionId, rejecter, reason);
    });

    // Get pending actions
    ipcMain.handle('mode:getPendingActions', async () => {
        return modeManager.getPendingActions();
    });

    // Get audit log
    ipcMain.handle('mode:getAuditLog', async (_, limit?: number) => {
        return modeManager.getAuditLog(limit);
    });

    // Get audit stats
    ipcMain.handle('mode:getAuditStats', async () => {
        return modeManager.getAuditStats();
    });

    // ====================== Self-Correction Engine (NEW) ======================

    ipcMain.handle('sandbox:create', async () => {
        return selfCorrectionEngine.createSandbox();
    });

    ipcMain.handle('sandbox:addOperation', async (_, sandboxId: string, operation: any) => {
        return selfCorrectionEngine.addOperation(sandboxId, operation);
    });

    ipcMain.handle('sandbox:simulate', async (_, sandboxId: string) => {
        return selfCorrectionEngine.simulateOperations(sandboxId);
    });

    ipcMain.handle('sandbox:commit', async (_, sandboxId: string) => {
        return selfCorrectionEngine.commitSandbox(sandboxId);
    });

    ipcMain.handle('sandbox:rollback', async (_, sandboxId: string) => {
        return selfCorrectionEngine.rollbackSandbox(sandboxId);
    });

    ipcMain.handle('sandbox:getAnomalies', async () => {
        return selfCorrectionEngine.getAnomalyHistory();
    });

    ipcMain.handle('sandbox:getLearningInsights', async () => {
        return selfCorrectionEngine.getLearningInsights();
    });

    // ====================== Command Safety Net (NEW) ======================

    ipcMain.handle('command:createSnapshot', async (_, command: string, cwd: string, paths?: string[]) => {
        return commandSafetyNet.createSnapshot(command, cwd, paths);
    });

    ipcMain.handle('command:rollbackSnapshot', async (_, snapshotId: string) => {
        return commandSafetyNet.rollback(snapshotId);
    });

    ipcMain.handle('command:getRecentSnapshots', async (_, limit?: number) => {
        return commandSafetyNet.getRecentSnapshots(limit);
    });

    ipcMain.handle('command:getSnapshotSize', async () => {
        return commandSafetyNet.getSnapshotSize();
    });

    // ====================== Intent Classifier (NEW) ======================

    ipcMain.handle('intent:classify', async (_, input: string, context?: any) => {
        return intentClassifier.classify(input, context);
    });

    ipcMain.handle('intent:updateContext', async (_, update: any) => {
        intentClassifier.updateContext(update);
        return true;
    });

    ipcMain.handle('intent:getHistory', async () => {
        return intentClassifier.getHistory();
    });

    console.log('✅ Safety IPC handlers registered');
}

