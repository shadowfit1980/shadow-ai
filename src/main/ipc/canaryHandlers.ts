/**
 * Canary Deployment IPC Handlers
 * 
 * Exposes CanaryDeployer to renderer
 */

import { ipcMain } from 'electron';
import { CanaryDeployer, DeploymentStage } from '../ai/cicd';

export function setupCanaryHandlers(): void {
    console.log('🔧 Setting up Canary Deployment IPC handlers...');

    const deployer = CanaryDeployer.getInstance();

    // Start a deployment
    ipcMain.handle('canary:startDeployment', async (_, params: {
        name: string;
        version: string;
        deployCommand?: string;
        healthCheckUrl?: string;
        customStages?: DeploymentStage[];
    }) => {
        try {
            const deployment = await deployer.startDeployment(params);
            return { success: true, deployment };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get active deployment
    ipcMain.handle('canary:getActiveDeployment', async () => {
        return deployer.getActiveDeployment();
    });

    // Get deployment by ID
    ipcMain.handle('canary:getDeployment', async (_, id: string) => {
        return deployer.getDeployment(id);
    });

    // Get all deployments
    ipcMain.handle('canary:getAllDeployments', async () => {
        return deployer.getAllDeployments();
    });

    // Cancel active deployment
    ipcMain.handle('canary:cancelDeployment', async () => {
        const cancelled = await deployer.cancelDeployment();
        return { success: cancelled };
    });

    // Get configuration
    ipcMain.handle('canary:getConfig', async () => {
        return deployer.getConfig();
    });

    // Set configuration
    ipcMain.handle('canary:setConfig', async (_, config: any) => {
        deployer.setConfig(config);
        return { success: true };
    });

    console.log('✅ Canary Deployment IPC handlers registered');
}
