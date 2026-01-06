/**
 * 🎭 GenericIPCHandlers - Replace 834 handlers with ~25 generic ones
 * 
 * Claude's Recommendation: ≤30 generic handlers
 * Data-driven dispatch via ToolRegistry
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { ToolRegistry, toolRegistry } from './ToolRegistry';
import { UnifiedExecutionEngine, unifiedExecutionEngine } from './UnifiedExecutionEngine';
import { TimelineManager, timelineManager } from './TimelineManager';
import { PluginSystem, pluginSystem } from './PluginSystem';
import { InfiniteContextEngine, infiniteContextEngine } from './InfiniteContextEngine';

export function registerGenericIPCHandlers(): void {
    console.log('🔌 Registering generic IPC handlers...');

    // ==========================================
    // TOOL EXECUTION (replaces 600+ service handlers)
    // ==========================================

    ipcMain.handle('tool:invoke', async (_event: IpcMainInvokeEvent, toolName: string, input: Record<string, unknown>) => {
        return toolRegistry.invoke(toolName, input);
    });

    ipcMain.handle('tool:stream', async function* (_event: IpcMainInvokeEvent, toolName: string, input: Record<string, unknown>) {
        for await (const chunk of toolRegistry.stream(toolName, input)) {
            yield chunk;
        }
    });

    ipcMain.handle('tool:list', async () => {
        return toolRegistry.list();
    });

    ipcMain.handle('tool:query', async (_event: IpcMainInvokeEvent, query: Record<string, unknown>) => {
        return toolRegistry.query(query as any);
    });

    ipcMain.handle('tool:count', async () => {
        return toolRegistry.count();
    });

    // ==========================================
    // AI EXECUTION (replaces provider-specific handlers)
    // ==========================================

    ipcMain.handle('ai:execute', async (_event: IpcMainInvokeEvent, request: Record<string, unknown>) => {
        return unifiedExecutionEngine.execute(request as any);
    });

    ipcMain.handle('ai:stream', async function* (_event: IpcMainInvokeEvent, request: Record<string, unknown>) {
        for await (const chunk of unifiedExecutionEngine.stream(request as any)) {
            yield chunk;
        }
    });

    ipcMain.handle('ai:providers', async () => {
        return unifiedExecutionEngine.getAvailableProviders();
    });

    // ==========================================
    // TIMELINE (undo/redo/branching)
    // ==========================================

    ipcMain.handle('timeline:record', async (_event: IpcMainInvokeEvent, action: Record<string, unknown>) => {
        return timelineManager.record(action as any);
    });

    ipcMain.handle('timeline:undo', async () => {
        return timelineManager.undo();
    });

    ipcMain.handle('timeline:redo', async () => {
        return timelineManager.redo();
    });

    ipcMain.handle('timeline:goto', async (_event: IpcMainInvokeEvent, nodeId: string) => {
        return timelineManager.goto(nodeId);
    });

    ipcMain.handle('timeline:fork', async (_event: IpcMainInvokeEvent, branchName: string, description?: string) => {
        return timelineManager.fork(branchName, description);
    });

    ipcMain.handle('timeline:switchBranch', async (_event: IpcMainInvokeEvent, branchName: string) => {
        return timelineManager.switchBranch(branchName);
    });

    ipcMain.handle('timeline:view', async () => {
        return timelineManager.getView();
    });

    ipcMain.handle('timeline:history', async (_event: IpcMainInvokeEvent, limit?: number) => {
        return timelineManager.getRecentHistory(limit);
    });

    // ==========================================
    // PLUGINS
    // ==========================================

    ipcMain.handle('plugin:list', async () => {
        return pluginSystem.listPlugins();
    });

    ipcMain.handle('plugin:install', async (_event: IpcMainInvokeEvent, source: string) => {
        return pluginSystem.installPlugin(source);
    });

    ipcMain.handle('plugin:uninstall', async (_event: IpcMainInvokeEvent, pluginId: string) => {
        return pluginSystem.uninstallPlugin(pluginId);
    });

    ipcMain.handle('plugin:enable', async (_event: IpcMainInvokeEvent, pluginId: string) => {
        return pluginSystem.enablePlugin(pluginId);
    });

    ipcMain.handle('plugin:disable', async (_event: IpcMainInvokeEvent, pluginId: string) => {
        return pluginSystem.disablePlugin(pluginId);
    });

    // ==========================================
    // CONTEXT / RETRIEVAL
    // ==========================================

    ipcMain.handle('context:index', async (_event: IpcMainInvokeEvent, rootPath: string) => {
        return infiniteContextEngine.indexCodebase(rootPath);
    });

    ipcMain.handle('context:retrieve', async (_event: IpcMainInvokeEvent, query: Record<string, unknown>) => {
        return infiniteContextEngine.retrieve(query as any);
    });

    ipcMain.handle('context:related', async (_event: IpcMainInvokeEvent, nodeId: string, depth?: number) => {
        return infiniteContextEngine.findRelated(nodeId, depth);
    });

    ipcMain.handle('context:stats', async () => {
        return infiniteContextEngine.getStats();
    });

    console.log('✅ 25 generic IPC handlers registered (replaces 834)');
    console.log('🧠 UnifiedExecutionEngine ready');
    console.log('⏱️ TimelineManager ready');
    console.log('🔌 PluginSystem ready');
    console.log('🔍 InfiniteContextEngine ready');
}

// Export for use in main process
export { toolRegistry, unifiedExecutionEngine, timelineManager, pluginSystem, infiniteContextEngine };
