/**
 * Ops IPC Handlers
 * 
 * Exposes ALOps to renderer
 */

import { ipcMain } from 'electron';
import { ALOps } from '../ai/ops';

export function setupOpsHandlers(): void {
    console.log('🔧 Setting up Ops IPC handlers...');

    const alops = ALOps.getInstance();

    // Configure ALOps
    ipcMain.handle('alops:configure', async (_, config: any) => {
        alops.configure(config);
        return { success: true };
    });

    // Start monitoring
    ipcMain.handle('alops:startMonitoring', async () => {
        alops.startMonitoring();
        return { success: true };
    });

    // Stop monitoring
    ipcMain.handle('alops:stopMonitoring', async () => {
        alops.stopMonitoring();
        return { success: true };
    });

    // Get health status
    ipcMain.handle('alops:getHealthStatus', async () => {
        return alops.getHealthStatus();
    });

    // Get health history
    ipcMain.handle('alops:getHealthHistory', async (_, limit?: number) => {
        return alops.getHealthHistory(limit);
    });

    // Get incidents
    ipcMain.handle('alops:getIncidents', async () => {
        return alops.getIncidents();
    });

    // Get incident by ID
    ipcMain.handle('alops:getIncident', async (_, id: string) => {
        return alops.getIncident(id);
    });

    // Acknowledge alert
    ipcMain.handle('alops:acknowledgeAlert', async (_, alertId: string) => {
        return alops.acknowledgeAlert(alertId);
    });

    // Resolve incident
    ipcMain.handle('alops:resolveIncident', async (_, incidentId: string, resolution: string) => {
        return alops.resolveIncident(incidentId, resolution);
    });

    // Get active alerts
    ipcMain.handle('alops:getActiveAlerts', async () => {
        return alops.getActiveAlerts();
    });

    // Get config
    ipcMain.handle('alops:getConfig', async () => {
        return alops.getConfig();
    });

    // Is monitoring active
    ipcMain.handle('alops:isActive', async () => {
        return alops.isActive();
    });

    console.log('✅ Ops IPC handlers registered');
}
