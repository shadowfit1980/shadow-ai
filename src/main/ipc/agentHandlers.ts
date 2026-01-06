/**
 * Agent IPC Handlers
 * 
 * Exposes VisionAgent and RedTeamAgent to renderer
 */

import { ipcMain } from 'electron';
import { VisionAgent } from '../ai/agents/VisionAgent';
import { RedTeamAgent } from '../ai/agents/RedTeamAgent';

export function setupAgentHandlers(): void {
    console.log('🔧 Setting up Agent IPC handlers...');

    const visionAgent = VisionAgent.getInstance();
    const redTeamAgent = RedTeamAgent.getInstance();

    // ====================== VisionAgent ======================

    // Convert image/mockup to code
    ipcMain.handle('vision:imageToCode', async (_, params: {
        imageBase64?: string;
        imageUrl?: string;
        description?: string;
        framework?: 'react' | 'vue' | 'svelte' | 'html';
        style?: 'minimal' | 'modern' | 'enterprise';
    }) => {
        try {
            const result = await visionAgent.imageToCode(params);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // ====================== RedTeamAgent ======================

    // Test code for vulnerabilities
    ipcMain.handle('redteam:testCode', async (_, params: {
        code: string;
        language: string;
        context?: Record<string, any>;
    }) => {
        try {
            const result = await redTeamAgent.testCode(params);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Get attack vectors
    ipcMain.handle('redteam:getAttackVectors', async () => {
        return redTeamAgent.getAttackVectors();
    });

    // Add custom attack vector
    ipcMain.handle('redteam:addAttackVector', async (_, vector: {
        name: string;
        category: string;
        payload: any;
        description: string;
    }) => {
        redTeamAgent.addAttackVector(vector);
        return { success: true };
    });

    console.log('✅ Agent IPC handlers registered');
}
