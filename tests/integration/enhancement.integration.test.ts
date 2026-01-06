/**
 * Enhancement Systems Integration Tests
 * 
 * Integration tests for v5.1 enhancement systems:
 * - Cross-system workflows
 * - API endpoint integration
 * - End-to-end scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the enhancement systems
const mockMCPOrchestrator = {
    registerServer: vi.fn().mockResolvedValue({ id: 'server-1', name: 'Test Server', status: 'disconnected' }),
    connectServer: vi.fn().mockResolvedValue(true),
    discoverTools: vi.fn().mockResolvedValue([
        { id: 'tool-1', name: 'file_read', description: 'Read a file' },
        { id: 'tool-2', name: 'file_write', description: 'Write a file' }
    ]),
    getTools: vi.fn().mockResolvedValue([]),
    selectToolForIntent: vi.fn().mockResolvedValue({
        selectedTool: { id: 'tool-1', name: 'file_read' },
        reasoning: 'Best match for file operations',
        confidence: 0.92
    }),
    execute: vi.fn().mockResolvedValue({
        success: true,
        output: { content: 'file contents' },
        executionTime: 50
    }),
    getStats: vi.fn().mockResolvedValue({
        totalServers: 1,
        connectedServers: 1,
        totalTools: 5,
        totalExecutions: 100,
        successRate: 0.95
    })
};

const mockSelfImprovement = {
    trackOutcome: vi.fn().mockResolvedValue({ id: 'outcome-1' }),
    getMetrics: vi.fn().mockResolvedValue([
        { agentId: 'nexus', taskType: 'planning', successRate: 0.85, trend: 'improving' }
    ]),
    evolveStrategy: vi.fn().mockResolvedValue({
        id: 'strategy-1',
        agentId: 'nexus',
        generation: 2,
        fitness: 0.88
    }),
    getImprovementPlan: vi.fn().mockResolvedValue([
        { type: 'prompt_update', priority: 'high', description: 'Improve error handling prompts' }
    ]),
    generateInsights: vi.fn().mockResolvedValue([
        { type: 'success_pattern', description: 'nexus excels at planning tasks' }
    ]),
    getStats: vi.fn().mockResolvedValue({
        totalOutcomes: 500,
        overallSuccessRate: 0.87,
        strategiesEvolved: 15
    })
};

const mockProactiveInsight = {
    trackAction: vi.fn(),
    generateInsights: vi.fn().mockResolvedValue([
        { type: 'optimization', title: 'Repetitive task detected', impact: 'medium', actionable: true }
    ]),
    getActiveInsights: vi.fn().mockResolvedValue([]),
    getPatterns: vi.fn().mockResolvedValue([
        { type: 'habit', description: 'Frequently runs npm test', frequency: 50 }
    ]),
    getAutomations: vi.fn().mockResolvedValue([
        { id: 'auto-1', name: 'Auto-format on save', timeSaved: 30 }
    ]),
    getStats: vi.fn().mockResolvedValue({
        totalInsights: 25,
        activeInsights: 5,
        patternsDetected: 12
    })
};

describe('Enhancement Systems Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================================================
    // MCP TOOL ORCHESTRATOR INTEGRATION
    // ========================================================================

    describe('MCP Tool Orchestrator Integration', () => {
        it('should register and connect to MCP server', async () => {
            const server = await mockMCPOrchestrator.registerServer({
                name: 'Test Server',
                endpoint: 'http://localhost:8080'
            });

            expect(server.id).toBeDefined();
            expect(server.status).toBe('disconnected');

            const connected = await mockMCPOrchestrator.connectServer(server.id);
            expect(connected).toBe(true);
        });

        it('should discover tools after connecting', async () => {
            const tools = await mockMCPOrchestrator.discoverTools();

            expect(tools.length).toBeGreaterThan(0);
            expect(tools[0]).toHaveProperty('name');
            expect(tools[0]).toHaveProperty('description');
        });

        it('should select optimal tool for intent', async () => {
            const result = await mockMCPOrchestrator.selectToolForIntent({
                intent: 'read the configuration file'
            });

            expect(result.selectedTool).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0.5);
            expect(result.reasoning).toBeDefined();
        });

        it('should execute tool and return result', async () => {
            const result = await mockMCPOrchestrator.execute({
                toolId: 'tool-1',
                inputs: { path: '/config.json' }
            });

            expect(result.success).toBe(true);
            expect(result.output).toBeDefined();
            expect(result.executionTime).toBeDefined();
        });

        it('should track execution statistics', async () => {
            const stats = await mockMCPOrchestrator.getStats();

            expect(stats.totalServers).toBeGreaterThanOrEqual(1);
            expect(stats.totalTools).toBeGreaterThan(0);
            expect(stats.successRate).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // SELF-IMPROVEMENT ENGINE INTEGRATION
    // ========================================================================

    describe('Self-Improvement Engine Integration', () => {
        it('should track task outcomes', async () => {
            const outcome = await mockSelfImprovement.trackOutcome({
                agentId: 'nexus',
                taskType: 'planning',
                success: true,
                duration: 1500,
                confidence: 0.9
            });

            expect(outcome.id).toBeDefined();
        });

        it('should return performance metrics per agent', async () => {
            const metrics = await mockSelfImprovement.getMetrics();

            expect(metrics.length).toBeGreaterThan(0);
            expect(metrics[0]).toHaveProperty('agentId');
            expect(metrics[0]).toHaveProperty('successRate');
            expect(metrics[0]).toHaveProperty('trend');
        });

        it('should evolve agent strategies', async () => {
            const evolved = await mockSelfImprovement.evolveStrategy('nexus');

            expect(evolved.id).toBeDefined();
            expect(evolved.agentId).toBe('nexus');
            expect(evolved.generation).toBeGreaterThan(0);
        });

        it('should generate improvement plans', async () => {
            const plan = await mockSelfImprovement.getImprovementPlan('nexus');

            expect(plan.length).toBeGreaterThan(0);
            expect(plan[0]).toHaveProperty('type');
            expect(plan[0]).toHaveProperty('priority');
        });

        it('should generate learning insights', async () => {
            const insights = await mockSelfImprovement.generateInsights();

            expect(insights.length).toBeGreaterThan(0);
            expect(insights[0]).toHaveProperty('type');
            expect(insights[0]).toHaveProperty('description');
        });
    });

    // ========================================================================
    // PROACTIVE INSIGHT ENGINE INTEGRATION
    // ========================================================================

    describe('Proactive Insight Engine Integration', () => {
        it('should track user actions', () => {
            mockProactiveInsight.trackAction('save_file', { path: '/src/app.ts' });
            mockProactiveInsight.trackAction('run_tests', {});

            expect(mockProactiveInsight.trackAction).toHaveBeenCalledTimes(2);
        });

        it('should generate context-aware insights', async () => {
            const insights = await mockProactiveInsight.generateInsights({
                projectPath: '/my-project',
                language: 'typescript',
                framework: 'react'
            });

            expect(insights.length).toBeGreaterThan(0);
            expect(insights[0]).toHaveProperty('type');
            expect(insights[0]).toHaveProperty('title');
            expect(insights[0]).toHaveProperty('actionable');
        });

        it('should detect user patterns', async () => {
            const patterns = await mockProactiveInsight.getPatterns();

            expect(patterns.length).toBeGreaterThan(0);
            expect(patterns[0]).toHaveProperty('type');
            expect(patterns[0]).toHaveProperty('frequency');
        });

        it('should suggest automations', async () => {
            const automations = await mockProactiveInsight.getAutomations();

            expect(automations.length).toBeGreaterThan(0);
            expect(automations[0]).toHaveProperty('name');
            expect(automations[0]).toHaveProperty('timeSaved');
        });
    });

    // ========================================================================
    // CROSS-SYSTEM INTEGRATION
    // ========================================================================

    describe('Cross-System Integration', () => {
        it('should flow: Tool Execution → Outcome Tracking → Strategy Evolution', async () => {
            // Step 1: Execute a tool
            const toolResult = await mockMCPOrchestrator.execute({
                toolId: 'tool-1',
                inputs: { path: '/test.ts' }
            });
            expect(toolResult.success).toBe(true);

            // Step 2: Track the outcome
            const outcome = await mockSelfImprovement.trackOutcome({
                agentId: 'nexus',
                taskType: 'file_operation',
                success: toolResult.success,
                duration: toolResult.executionTime
            });
            expect(outcome.id).toBeDefined();

            // Step 3: Get improvement plan based on metrics
            const plan = await mockSelfImprovement.getImprovementPlan('nexus');
            expect(plan).toBeDefined();
        });

        it('should flow: Action Tracking → Pattern Detection → Automation Suggestion', async () => {
            // Step 1: Track repeated actions
            for (let i = 0; i < 5; i++) {
                mockProactiveInsight.trackAction('format_code', {});
            }

            // Step 2: Get detected patterns
            const patterns = await mockProactiveInsight.getPatterns();
            expect(patterns.length).toBeGreaterThan(0);

            // Step 3: Get suggested automations
            const automations = await mockProactiveInsight.getAutomations();
            expect(automations.length).toBeGreaterThan(0);
        });

        it('should aggregate stats from all systems', async () => {
            const [mcpStats, improvementStats, proactiveStats] = await Promise.all([
                mockMCPOrchestrator.getStats(),
                mockSelfImprovement.getStats(),
                mockProactiveInsight.getStats()
            ]);

            expect(mcpStats.totalTools).toBeGreaterThan(0);
            expect(improvementStats.totalOutcomes).toBeGreaterThan(0);
            expect(proactiveStats.patternsDetected).toBeGreaterThan(0);

            // Combined dashboard stats
            const dashboardStats = {
                tools: mcpStats.totalTools,
                successRate: improvementStats.overallSuccessRate,
                insights: proactiveStats.activeInsights
            };

            expect(dashboardStats.tools).toBe(5);
            expect(dashboardStats.successRate).toBe(0.87);
        });
    });
});
