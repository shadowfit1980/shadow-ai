/**
 * MCP IPC Handlers
 * 
 * IPC handlers for MCP Server and Client management
 */

import { ipcMain } from 'electron';
import { MCPClient } from '../mcp/MCPClient';

export function registerMCPHandlers() {
    const client = MCPClient.getInstance();

    // Server management
    ipcMain.handle('mcp:addServer', async (_, config) => {
        client.addServer(config);
        return true;
    });

    ipcMain.handle('mcp:removeServer', async (_, id) => {
        await client.removeServer(id);
        return true;
    });

    ipcMain.handle('mcp:connect', async (_, serverId) => {
        return client.connect(serverId);
    });

    ipcMain.handle('mcp:disconnect', async (_, serverId) => {
        await client.disconnect(serverId);
        return true;
    });

    ipcMain.handle('mcp:getServers', async () => {
        return client.getServers();
    });

    ipcMain.handle('mcp:isConnected', async (_, serverId) => {
        return client.isConnected(serverId);
    });

    // Tool operations
    ipcMain.handle('mcp:getAllTools', async () => {
        return client.getAllTools();
    });

    ipcMain.handle('mcp:callTool', async (_, serverId, toolName, args) => {
        return client.callTool(serverId, toolName, args);
    });

    // Resource operations
    ipcMain.handle('mcp:readResource', async (_, serverId, uri) => {
        return client.readResource(serverId, uri);
    });

    // Prompt operations
    ipcMain.handle('mcp:getPrompt', async (_, serverId, name, args) => {
        return client.getPrompt(serverId, name, args);
    });

    // Preset n8n configuration
    ipcMain.handle('mcp:addN8nServer', async (_, n8nPath) => {
        client.addServer({
            id: 'n8n',
            name: 'n8n Workflow Automation',
            command: 'npx',
            args: ['-y', '@n8n/n8n-nodes-langchain', 'mcp'],
            enabled: true,
        });
        return true;
    });
}
