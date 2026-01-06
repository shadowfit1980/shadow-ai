/**
 * Deployment IPC Handlers
 * 
 * Exposes DeploymentAgent to the renderer process.
 */

import { ipcMain } from 'electron';
import { deploymentAgent, DeploymentConfig, DeploymentPlatform } from '../ai/deployment/DeploymentAgent';

export function registerDeploymentHandlers(): void {
    // Deploy project
    ipcMain.handle('deploy:start', async (_event, config: DeploymentConfig) => {
        try {
            const result = await deploymentAgent.deploy(config);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // Quick deploy
    ipcMain.handle('deploy:quick', async (_event, projectPath: string, platform?: DeploymentPlatform) => {
        try {
            const result = await deploymentAgent.quickDeploy(projectPath, platform);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    });

    // Get deployment status
    ipcMain.handle('deploy:get-status', async (_event, deploymentId: string) => {
        return deploymentAgent.getDeployment(deploymentId) || null;
    });

    // List all deployments
    ipcMain.handle('deploy:list', async () => {
        return deploymentAgent.listDeployments();
    });

    // Get supported platforms
    ipcMain.handle('deploy:get-platforms', async () => {
        return deploymentAgent.getSupportedPlatforms();
    });

    // Subscribe to deployment events
    deploymentAgent.on('deployment-started', (deployment) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('deploy:started', deployment);
        });
    });

    deploymentAgent.on('deployment-updated', (deployment) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('deploy:updated', deployment);
        });
    });

    deploymentAgent.on('deployment-completed', (deployment) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('deploy:completed', deployment);
        });
    });

    deploymentAgent.on('deployment-failed', (deployment) => {
        const { BrowserWindow } = require('electron');
        BrowserWindow.getAllWindows().forEach((win: any) => {
            win.webContents.send('deploy:failed', deployment);
        });
    });

    console.log('🚀 Deployment handlers registered');
}
