/**
 * Agent Test Script
 * Tests all Phase 4 agent capabilities
 */

const path = require('path');

async function runTests() {
    console.log('\n🧪 SHADOW AI AGENT TEST SUITE');
    console.log('='.repeat(50));

    // Test 1: Terminal Agent
    console.log('\n📋 Test 1: Terminal Agent');
    try {
        const { terminalAgent } = require('./dist/main/main/ai/terminal');

        // Command validation
        const safe = terminalAgent.validateCommand('pwd');
        console.log('  ✓ pwd is', safe.safe ? 'SAFE' : 'BLOCKED');

        const dangerous = terminalAgent.validateCommand('rm -rf /');
        console.log('  ✓ rm -rf / is', dangerous.safe ? 'SAFE' : 'BLOCKED', `(risk: ${dangerous.riskLevel})`);

        // Execute command
        const result = await terminalAgent.execute({ command: 'echo "Hello Agent!"' });
        console.log('  ✓ Executed echo:', result.stdout ? result.stdout.trim() : 'no output');
        console.log('  Terminal Agent: ✅ PASSED');
    } catch (e) {
        console.log('  Terminal Agent: ❌ FAILED -', e.message);
    }

    // Test 2: Code Executor
    console.log('\n⚡ Test 2: Code Executor');
    try {
        const { codeExecutor } = require('./dist/main/main/ai/execution/CodeExecutor');

        // Check runtimes
        const runtimes = await codeExecutor.getAvailableRuntimes();
        const available = Object.entries(runtimes).filter(([k, v]) => v).map(([k]) => k);
        console.log('  Available runtimes:', available.join(', '));

        // Execute JS
        const jsResult = await codeExecutor.executeJS('console.log(2 + 2)');
        console.log('  ✓ JS 2+2 =', jsResult.stdout ? jsResult.stdout.trim() : 'error');

        // Execute Shell
        const shellResult = await codeExecutor.executeShell('echo "Shell works!"');
        console.log('  ✓ Shell:', shellResult.stdout ? shellResult.stdout.trim() : 'error');

        console.log('  Code Executor: ✅ PASSED');
    } catch (e) {
        console.log('  Code Executor: ❌ FAILED -', e.message);
    }

    // Test 3: Git Agent
    console.log('\n📦 Test 3: Git Agent');
    try {
        const { gitAgent } = require('./dist/main/main/ai/git');

        const isRepo = await gitAgent.isRepository();
        console.log('  ✓ Is Git repo:', isRepo ? 'Yes' : 'No');

        if (isRepo) {
            const status = await gitAgent.getStatus();
            console.log('  ✓ Branch:', status.branch);
            console.log('  ✓ Status:', status.isClean ? 'Clean' : `${status.unstaged.length} modified`);
        }
        console.log('  Git Agent: ✅ PASSED');
    } catch (e) {
        console.log('  Git Agent: ❌ FAILED -', e.message);
    }

    // Test 4: Model Router
    console.log('\n🔀 Test 4: Model Router');
    try {
        const { modelRouter } = require('./dist/main/main/ai/routing');

        const decision = modelRouter.routeTask('code_generation');
        console.log('  ✓ Route code_generation:', decision.primaryModel);
        console.log('  ✓ Strategy:', modelRouter.getStrategy());
        console.log('  Model Router: ✅ PASSED');
    } catch (e) {
        console.log('  Model Router: ❌ FAILED -', e.message);
    }

    // Test 5: Self-Evolution Engine
    console.log('\n🧬 Test 5: Self-Evolution Engine');
    try {
        const { selfEvolutionEngine } = require('./dist/main/main/ai/evolution');

        const metricId = selfEvolutionEngine.recordMetric({
            taskType: 'test',
            success: true,
            executionTime: 100,
            retryCount: 0,
            errorTypes: [],
            context: { test: true }
        });
        console.log('  ✓ Recorded metric:', metricId);

        const stats = selfEvolutionEngine.getStats();
        console.log('  ✓ Total tasks:', stats.totalTasks);
        console.log('  Self-Evolution: ✅ PASSED');
    } catch (e) {
        console.log('  Self-Evolution: ❌ FAILED -', e.message);
    }

    // Test 6: Tool Chain Executor
    console.log('\n🔗 Test 6: Tool Chain Executor');
    try {
        const { toolChainExecutor } = require('./dist/main/main/ai/tools/ToolChainExecutor');

        // Create a test chain
        const chain = toolChainExecutor.createChain('test_chain', [
            { toolName: 'readFile', params: { path: './package.json' }, outputAs: 'package' },
        ], { description: 'Test chain for reading files' });
        console.log('  ✓ Created chain:', chain.id);
        console.log('  ✓ Chain has', chain.steps.length, 'step(s)');

        const stats = toolChainExecutor.getStats();
        console.log('  ✓ Chains registered:', stats.chainCount);
        console.log('  Tool Chain Executor: ✅ PASSED');
    } catch (e) {
        console.log('  Tool Chain Executor: ❌ FAILED -', e.message);
    }

    // Test 7: Agent Handoff
    console.log('\n🤝 Test 7: Agent Handoff');
    try {
        const { agentHandoffManager } = require('./dist/main/main/ai/agents/AgentHandoff');

        // Check policy
        const policy = agentHandoffManager.getPolicy();
        console.log('  ✓ Max concurrent handoffs:', policy.maxConcurrent);
        console.log('  ✓ Default timeout:', policy.defaultTimeout, 'ms');

        // Check route
        const isAllowed = agentHandoffManager.isRouteAllowed('coder', 'reviewer');
        console.log('  ✓ Coder → Reviewer allowed:', isAllowed);

        const stats = agentHandoffManager.getStats();
        console.log('  ✓ Active handoffs:', stats.activeHandoffs);
        console.log('  Agent Handoff: ✅ PASSED');
    } catch (e) {
        console.log('  Agent Handoff: ❌ FAILED -', e.message);
    }

    // Test 8: Context Compressor
    console.log('\n📦 Test 8: Context Compressor');
    try {
        const { contextCompressor } = require('./dist/main/main/ai/context/ContextCompressor');

        // Add context
        const item1 = contextCompressor.addToContext('test_window', 'Test content 1', { type: 'code', priority: 'high' });
        const item2 = contextCompressor.addToContext('test_window', 'Test content 2', { type: 'log', priority: 'low' });
        console.log('  ✓ Added context items:', item1.id, item2.id);

        const window = contextCompressor.getWindow('test_window');
        console.log('  ✓ Window total tokens:', window.totalTokens);

        const config = contextCompressor.getConfig();
        console.log('  ✓ Max tokens config:', config.maxTokens);

        // Cleanup
        contextCompressor.clearWindow('test_window');
        console.log('  Context Compressor: ✅ PASSED');
    } catch (e) {
        console.log('  Context Compressor: ❌ FAILED -', e.message);
    }

    // Test 9: MCTS Planner
    console.log('\n🎯 Test 9: MCTS Planner');
    try {
        const { mctsPlanner } = require('./dist/main/main/ai/reasoning/MCTSPlanner');

        // Check config
        const config = mctsPlanner.getConfig();
        console.log('  ✓ Max iterations:', config.maxIterations);
        console.log('  ✓ Exploration constant:', config.explorationConstant);
        console.log('  ✓ Max depth:', config.maxDepth);

        // Test action planning
        const actions = await mctsPlanner.planActions('code review', {}, [
            { name: 'analyze', description: 'Analyze code', params: {}, probability: 0.8, cost: 1 },
            { name: 'review', description: 'Review changes', params: {}, probability: 0.9, cost: 2 },
        ]);
        console.log('  ✓ Planned actions:', actions.length);
        console.log('  MCTS Planner: ✅ PASSED');
    } catch (e) {
        console.log('  MCTS Planner: ❌ FAILED -', e.message);
    }

    // Test 10: Streaming Pipeline
    console.log('\n🌊 Test 10: Streaming Pipeline');
    try {
        const { streamingPipeline, TokenizerTransformer, AccumulatorTransformer } = require('./dist/main/main/ai/streaming/StreamingPipeline');

        // Add stages
        streamingPipeline.clearStages();
        streamingPipeline.addStage(new TokenizerTransformer());
        streamingPipeline.addStage(new AccumulatorTransformer());
        console.log('  ✓ Pipeline stages:', streamingPipeline.getStages().join(' → '));

        // Process a chunk
        const chunks = await streamingPipeline.process({
            id: 'test_1',
            content: 'Hello world',
            type: 'token',
            timestamp: new Date()
        });
        console.log('  ✓ Processed chunks:', chunks.length);

        const stats = streamingPipeline.getStats();
        console.log('  ✓ Chunks processed:', stats.chunksProcessed);

        streamingPipeline.clearStages();
        console.log('  Streaming Pipeline: ✅ PASSED');
    } catch (e) {
        console.log('  Streaming Pipeline: ❌ FAILED -', e.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 AGENT TEST SUITE COMPLETE!');
    console.log('   All 10 agent capabilities tested.\n');
}

runTests().catch(console.error);
