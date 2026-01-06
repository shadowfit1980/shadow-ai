/**
 * Extended Feature IPC Handlers
 * IPC bridge for Flow Builder, Agent Copilot, and Messaging Channels
 */

import { ipcMain } from 'electron';

// Lazy-loaded services
let flowBuilder: any = null;
let agentCopilot: any = null;
let channelManager: any = null;

async function getFlowBuilder() {
    if (!flowBuilder) {
        try {
            const { getFlowBuilder: getBuilder } = await import('../flows/FlowBuilder');
            flowBuilder = getBuilder();
        } catch (error) {
            console.warn('⚠️ FlowBuilder not available:', (error as Error).message);
            return null;
        }
    }
    return flowBuilder;
}

async function getAgentCopilot() {
    if (!agentCopilot) {
        try {
            const { getAgentCopilot: getCopilot } = await import('../assistants/AgentCopilot');
            agentCopilot = getCopilot();
        } catch (error) {
            console.warn('⚠️ AgentCopilot not available:', (error as Error).message);
            return null;
        }
    }
    return agentCopilot;
}

async function getChannelManager() {
    if (!channelManager) {
        try {
            const { getChannelManager: getManager } = await import('../channels/ChannelManager');
            channelManager = getManager();
        } catch (error) {
            console.warn('⚠️ ChannelManager not available:', (error as Error).message);
            return null;
        }
    }
    return channelManager;
}

/**
 * Setup extended feature IPC handlers
 */
export function setupExtendedHandlers(): void {
    // === FLOW BUILDER HANDLERS ===

    ipcMain.handle('flow:create', async (_, options: any) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const flow = builder.createFlow(options);
            return { success: true, flow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:get', async (_, { id }: { id: string }) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const flow = builder.getFlow(id);
            return { success: true, flow };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:list', async () => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const flows = builder.getAllFlows();
            return { success: true, flows };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:addNode', async (_, { flowId, type, label, position, data }: any) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const node = builder.addNode(flowId, type, label, position, data);
            return { success: true, node };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:addConnection', async (_, { flowId, sourceId, targetId, options }: any) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const connection = builder.addConnection(flowId, sourceId, targetId, options);
            return { success: true, connection };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:validate', async (_, { flowId }: { flowId: string }) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const result = builder.validateFlow(flowId);
            return { success: true, ...result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flow:generateCode', async (_, { flowId }: { flowId: string }) => {
        try {
            const builder = await getFlowBuilder();
            if (!builder) return { success: false, error: 'Flow builder not available' };

            const code = builder.generateCode(flowId);
            return { success: true, code };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === AGENT COPILOT HANDLERS ===

    ipcMain.handle('copilot:startSession', async (_, { agentId, conversationId }: any) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const session = copilot.startSession(agentId, conversationId);
            return { success: true, session };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:addMessage', async (_, { sessionId, role, content }: any) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const suggestions = await copilot.addMessage(sessionId, role, content);
            return { success: true, suggestions };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:getSuggestions', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const session = copilot.getSession(sessionId);
            return { success: true, suggestions: session?.suggestions || [] };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:generateSummary', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const summary = await copilot.generateSummary(sessionId);
            return { success: true, summary };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:detectIntent', async (_, { sessionId }: { sessionId: string }) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const intent = await copilot.detectIntent(sessionId);
            return { success: true, intent };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('copilot:searchKnowledge', async (_, { query }: { query: string }) => {
        try {
            const copilot = await getAgentCopilot();
            if (!copilot) return { success: false, error: 'Agent copilot not available' };

            const results = copilot.searchKnowledge(query);
            return { success: true, results };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // === CHANNEL MANAGER HANDLERS ===

    ipcMain.handle('channel:configure', async (_, config: any) => {
        try {
            const manager = await getChannelManager();
            if (!manager) return { success: false, error: 'Channel manager not available' };

            manager.configureChannel(config);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('channel:list', async () => {
        try {
            const manager = await getChannelManager();
            if (!manager) return { success: false, error: 'Channel manager not available' };

            const channels = manager.getAllChannels();
            return { success: true, channels };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('channel:send', async (_, { channelType, to, content }: any) => {
        try {
            const manager = await getChannelManager();
            if (!manager) return { success: false, error: 'Channel manager not available' };

            const message = await manager.sendMessage(channelType, to, content);
            return { success: true, message };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('channel:sendTemplate', async (_, { channelType, to, templateName, params }: any) => {
        try {
            const manager = await getChannelManager();
            if (!manager) return { success: false, error: 'Channel manager not available' };

            const message = await manager.sendTemplate(channelType, to, templateName, params);
            return { success: true, message };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('channel:stats', async (_, { channelType }: any = {}) => {
        try {
            const manager = await getChannelManager();
            if (!manager) return { success: false, error: 'Channel manager not available' };

            const stats = manager.getChannelStats(channelType);
            return { success: true, stats };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    console.log('✅ Extended feature IPC handlers registered');
}
