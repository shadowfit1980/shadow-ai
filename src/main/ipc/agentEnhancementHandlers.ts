/**
 * Agent Enhancement IPC Handlers
 * 
 * Exposes the new agent enhancement capabilities to the renderer process:
 * - Tool Chain Executor
 * - Agent Handoff Manager
 * - Context Compressor  
 * - MCTS Planner
 * - Streaming Pipeline
 */

import { ipcMain } from 'electron';

export function registerAgentEnhancementHandlers(): void {
    console.log('🔧 Registering agent enhancement handlers...');

    // =========================================================================
    // Tool Chain Executor
    // =========================================================================

    ipcMain.handle('tools:createChain', async (_event, id: string, steps: any[], options?: any) => {
        const { toolChainExecutor } = await import('../ai/tools/ToolChainExecutor');
        return toolChainExecutor.createChain(id, steps, options);
    });

    ipcMain.handle('tools:executeChain', async (_event, chainId: string, initialInput?: any) => {
        const { toolChainExecutor } = await import('../ai/tools/ToolChainExecutor');
        return await toolChainExecutor.execute(chainId, initialInput);
    });

    ipcMain.handle('tools:getChainStats', async () => {
        const { toolChainExecutor } = await import('../ai/tools/ToolChainExecutor');
        return toolChainExecutor.getStats();
    });

    ipcMain.handle('tools:getExecutionHistory', async (_event, limit?: number) => {
        const { toolChainExecutor } = await import('../ai/tools/ToolChainExecutor');
        return toolChainExecutor.getHistory(limit);
    });

    // =========================================================================
    // Agent Handoff Manager
    // =========================================================================

    ipcMain.handle('handoff:request', async (_event, sourceAgent: string, targetAgent: string, task: string, options?: any) => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.requestHandoff(sourceAgent as any, targetAgent as any, task, options);
    });

    ipcMain.handle('handoff:accept', async (_event, requestId: string) => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.accept(requestId);
    });

    ipcMain.handle('handoff:complete', async (_event, requestId: string, result: any, learnings?: string[]) => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.complete(requestId, result, learnings);
    });

    ipcMain.handle('handoff:getPending', async (_event, agentType: string) => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.getPendingHandoffs(agentType as any);
    });

    ipcMain.handle('handoff:getStats', async () => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.getStats();
    });

    ipcMain.handle('handoff:getPolicy', async () => {
        const { agentHandoffManager } = await import('../ai/agents/AgentHandoff');
        return agentHandoffManager.getPolicy();
    });

    // =========================================================================
    // Context Compressor
    // =========================================================================

    ipcMain.handle('context:addItem', async (_event, windowId: string, content: string, options?: any) => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.addToContext(windowId, content, options);
    });

    ipcMain.handle('context:getWindow', async (_event, windowId: string) => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.getWindow(windowId);
    });

    ipcMain.handle('context:compress', async (_event, windowId: string) => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.compress(windowId);
    });

    ipcMain.handle('context:getStats', async () => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.getStats();
    });

    ipcMain.handle('context:createCheckpoint', async (_event, windowId: string) => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.createCheckpoint(windowId);
    });

    ipcMain.handle('context:getHierarchy', async (_event, windowId: string) => {
        const { contextCompressor } = await import('../ai/context/ContextCompressor');
        return contextCompressor.createHierarchicalSummary(windowId);
    });

    // =========================================================================
    // MCTS Planner
    // =========================================================================

    ipcMain.handle('planner:planActions', async (_event, goal: string, context: any, actions: any[]) => {
        const { mctsPlanner } = await import('../ai/reasoning/MCTSPlanner');
        return await mctsPlanner.planActions(goal, context, actions);
    });

    ipcMain.handle('planner:getConfig', async () => {
        const { mctsPlanner } = await import('../ai/reasoning/MCTSPlanner');
        return mctsPlanner.getConfig();
    });

    ipcMain.handle('planner:setConfig', async (_event, config: any) => {
        const { mctsPlanner } = await import('../ai/reasoning/MCTSPlanner');
        mctsPlanner.setConfig(config);
        return mctsPlanner.getConfig();
    });

    // =========================================================================
    // Streaming Pipeline
    // =========================================================================

    ipcMain.handle('streaming:addStage', async (_event, stageName: string) => {
        const { streamingPipeline, TokenizerTransformer, JSONParserTransformer, ValidatorTransformer, AccumulatorTransformer } =
            await import('../ai/streaming/StreamingPipeline');

        const stages: Record<string, any> = {
            'tokenizer': TokenizerTransformer,
            'json_parser': JSONParserTransformer,
            'validator': ValidatorTransformer,
            'accumulator': AccumulatorTransformer
        };

        const StageClass = stages[stageName];
        if (StageClass) {
            streamingPipeline.addStage(new StageClass());
            return { success: true, stage: stageName };
        }
        return { success: false, error: `Unknown stage: ${stageName}` };
    });

    ipcMain.handle('streaming:getStages', async () => {
        const { streamingPipeline } = await import('../ai/streaming/StreamingPipeline');
        return streamingPipeline.getStages();
    });

    ipcMain.handle('streaming:getStats', async () => {
        const { streamingPipeline } = await import('../ai/streaming/StreamingPipeline');
        return streamingPipeline.getStats();
    });

    ipcMain.handle('streaming:clearStages', async () => {
        const { streamingPipeline } = await import('../ai/streaming/StreamingPipeline');
        streamingPipeline.clearStages();
        return { success: true };
    });

    ipcMain.handle('streaming:process', async (_event, chunk: any) => {
        const { streamingPipeline } = await import('../ai/streaming/StreamingPipeline');
        return await streamingPipeline.process(chunk);
    });

    // =========================================================================
    // v24 APEX: Reasoning Tracer
    // =========================================================================

    ipcMain.handle('reasoning:startTrace', async (_event, taskId: string) => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        return reasoningTracer.startTrace(taskId);
    });

    ipcMain.handle('reasoning:endTrace', async (_event, summary?: string) => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        return reasoningTracer.endTrace(summary);
    });

    ipcMain.handle('reasoning:recordThought', async (_event, content: string, confidence?: number) => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        reasoningTracer.recordThought(content, confidence);
        return { success: true };
    });

    ipcMain.handle('reasoning:recordDecision', async (_event, decision: string, alternatives: string[], rationale: string) => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        reasoningTracer.recordDecision(decision, alternatives, rationale);
        return { success: true };
    });

    ipcMain.handle('reasoning:getSession', async (_event, sessionId: string) => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        return reasoningTracer.getSession(sessionId);
    });

    ipcMain.handle('reasoning:exportTrace', async (_event, sessionId: string, format: 'json' | 'markdown' | 'mermaid') => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        return reasoningTracer.exportTrace(sessionId, { format });
    });

    ipcMain.handle('reasoning:getStats', async () => {
        const { reasoningTracer } = await import('../ai/reasoning/ReasoningTracer');
        return reasoningTracer.getStats();
    });

    // =========================================================================
    // v24 APEX: Adaptive Tool Selector
    // =========================================================================

    ipcMain.handle('toolSelector:analyzeTask', async (_event, description: string, context?: any) => {
        const { adaptiveToolSelector } = await import('../ai/tools/AdaptiveToolSelector');
        return await adaptiveToolSelector.analyzeTask(description, context);
    });

    ipcMain.handle('toolSelector:getAIRecommendations', async (_event, description: string, context?: any) => {
        const { adaptiveToolSelector } = await import('../ai/tools/AdaptiveToolSelector');
        return await adaptiveToolSelector.getAIRecommendations(description, context);
    });

    ipcMain.handle('toolSelector:getSuggestions', async (_event, description: string) => {
        const { adaptiveToolSelector } = await import('../ai/tools/AdaptiveToolSelector');
        return await adaptiveToolSelector.getSuggestions(description);
    });

    ipcMain.handle('toolSelector:learnFromExecution', async (_event, toolName: string, success: boolean, executionTimeMs: number) => {
        const { adaptiveToolSelector } = await import('../ai/tools/AdaptiveToolSelector');
        adaptiveToolSelector.learnFromExecution(toolName, success, executionTimeMs);
        return { success: true };
    });

    ipcMain.handle('toolSelector:getStats', async () => {
        const { adaptiveToolSelector } = await import('../ai/tools/AdaptiveToolSelector');
        return adaptiveToolSelector.getStats();
    });

    // =========================================================================
    // v24 APEX: Unified Agent Bus
    // =========================================================================

    ipcMain.handle('agentBus:registerAgent', async (_event, agentId: string, name: string, capabilities: string[]) => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        agentBus.registerAgent(agentId, name, capabilities);
        return { success: true };
    });

    ipcMain.handle('agentBus:getStatus', async () => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        return agentBus.getStatus();
    });

    ipcMain.handle('agentBus:getDirectory', async () => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        return agentBus.getDirectory();
    });

    ipcMain.handle('agentBus:findAgentsByCapability', async (_event, capability: string) => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        return agentBus.findAgentsByCapability(capability);
    });

    ipcMain.handle('agentBus:delegate', async (_event, capability: string, request: any) => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        return await agentBus.delegate(capability, request);
    });

    ipcMain.handle('agentBus:broadcast', async (_event, topic: string, payload: any) => {
        const { agentBus } = await import('../ai/bus/UnifiedAgentBus');
        agentBus.broadcast(topic, payload);
        return { success: true };
    });

    // =========================================================================
    // v24 APEX: Model Capability Matcher
    // =========================================================================

    ipcMain.handle('modelMatcher:analyzeComplexity', async (_event, description: string) => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.analyzeTaskComplexity(description);
    });

    ipcMain.handle('modelMatcher:matchTaskToModel', async (_event, description: string, requiredCapabilities?: string[]) => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.matchTaskToModel(description, requiredCapabilities);
    });

    ipcMain.handle('modelMatcher:getOptimalModel', async (_event, description: string, constraints?: any) => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.getOptimalModel(description, constraints);
    });

    ipcMain.handle('modelMatcher:getCapabilities', async (_event, modelId: string) => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.getCapabilities(modelId);
    });

    ipcMain.handle('modelMatcher:getAllCapabilities', async () => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.getAllCapabilities();
    });

    ipcMain.handle('modelMatcher:getStats', async () => {
        const { modelCapabilityMatcher } = await import('../ai/routing/ModelCapabilityMatcher');
        return modelCapabilityMatcher.getStats();
    });

    console.log('✅ Agent enhancement handlers registered (including v24 APEX)');
}
