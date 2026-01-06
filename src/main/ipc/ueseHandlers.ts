/**
 * UESE IPC Handlers
 * 
 * Exposes Universal Embedded Super Emulator to the renderer process.
 */

import { ipcMain } from 'electron';
import { uese } from '../uese';

export function registerUESEHandlers(): void {
    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================

    ipcMain.handle('uese:create-session', async (_event, name: string, config?: any) => {
        try {
            const session = uese.createSession(name, config);
            return { success: true, data: session };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    ipcMain.handle('uese:list-sessions', async () => {
        return uese.listSessions();
    });

    ipcMain.handle('uese:destroy-session', async (_event, sessionId: string) => {
        return uese.destroySession(sessionId);
    });

    // ========================================================================
    // EXECUTION
    // ========================================================================

    ipcMain.handle('uese:execute', async (_event, code: string, options?: any) => {
        try {
            const result = await uese.execute(code, options);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    ipcMain.handle('uese:execute-browser', async (_event, html: string, script?: string) => {
        try {
            const result = await uese.executeInBrowser(html, script);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // ========================================================================
    // CONFIGURATION
    // ========================================================================

    ipcMain.handle('uese:configure-mobile', async (_event, device: 'iphone' | 'android') => {
        uese.configureMobile(device);
        return { success: true };
    });

    ipcMain.handle('uese:configure-desktop', async (_event, os: 'mac' | 'windows' | 'linux') => {
        uese.configureDesktop(os);
        return { success: true };
    });

    ipcMain.handle('uese:configure-server', async () => {
        uese.configureServer();
        return { success: true };
    });

    // ========================================================================
    // STATUS & METRICS
    // ========================================================================

    ipcMain.handle('uese:get-status', async () => {
        return uese.getStatus();
    });

    ipcMain.handle('uese:get-metrics', async () => {
        return uese.getMetrics();
    });

    // ========================================================================
    // SUBSYSTEM ACCESS
    // ========================================================================

    // Hardware
    ipcMain.handle('uese:hardware:get-profile', async () => {
        return uese.hardware.getProfile();
    });

    ipcMain.handle('uese:hardware:set-profile', async (_event, profileId: string) => {
        return uese.hardware.setProfile(profileId);
    });

    ipcMain.handle('uese:hardware:get-metrics', async () => {
        return uese.hardware.getMetrics();
    });

    // Network
    ipcMain.handle('uese:network:get-profile', async () => {
        return uese.network.getProfile();
    });

    ipcMain.handle('uese:network:set-profile', async (_event, profileId: string) => {
        return uese.network.setProfile(profileId);
    });

    ipcMain.handle('uese:network:simulate-outage', async (_event, duration: number) => {
        uese.network.simulateOutage(duration);
        return { success: true };
    });

    // Security
    ipcMain.handle('uese:security:run-scan', async (_event, target: string) => {
        try {
            const result = await uese.security.runSecurityScan(target);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    ipcMain.handle('uese:security:get-vulnerabilities', async () => {
        return uese.security.getVulnerabilities();
    });

    ipcMain.handle('uese:security:inject-chaos', async (_event, type: string, duration?: number) => {
        const event = uese.security.injectChaos(type as any, duration);
        return { success: true, data: event };
    });

    // Users
    ipcMain.handle('uese:users:run-simulation', async (_event, config: any) => {
        try {
            const result = await uese.users.runSimulation(config);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    ipcMain.handle('uese:users:get-metrics', async () => {
        return uese.users.getMetrics();
    });

    // Learning
    ipcMain.handle('uese:learning:get-report', async () => {
        return uese.learning.generateReport();
    });

    ipcMain.handle('uese:learning:get-blind-spots', async () => {
        return uese.learning.getBlindSpots(true);
    });

    // ========================================================================
    // CHAOS TESTING
    // ========================================================================

    ipcMain.handle('uese:simulate-chaos', async (_event, options: any) => {
        uese.simulateChaos(options);
        return { success: true };
    });

    // ========================================================================
    // EVENTS
    // ========================================================================

    // Forward events to renderer
    uese.on('execution-completed', (data) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('uese:execution-completed', data);
        });
    });

    uese.on('chaos-started', (data) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('uese:chaos-started', data);
        });
    });

    console.log('🌌 UESE IPC handlers registered');
}
