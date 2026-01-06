/**
 * Enhancement IPC Handlers
 * 
 * IPC handlers for the v5.1 enhancement systems:
 * - MCP Tool Orchestrator
 * - Self-Improvement Engine
 * - Proactive Insight Engine
 */

import { ipcMain } from 'electron';
import { mcpToolOrchestrator } from '../ai/mcp/MCPToolOrchestrator';
import { selfImprovementEngine } from '../ai/evolution/SelfImprovementEngine';
import { proactiveInsightEngine } from '../ai/proactive/ProactiveInsightEngine';

export function registerEnhancementHandlers(): void {
    console.log('[enhancementHandlers] Registering 30 enhancement handlers...');

    // ========================================================================
    // MCP TOOL ORCHESTRATOR
    // ========================================================================

    // Register MCP server
    ipcMain.handle('mcp:register-server', async (_, server) => {
        return mcpToolOrchestrator.registerServer(server);
    });

    // Connect to MCP server
    ipcMain.handle('mcp:connect-server', async (_, serverId: string) => {
        return mcpToolOrchestrator.connectServer(serverId);
    });

    // Disconnect from MCP server
    ipcMain.handle('mcp:disconnect-server', async (_, serverId: string) => {
        mcpToolOrchestrator.disconnectServer(serverId);
        return { success: true };
    });

    // Get all servers
    ipcMain.handle('mcp:get-servers', async () => {
        return mcpToolOrchestrator.getServers();
    });

    // Get connected servers
    ipcMain.handle('mcp:get-connected-servers', async () => {
        return mcpToolOrchestrator.getConnectedServers();
    });

    // Discover all tools
    ipcMain.handle('mcp:discover-tools', async () => {
        return mcpToolOrchestrator.discoverAllTools();
    });

    // Get all tools
    ipcMain.handle('mcp:get-tools', async () => {
        return mcpToolOrchestrator.getTools();
    });

    // Search tools
    ipcMain.handle('mcp:search-tools', async (_, query: string) => {
        return mcpToolOrchestrator.searchTools(query);
    });

    // Select tool for intent
    ipcMain.handle('mcp:select-tool', async (_, criteria) => {
        return mcpToolOrchestrator.selectToolForIntent(criteria);
    });

    // Execute tool
    ipcMain.handle('mcp:execute-tool', async (_, request) => {
        return mcpToolOrchestrator.execute(request);
    });

    // Execute for intent
    ipcMain.handle('mcp:execute-for-intent', async (_, { intent, context }) => {
        return mcpToolOrchestrator.executeForIntent(intent, context);
    });

    // Get execution history
    ipcMain.handle('mcp:get-history', async (_, limit?: number) => {
        return mcpToolOrchestrator.getExecutionHistory(limit);
    });

    // Get MCP stats
    ipcMain.handle('mcp:get-stats', async () => {
        return mcpToolOrchestrator.getStats();
    });

    // ========================================================================
    // SELF-IMPROVEMENT ENGINE
    // ========================================================================

    // Track outcome
    ipcMain.handle('improvement:track-outcome', async (_, outcome) => {
        return selfImprovementEngine.trackOutcome(outcome);
    });

    // Get metrics
    ipcMain.handle('improvement:get-metrics', async () => {
        return selfImprovementEngine.getMetrics();
    });

    // Get agent metrics
    ipcMain.handle('improvement:get-agent-metrics', async (_, agentId: string) => {
        return selfImprovementEngine.getAgentMetrics(agentId);
    });

    // Register prompt variant
    ipcMain.handle('improvement:register-variant', async (_, { basePromptId, variant, description }) => {
        return selfImprovementEngine.registerPromptVariant(basePromptId, variant, description);
    });

    // Get best prompt
    ipcMain.handle('improvement:get-best-prompt', async (_, basePromptId: string) => {
        return selfImprovementEngine.getBestPrompt(basePromptId);
    });

    // Record prompt test
    ipcMain.handle('improvement:record-test', async (_, { variantId, success, duration }) => {
        selfImprovementEngine.recordPromptTest(variantId, success, duration);
        return { success: true };
    });

    // Suggest prompt improvement
    ipcMain.handle('improvement:suggest-prompt', async (_, { currentPrompt, outcomes }) => {
        return selfImprovementEngine.suggestPromptImprovement(currentPrompt, outcomes);
    });

    // Evolve strategy
    ipcMain.handle('improvement:evolve-strategy', async (_, agentId: string) => {
        return selfImprovementEngine.evolveStrategy(agentId);
    });

    // Get strategy
    ipcMain.handle('improvement:get-strategy', async (_, agentId: string) => {
        return selfImprovementEngine.getStrategy(agentId);
    });

    // Get strategy history
    ipcMain.handle('improvement:get-strategy-history', async (_, agentId: string) => {
        return selfImprovementEngine.getStrategyHistory(agentId);
    });

    // Get improvement plan
    ipcMain.handle('improvement:get-plan', async (_, agentId: string) => {
        return selfImprovementEngine.getImprovementPlan(agentId);
    });

    // Generate insights
    ipcMain.handle('improvement:generate-insights', async () => {
        return selfImprovementEngine.generateInsights();
    });

    // Get stats
    ipcMain.handle('improvement:get-stats', async () => {
        return selfImprovementEngine.getStats();
    });

    // Export data
    ipcMain.handle('improvement:export-data', async () => {
        return selfImprovementEngine.exportData();
    });

    // Import data
    ipcMain.handle('improvement:import-data', async (_, data) => {
        selfImprovementEngine.importData(data);
        return { success: true };
    });

    // ========================================================================
    // PROACTIVE INSIGHT ENGINE
    // ========================================================================

    // Track action
    ipcMain.handle('proactive:track-action', async (_, { action, metadata }) => {
        proactiveInsightEngine.trackAction(action, metadata);
        return { success: true };
    });

    // Generate insights
    ipcMain.handle('proactive:generate-insights', async (_, context) => {
        return proactiveInsightEngine.generateInsights(context);
    });

    // Get active insights
    ipcMain.handle('proactive:get-insights', async () => {
        return proactiveInsightEngine.getActiveInsights();
    });

    // Get insights by type
    ipcMain.handle('proactive:get-insights-by-type', async (_, type) => {
        return proactiveInsightEngine.getInsightsByType(type);
    });

    // Dismiss insight
    ipcMain.handle('proactive:dismiss-insight', async (_, insightId: string) => {
        proactiveInsightEngine.dismissInsight(insightId);
        return { success: true };
    });

    // Mark insight as acted upon
    ipcMain.handle('proactive:mark-acted', async (_, insightId: string) => {
        proactiveInsightEngine.markActedUpon(insightId);
        return { success: true };
    });

    // Get patterns
    ipcMain.handle('proactive:get-patterns', async () => {
        return proactiveInsightEngine.getPatterns();
    });

    // Get automations
    ipcMain.handle('proactive:get-automations', async () => {
        return proactiveInsightEngine.getAutomations();
    });

    // Update quality metric
    ipcMain.handle('proactive:update-quality', async (_, { metric, value }) => {
        proactiveInsightEngine.updateQualityMetric(metric, value);
        return { success: true };
    });

    // Update dependency health
    ipcMain.handle('proactive:update-dependency', async (_, health) => {
        proactiveInsightEngine.updateDependencyHealth(health);
        return { success: true };
    });

    // Get stats
    ipcMain.handle('proactive:get-stats', async () => {
        return proactiveInsightEngine.getStats();
    });

    console.log('[enhancementHandlers] ✅ 30 enhancement handlers registered');
}
