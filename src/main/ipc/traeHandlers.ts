/**
 * Trae Feature IPC Handlers
 * IPC bridge for MCP, Dev Containers, and CUE Engine
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let mcpClient: any = null;
let devContainerManager: any = null;
let cueEngine: any = null;

async function getMCPClient() {
    if (!mcpClient) {
        try {
            const { MCPClient } = await import('../mcp/MCPClient');
            mcpClient = MCPClient.getInstance();
        } catch (error) {
            console.warn('⚠️ MCPClient not available:', (error as Error).message);
            return null;
        }
    }
    return mcpClient;
}

async function getDevContainerManager() {
    if (!devContainerManager) {
        try {
            const { getDevContainerManager: getDCM } = await import('../containers/DevContainerManager');
            devContainerManager = getDCM();
        } catch (error) {
            console.warn('⚠️ DevContainerManager not available:', (error as Error).message);
            return null;
        }
    }
    return devContainerManager;
}

async function getCUEEngine() {
    if (!cueEngine) {
        try {
            const { getCUEEngine: getCUE } = await import('../prediction/CUEEngine');
            cueEngine = getCUE();
        } catch (error) {
            console.warn('⚠️ CUEEngine not available:', (error as Error).message);
            return null;
        }
    }
    return cueEngine;
}

/**
 * Setup Trae feature handlers
 */
export function setupTraeHandlers(): void {
    // === MCP CLIENT HANDLERS ===

    ipcMain.handle('mcp:connect', async (_, config: any) => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            return await mcp.connectServer(config);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('mcp:disconnect', async (_, { name }: { name: string }) => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            const result = await mcp.disconnectServer(name);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('mcp:listServers', async () => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            const servers = mcp.listServers();
            return { success: true, servers };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('mcp:listTools', async (_, { serverName }: { serverName?: string } = {}) => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            const tools = await mcp.listTools(serverName);
            return { success: true, tools };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('mcp:callTool', async (_, { serverName, toolName, args }: any) => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            const result = await mcp.callTool(serverName, toolName, args);
            return { success: true, result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('mcp:listResources', async (_, { serverName }: { serverName: string }) => {
        try {
            const mcp = await getMCPClient();
            if (!mcp) return { success: false, error: 'MCP client not available' };

            const resources = await mcp.listResources(serverName);
            return { success: true, resources };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === DEV CONTAINER HANDLERS ===

    ipcMain.handle('devcontainer:build', async (_, config: any) => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            return await dcm.buildContainer(config);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:start', async (_, { containerId }: { containerId: string }) => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            const result = await dcm.startContainer(containerId);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:stop', async (_, { containerId }: { containerId: string }) => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            const result = await dcm.stopContainer(containerId);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:exec', async (_, { containerId, command }: any) => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            return await dcm.execInContainer(containerId, command);
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:list', async () => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            const containers = dcm.listContainers();
            return { success: true, containers };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:remove', async (_, { containerId }: { containerId: string }) => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, error: 'Dev container manager not available' };

            const result = await dcm.removeContainer(containerId);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('devcontainer:isDockerAvailable', async () => {
        try {
            const dcm = await getDevContainerManager();
            if (!dcm) return { success: false, available: false };

            return { success: true, available: dcm.isDockerAvailable() };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CUE ENGINE HANDLERS ===

    ipcMain.handle('cue:predict', async (_, context: any) => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const prediction = await cue.predictNextEdit(context);
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cue:multiLineComplete', async (_, { context, maxLines }: any) => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const completions = await cue.getMultiLineCompletion(context, maxLines);
            return { success: true, completions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cue:smartImports', async (_, context: any) => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const imports = await cue.getSmartImports(context);
            return { success: true, imports };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cue:accept', async (_, { predictionId }: { predictionId: string }) => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const result = await cue.acceptPrediction(predictionId);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cue:reject', async (_, { predictionId }: { predictionId: string }) => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const result = await cue.rejectPrediction(predictionId);
            return { success: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('cue:getActive', async () => {
        try {
            const cue = await getCUEEngine();
            if (!cue) return { success: false, error: 'CUE engine not available' };

            const prediction = cue.getActivePrediction();
            return { success: true, prediction };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Trae feature IPC handlers registered');
}
