/**
 * Workflow IPC Handlers
 * IPC bridge for parameterized workflow management
 */

import { ipcMain } from 'electron';

// Lazy-loaded workflow engine
let workflowEngine: any = null;

async function getWorkflowEngine() {
    if (!workflowEngine) {
        try {
            const { getWorkflowEngine: getEngine } = await import('../workflows/WorkflowEngine');
            workflowEngine = getEngine();
        } catch (error) {
            console.warn('⚠️ WorkflowEngine not available:', (error as Error).message);
            return null;
        }
    }
    return workflowEngine;
}

/**
 * Setup workflow IPC handlers
 */
export function setupWorkflowHandlers(): void {
    // List all workflows
    ipcMain.handle('workflow:list', async () => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const workflows = engine.getAllWorkflows();
            return { success: true, workflows };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get workflow by ID
    ipcMain.handle('workflow:get', async (_, { id }: { id: string }) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const workflow = engine.getWorkflow(id);
            return { success: true, workflow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Create workflow
    ipcMain.handle('workflow:create', async (_, workflow: any) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const created = await engine.createWorkflow(workflow);
            return { success: true, workflow: created };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Update workflow
    ipcMain.handle('workflow:update', async (_, { id, updates }: any) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const updated = await engine.updateWorkflow(id, updates);
            return { success: true, workflow: updated };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Delete workflow
    ipcMain.handle('workflow:delete', async (_, { id }: { id: string }) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            await engine.deleteWorkflow(id);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute workflow
    ipcMain.handle('workflow:execute', async (_, { id, parameters, options }: any) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const execution = await engine.executeWorkflow(id, parameters, options);
            return { success: true, execution };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Preview workflow commands
    ipcMain.handle('workflow:preview', async (_, { id, parameters }: any) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const commands = engine.previewWorkflow(id, parameters);
            return { success: true, commands };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Search workflows
    ipcMain.handle('workflow:search', async (_, { query }: { query: string }) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const workflows = engine.searchWorkflows(query);
            return { success: true, workflows };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get execution history
    ipcMain.handle('workflow:history', async (_, { limit }: { limit?: number } = {}) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            const executions = engine.getRecentExecutions(limit);
            return { success: true, executions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Load workflows from directory
    ipcMain.handle('workflow:load', async (_, { dir }: { dir?: string } = {}) => {
        try {
            const engine = await getWorkflowEngine();
            if (!engine) return { success: false, error: 'Workflow engine not available' };

            await engine.loadWorkflows(dir);
            return { success: true, count: engine.getAllWorkflows().length };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Workflow IPC handlers registered');
}
