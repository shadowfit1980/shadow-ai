/**
 * Multi-Agent Orchestration IPC Handlers
 */

import { ipcMain } from 'electron';
import { MultiAgentOrchestrator } from '../ai/orchestration/MultiAgentOrchestrator';

export function setupOrchestrationHandlers(): void {
    console.log('🔧 Setting up Orchestration IPC handlers...');

    const orchestrator = MultiAgentOrchestrator.getInstance();

    // Get all agents
    ipcMain.handle('orchestration:getAgents', async () => {
        return orchestrator.getAgents();
    });

    // Get specific agent
    ipcMain.handle('orchestration:getAgent', async (_, id: string) => {
        return orchestrator.getAgent(id);
    });

    // Create workflow
    ipcMain.handle('orchestration:createWorkflow', async (_, params: any) => {
        try {
            const workflow = orchestrator.createWorkflow(params);
            return { success: true, workflow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute workflow
    ipcMain.handle('orchestration:executeWorkflow', async (_, workflowId: string) => {
        try {
            const result = await orchestrator.executeWorkflow(workflowId);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get workflow
    ipcMain.handle('orchestration:getWorkflow', async (_, id: string) => {
        return orchestrator.getWorkflow(id);
    });

    // Get all workflows
    ipcMain.handle('orchestration:getWorkflows', async () => {
        return orchestrator.getWorkflows();
    });

    // Create feature workflow (template)
    ipcMain.handle('orchestration:createFeatureWorkflow', async (_, featureName: string) => {
        const workflow = orchestrator.createFeatureWorkflow(featureName);
        return { success: true, workflow };
    });

    // Request consensus
    ipcMain.handle('orchestration:requestConsensus', async (_, params: any) => {
        return orchestrator.requestConsensus(params);
    });

    console.log('✅ Orchestration IPC handlers registered');
}
