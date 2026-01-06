/**
 * Threat Detection IPC Handlers
 */

import { ipcMain } from 'electron';
import ThreatDetectionSystem, { ThreatLevel } from '../ai/security/ThreatDetectionSystem';

export function registerThreatDetectionHandlers(): void {
    const threatSystem = ThreatDetectionSystem.getInstance();

    // Scan a directory for threats
    ipcMain.handle('threat:scanDirectory', async (_event, dirPath: string) => {
        return threatSystem.scanDirectory(dirPath);
    });

    // Scan a single file
    ipcMain.handle('threat:scanFile', async (_event, filePath: string) => {
        return threatSystem.scanFile(filePath);
    });

    // Get active threats
    ipcMain.handle('threat:getActive', async () => {
        return threatSystem.getActiveThreats();
    });

    // Get threats by level
    ipcMain.handle('threat:getByLevel', async (_event, level: ThreatLevel) => {
        return threatSystem.getThreatsByLevel(level);
    });

    // Get threat summary
    ipcMain.handle('threat:getSummary', async () => {
        return threatSystem.getThreatSummary();
    });

    // Update threat status
    ipcMain.handle('threat:updateStatus', async (_event, threatId: string, status: string) => {
        return threatSystem.updateThreatStatus(threatId, status as any);
    });

    // Get all rules
    ipcMain.handle('threat:getRules', async () => {
        return threatSystem.getRules();
    });

    // Enable/disable a rule
    ipcMain.handle('threat:setRuleEnabled', async (_event, ruleId: string, enabled: boolean) => {
        return threatSystem.setRuleEnabled(ruleId, enabled);
    });

    // Start/stop monitoring
    ipcMain.handle('threat:startMonitoring', async () => {
        threatSystem.startMonitoring();
        return { monitoring: true };
    });

    ipcMain.handle('threat:stopMonitoring', async () => {
        threatSystem.stopMonitoring();
        return { monitoring: false };
    });

    ipcMain.handle('threat:isMonitoring', async () => {
        return threatSystem.isMonitoringActive();
    });

    // Clear resolved threats
    ipcMain.handle('threat:clearResolved', async () => {
        return threatSystem.clearResolvedThreats();
    });

    console.log('🛡️ Threat detection IPC handlers registered');
}
