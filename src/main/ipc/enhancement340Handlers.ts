/**
 * Enhancement 340+ IPC Handlers - AWS Bedrock Agentic AI features
 */

import { ipcMain } from 'electron';

export function setupEnhancement340Handlers(): void {
    // BEDROCK AGENT
    ipcMain.handle('bedrockagent:create', async (_, { name, model, instructions }: any) => {
        try { const { getBedrockAgentEngine } = await import('../bedrockagent/BedrockAgentEngine'); return { success: true, agent: getBedrockAgentEngine().create(name, model, instructions) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // KNOWLEDGE BASE
    ipcMain.handle('knowledgebase:create', async (_, { name, dataSourceType, embeddingModel }: any) => {
        try { const { getKnowledgeBaseEngine } = await import('../knowledgebase/KnowledgeBaseEngine'); return { success: true, kb: getKnowledgeBaseEngine().create(name, dataSourceType, embeddingModel) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // ACTION GROUP
    ipcMain.handle('actiongroup:create', async (_, { name, actions }: any) => {
        try { const { getActionGroupEngine } = await import('../actiongroup/ActionGroupEngine'); return { success: true, group: getActionGroupEngine().create(name, actions) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT EXECUTOR
    ipcMain.handle('agentexec:execute', async (_, { agentId, sessionId, input }: any) => {
        try { const { getAgentExecutorEngine } = await import('../agentexecutor/AgentExecutorEngine'); return { success: true, execution: await getAgentExecutorEngine().execute(agentId, sessionId, input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // SESSION MANAGER
    ipcMain.handle('session:create', async (_, { agentId, userId }: any) => {
        try { const { getSessionManagerEngine } = await import('../sessionmgr/SessionManagerEngine'); return { success: true, session: getSessionManagerEngine().create(agentId, userId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // GUARDRAILS
    ipcMain.handle('guardrails:evaluate', async (_, { guardrailId, text, direction }: any) => {
        try { const { getGuardrailsEngine } = await import('../guardrails/GuardrailsEngine'); return { success: true, result: getGuardrailsEngine().evaluate(guardrailId, text, direction) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // PROMPT ROUTER
    ipcMain.handle('promptrouter:route', async (_, { prompt }: any) => {
        try { const { getPromptRouterEngine } = await import('../promptrouter/PromptRouterEngine'); return { success: true, decision: getPromptRouterEngine().route(prompt) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT MEMORY
    ipcMain.handle('agentmem:store', async (_, { agentId, type, content, importance }: any) => {
        try { const { getAgentMemoryEngine } = await import('../agentmemory/AgentMemoryEngine'); return { success: true, entry: getAgentMemoryEngine().store(agentId, type, content, importance) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // TOOL ORCHESTRATOR
    ipcMain.handle('toolorch:executeChain', async (_, { chainId, input }: any) => {
        try { const { getToolOrchestratorEngine } = await import('../toolorch/ToolOrchestratorEngine'); return { success: true, results: await getToolOrchestratorEngine().executeChain(chainId, input) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    // AGENT ANALYTICS
    ipcMain.handle('agentanalytics:getMetrics', async (_, { agentId }: any) => {
        try { const { getAgentAnalyticsEngine } = await import('../agentanalytics/AgentAnalyticsEngine'); return { success: true, metrics: getAgentAnalyticsEngine().getMetrics(agentId) }; }
        catch (error: any) { return { success: false, error: error.message }; }
    });

    console.log('✅ Enhancement 340+ IPC handlers registered (10 handlers)');
}
