/**
 * Google Opal Feature IPC Handlers
 * IPC bridge for VisualWorkflowEditor and AppDeployer
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let visualWorkflowEditor: any = null;
let appDeployer: any = null;

async function getVisualWorkflowEditor() {
    if (!visualWorkflowEditor) {
        try {
            const { getVisualWorkflowEditor: getVWE } = await import('../workflow/VisualWorkflowEditor');
            visualWorkflowEditor = getVWE();
        } catch (error) {
            console.warn('⚠️ VisualWorkflowEditor not available:', (error as Error).message);
            return null;
        }
    }
    return visualWorkflowEditor;
}

async function getAppDeployer() {
    if (!appDeployer) {
        try {
            const { getAppDeployer: getAD } = await import('../deploy/AppDeployer');
            appDeployer = getAD();
        } catch (error) {
            console.warn('⚠️ AppDeployer not available:', (error as Error).message);
            return null;
        }
    }
    return appDeployer;
}

/**
 * Setup Opal feature handlers
 */
export function setupOpalHandlers(): void {
    // === VISUAL WORKFLOW EDITOR ===

    ipcMain.handle('workflow:create', async (_, { name, description }: any) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const workflow = vwe.createWorkflow(name, description);
            return { success: true, workflow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:addNode', async (_, { workflowId, type, position, data }: any) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const node = vwe.addNode(workflowId, type, position, data);
            return { success: true, node };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:connect', async (_, { workflowId, source, target }: any) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const edge = vwe.connect(workflowId, source, target);
            return { success: true, edge };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:execute', async (_, { workflowId, input }: any) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const results = await vwe.execute(workflowId, input);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:getAll', async () => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const workflows = vwe.getAllWorkflows();
            return { success: true, workflows };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:get', async (_, { id }: { id: string }) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const workflow = vwe.getWorkflow(id);
            return { success: true, workflow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('workflow:export', async (_, { id }: { id: string }) => {
        try {
            const vwe = await getVisualWorkflowEditor();
            if (!vwe) return { success: false, error: 'Workflow editor not available' };

            const json = vwe.exportWorkflow(id);
            return { success: true, json };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === APP DEPLOYER ===

    ipcMain.handle('deploy:deploy', async (_, config: any) => {
        try {
            const ad = await getAppDeployer();
            if (!ad) return { success: false, error: 'App deployer not available' };

            const deployment = await ad.deploy(config);
            return { success: true, deployment };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deploy:getAll', async () => {
        try {
            const ad = await getAppDeployer();
            if (!ad) return { success: false, error: 'App deployer not available' };

            const deployments = ad.getAllDeployments();
            return { success: true, deployments };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deploy:get', async (_, { id }: { id: string }) => {
        try {
            const ad = await getAppDeployer();
            if (!ad) return { success: false, error: 'App deployer not available' };

            const deployment = ad.getDeployment(id);
            return { success: true, deployment };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('deploy:cancel', async (_, { id }: { id: string }) => {
        try {
            const ad = await getAppDeployer();
            if (!ad) return { success: false, error: 'App deployer not available' };

            const cancelled = ad.cancel(id);
            return { success: cancelled };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Opal feature IPC handlers registered');
}
