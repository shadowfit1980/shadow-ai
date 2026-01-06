/**
 * IPC Handlers for Tool System
 * Exposes tool functionality to the renderer process
 */

import { ipcMain } from 'electron';

export function setupToolIPCHandlers() {
    // List all available tools
    ipcMain.handle('tools:list', async () => {
        const { toolRegistry } = await import('../ai/tools');
        return toolRegistry.listMetadata();
    });

    // Get tool details
    ipcMain.handle('tools:get', async (_, toolName: string) => {
        const { toolRegistry } = await import('../ai/tools');
        const tool = toolRegistry.get(toolName);
        return tool ? {
            metadata: tool.metadata,
            help: tool.getHelp(),
        } : null;
    });

    // Execute a tool
    ipcMain.handle('tools:execute', async (_, toolName: string, params: any, context?: any) => {
        const { toolRegistry } = await import('../ai/tools');
        return toolRegistry.execute(toolName, params, context);
    });

    // Search tools
    ipcMain.handle('tools:search', async (_, query: {
        category?: string;
        tags?: string[];
        name?: string;
    }) => {
        const { toolRegistry } = await import('../ai/tools');
        const tools = toolRegistry.search(query as any);
        return tools.map(t => t.metadata);
    });

    // Get tool statistics
    ipcMain.handle('tools:stats', async () => {
        const { toolRegistry } = await import('../ai/tools');
        return toolRegistry.getStats();
    });

    // Get tools context for AI
    ipcMain.handle('tools:exportForAI', async () => {
        const { toolRegistry } = await import('../ai/tools');
        return toolRegistry.exportForAI();
    });

    // Enhanced orchestrator operations
    ipcMain.handle('orchestrator:executeTask', async (_, task: any) => {
        const { getEnhancedOrchestrator } = await import('../ai/orchestration/EnhancedOrchestrator');
        const orchestrator = getEnhancedOrchestrator();
        return orchestrator.executeTask(task);
    });

    ipcMain.handle('orchestrator:explainReasoning', async (_, task: any) => {
        const { getEnhancedOrchestrator } = await import('../ai/orchestration/EnhancedOrchestrator');
        const orchestrator = getEnhancedOrchestrator();
        return orchestrator.explainReasoning(task);
    });

    ipcMain.handle('orchestrator:getToolContext', async () => {
        const { getEnhancedOrchestrator } = await import('../ai/orchestration/EnhancedOrchestrator');
        const orchestrator = getEnhancedOrchestrator();
        return orchestrator.getToolContext();
    });

    console.log('✅ Tool IPC handlers registered');
}
