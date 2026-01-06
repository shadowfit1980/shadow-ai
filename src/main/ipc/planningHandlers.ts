/**
 * Planning System IPC Handlers
 * 
 * Exposes planning functionality to the renderer process
 */

import { ipcMain } from 'electron';

export function setupPlanningHandlers(): void {
    console.log('🔧 Setting up Planning IPC handlers...');

    // Check if planning is required
    ipcMain.handle('planning:requiresPlanning', async (_, userInput: string) => {
        try {
            const { getPlanningAgent } = await import('../ai/planning');
            const agent = getPlanningAgent();
            return agent.requiresPlanning(userInput);
        } catch (error: any) {
            console.error('Error checking planning requirement:', error.message);
            return false; // Default to not requiring planning on error
        }
    });

    // Analyze and create a plan
    ipcMain.handle('planning:analyze', async (_, userInput: string) => {
        try {
            const { getPlanningAgent } = await import('../ai/planning');
            const agent = getPlanningAgent();
            const result = await agent.createPlan(userInput);
            return {
                success: true,
                analysis: result.analysis,
                plan: result.plan,
                markdown: agent.generatePlanMarkdown(result.plan),
            };
        } catch (error: any) {
            console.error('Planning error:', error);
            return { success: false, error: error.message };
        }
    });

    // Execute a plan
    ipcMain.handle('planning:execute', async (_, plan: any) => {
        try {
            const { getPlanningAgent } = await import('../ai/planning');
            const agent = getPlanningAgent();

            const result = await agent.executePlan(plan, async (step) => {
                console.log(`Executing step: ${step.description}`);
                await new Promise(resolve => setTimeout(resolve, 500));
            });

            return result;
        } catch (error: any) {
            console.error('Plan execution error:', error);
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Planning IPC handlers registered');
}
