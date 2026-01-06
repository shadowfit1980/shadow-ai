/**
 * Action Executor IPC Handlers
 */

import { ipcMain } from 'electron';
import ActionExecutor from '../ai/automation/ActionExecutor';

export function registerActionExecutorHandlers(): void {
    const executor = ActionExecutor.getInstance();

    // Execute an action
    ipcMain.handle('action:execute', async (_event, type: string, params: Record<string, any>, context?: any) => {
        return executor.executeAction(type, params, context);
    });

    // Get available actions
    ipcMain.handle('action:getAvailable', async () => {
        return executor.getAvailableActions().map(a => ({
            type: a.type,
            name: a.name,
            description: a.description,
            parameters: a.parameters,
        }));
    });

    // Get execution history
    ipcMain.handle('action:getHistory', async (_event, limit?: number) => {
        return executor.getHistory(limit);
    });

    // Register a custom action (for plugins)
    ipcMain.handle('action:register', async (_event, actionDef: any) => {
        // Note: The executor function would need to be serialized/eval'd for this to work
        // This is mainly for internal use or trusted plugins
        console.log('Action registration requested:', actionDef.type);
        return { registered: false, reason: 'Custom action registration requires trusted context' };
    });

    console.log('⚙️ Action executor IPC handlers registered');
}
