/**
 * Task Automation IPC Handlers
 */

import { ipcMain } from 'electron';
import { TaskAutomationEngine } from '../ai/automation/TaskAutomationEngine';

export function setupAutomationHandlers(): void {
    console.log('🔧 Setting up Automation IPC handlers...');

    const automation = TaskAutomationEngine.getInstance();

    // Get all tasks
    ipcMain.handle('automation:getTasks', async () => {
        return automation.getTasks();
    });

    // Get specific task
    ipcMain.handle('automation:getTask', async (_, id: string) => {
        return automation.getTask(id);
    });

    // Create task
    ipcMain.handle('automation:createTask', async (_, params: any) => {
        try {
            const task = automation.createTask(params);
            return { success: true, task };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Execute task
    ipcMain.handle('automation:executeTask', async (_, taskId: string) => {
        try {
            const result = await automation.executeTask(taskId);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Enable/disable task
    ipcMain.handle('automation:setEnabled', async (_, taskId: string, enabled: boolean) => {
        return automation.setEnabled(taskId, enabled);
    });

    // Delete task
    ipcMain.handle('automation:deleteTask', async (_, taskId: string) => {
        return automation.deleteTask(taskId);
    });

    // Trigger event
    ipcMain.handle('automation:triggerEvent', async (_, event: string, data: any) => {
        automation.handleEvent(event, data);
        return { success: true };
    });

    // Start engine
    ipcMain.handle('automation:start', async () => {
        automation.start();
        return { success: true };
    });

    // Stop engine
    ipcMain.handle('automation:stop', async () => {
        automation.stop();
        return { success: true };
    });

    // Auto-start the engine
    automation.start();

    console.log('✅ Automation IPC handlers registered');
}
