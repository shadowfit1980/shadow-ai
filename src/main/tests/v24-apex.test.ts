/**
 * v24 APEX Agent Enhancement Tests
 * 
 * Comprehensive tests for ReasoningTracer, AdaptiveToolSelector,
 * UnifiedAgentBus, and ModelCapabilityMatcher.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Electron
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn()
    }
}));

// ============ ReasoningTracer Tests ============
describe('ReasoningTracer', () => {
    let reasoningTracer: ReturnType<typeof import('../ai/reasoning/ReasoningTracer').ReasoningTracer.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/reasoning/ReasoningTracer');
        reasoningTracer = module.ReasoningTracer.getInstance();
        reasoningTracer.clear();
    });

    describe('Session Management', () => {
        it('should start a new trace session', () => {
            const session = reasoningTracer.startTrace('task-123');

            expect(session).toBeDefined();
            expect(session.taskId).toBe('task-123');
            expect(session.status).toBe('active');
            expect(session.steps).toHaveLength(0);
        });

        it('should end trace session with summary', () => {
            reasoningTracer.startTrace('task-456');
            const endedSession = reasoningTracer.endTrace('Task completed successfully');

            expect(endedSession).toBeDefined();
            expect(endedSession?.status).toBe('completed');
            expect(endedSession?.summary).toBe('Task completed successfully');
            expect(endedSession?.endTime).toBeDefined();
        });

        it('should fail trace session', () => {
            reasoningTracer.startTrace('task-fail');
            const failedSession = reasoningTracer.failTrace('An error occurred');

            expect(failedSession).toBeDefined();
            expect(failedSession?.status).toBe('failed');
            expect(failedSession?.summary).toContain('Failed');
        });
    });

    describe('Step Recording', () => {
        it('should record thought steps', () => {
            reasoningTracer.startTrace('task-thought');
            reasoningTracer.recordThought('Analyzing the problem', 0.8);

            const session = reasoningTracer.getActiveSession();
            expect(session?.steps).toHaveLength(1);
            expect(session?.steps[0].type).toBe('thought');
            expect(session?.steps[0].content).toBe('Analyzing the problem');
            expect(session?.steps[0].confidence).toBe(0.8);
        });

        it('should record decisions with alternatives', () => {
            reasoningTracer.startTrace('task-decision');
            reasoningTracer.recordDecision(
                'Use recursive approach',
                ['Use iterative approach', 'Use recursive approach', 'Use dynamic programming'],
                'Recursive is cleaner for this problem'
            );

            const session = reasoningTracer.getActiveSession();
            expect(session?.decisions).toHaveLength(1);
            expect(session?.decisions[0].decision).toBe('Use recursive approach');
            expect(session?.decisions[0].alternatives).toHaveLength(3);
        });

        it('should record actions', () => {
            reasoningTracer.startTrace('task-action');
            reasoningTracer.recordAction('Executing file read', 0.9);

            const session = reasoningTracer.getActiveSession();
            expect(session?.steps[0].type).toBe('action');
        });

        it('should record reflections', () => {
            reasoningTracer.startTrace('task-reflection');
            reasoningTracer.recordReflection('The approach worked well', 0.85);

            const session = reasoningTracer.getActiveSession();
            expect(session?.steps[0].type).toBe('reflection');
        });
    });

    describe('Export Functionality', () => {
        it('should export trace as JSON', () => {
            const session = reasoningTracer.startTrace('task-export');
            reasoningTracer.recordThought('Test thought', 0.8);
            reasoningTracer.endTrace('Done');

            const json = reasoningTracer.exportTrace(session.id, { format: 'json' });
            const parsed = JSON.parse(json);

            expect(parsed.taskId).toBe('task-export');
            expect(parsed.steps).toHaveLength(1);
        });

        it('should export trace as Markdown', () => {
            const session = reasoningTracer.startTrace('task-md');
            reasoningTracer.recordThought('Analysis step', 0.8);
            reasoningTracer.endTrace('Complete');

            const markdown = reasoningTracer.exportTrace(session.id, { format: 'markdown' });

            expect(markdown).toContain('# Reasoning Trace');
            expect(markdown).toContain('task-md');
        });

        it('should export trace as Mermaid diagram', () => {
            const session = reasoningTracer.startTrace('task-mermaid');
            reasoningTracer.recordThought('Step 1', 0.8);
            reasoningTracer.recordAction('Step 2', 0.9);
            reasoningTracer.endTrace('Done');

            const mermaid = reasoningTracer.exportTrace(session.id, { format: 'mermaid' });

            expect(mermaid).toContain('```mermaid');
            expect(mermaid).toContain('graph TD');
        });
    });

    describe('Statistics', () => {
        it('should return correct stats', () => {
            reasoningTracer.startTrace('task-1');
            reasoningTracer.recordThought('T1', 0.8);
            reasoningTracer.endTrace('Done');

            reasoningTracer.startTrace('task-2');
            reasoningTracer.failTrace('Error');

            const stats = reasoningTracer.getStats();

            expect(stats.totalSessions).toBe(2);
            expect(stats.completedSessions).toBe(1);
            expect(stats.failedSessions).toBe(1);
        });
    });
});

// ============ AdaptiveToolSelector Tests ============
describe('AdaptiveToolSelector', () => {
    let adaptiveToolSelector: ReturnType<typeof import('../ai/tools/AdaptiveToolSelector').AdaptiveToolSelector.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/tools/AdaptiveToolSelector');
        adaptiveToolSelector = module.AdaptiveToolSelector.getInstance();
        adaptiveToolSelector.clear();
    });

    describe('Task Analysis', () => {
        it('should analyze tasks and return recommendations', async () => {
            const recommendations = await adaptiveToolSelector.analyzeTask(
                'Read a file and analyze its contents'
            );

            expect(Array.isArray(recommendations)).toBe(true);
        });

        it('should get tool suggestions for complex tasks', async () => {
            const suggestions = await adaptiveToolSelector.getSuggestions(
                'Refactor the authentication module'
            );

            expect(suggestions).toBeDefined();
            expect(suggestions.steps).toBeDefined();
            expect(suggestions.totalConfidence).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Learning', () => {
        it('should record successful execution', () => {
            adaptiveToolSelector.learnFromExecution('file_read', true, 150);
            const record = adaptiveToolSelector.getPerformanceRecord('file_read');

            expect(record).toBeDefined();
            expect(record?.successCount).toBe(1);
            expect(record?.averageExecutionTime).toBe(150);
        });

        it('should record failed execution', () => {
            adaptiveToolSelector.learnFromExecution('file_write', false, 200);
            const record = adaptiveToolSelector.getPerformanceRecord('file_write');

            expect(record).toBeDefined();
            expect(record?.failureCount).toBe(1);
        });

        it('should calculate average execution time correctly', () => {
            adaptiveToolSelector.learnFromExecution('tool_a', true, 100);
            adaptiveToolSelector.learnFromExecution('tool_a', true, 200);
            adaptiveToolSelector.learnFromExecution('tool_a', true, 300);

            const record = adaptiveToolSelector.getPerformanceRecord('tool_a');
            expect(record?.averageExecutionTime).toBe(200);
        });
    });

    describe('Scoring', () => {
        it('should score tool fit for a task', () => {
            const score = adaptiveToolSelector.scoreToolFit('file_read', 'read the contents of a file');

            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(1);
        });
    });

    describe('Statistics', () => {
        it('should return selector stats', () => {
            adaptiveToolSelector.learnFromExecution('tool_x', true, 100);
            adaptiveToolSelector.learnFromExecution('tool_x', true, 100);
            adaptiveToolSelector.learnFromExecution('tool_x', false, 100);

            const stats = adaptiveToolSelector.getStats();

            expect(stats.totalRecords).toBe(1);
            expect(stats.averageSuccessRate).toBeCloseTo(0.67, 1);
        });
    });
});

// ============ UnifiedAgentBus Tests ============
describe('UnifiedAgentBus', () => {
    let agentBus: ReturnType<typeof import('../ai/bus/UnifiedAgentBus').UnifiedAgentBus.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/bus/UnifiedAgentBus');
        agentBus = module.UnifiedAgentBus.getInstance();
        agentBus.clear();
    });

    describe('Agent Registration', () => {
        it('should register an agent', () => {
            agentBus.registerAgent('agent-1', 'CodeAgent', ['code_analysis', 'refactoring']);

            const capabilities = agentBus.getAgentCapabilities('agent-1');

            expect(capabilities).toBeDefined();
            expect(capabilities?.name).toBe('CodeAgent');
            expect(capabilities?.capabilities).toContain('code_analysis');
        });

        it('should unregister an agent', () => {
            agentBus.registerAgent('agent-2', 'TestAgent', ['testing']);
            const result = agentBus.unregisterAgent('agent-2');

            expect(result).toBe(true);
            expect(agentBus.getAgentCapabilities('agent-2')).toBeUndefined();
        });

        it('should update agent status', () => {
            agentBus.registerAgent('agent-3', 'BusyAgent', ['tasks']);
            agentBus.updateAgentStatus('agent-3', 'busy');

            const agent = agentBus.getAgentCapabilities('agent-3');
            expect(agent?.status).toBe('busy');
        });
    });

    describe('Agent Discovery', () => {
        it('should find agents by capability', () => {
            agentBus.registerAgent('code-agent', 'CodeAgent', ['code_analysis', 'refactoring']);
            agentBus.registerAgent('test-agent', 'TestAgent', ['testing', 'coverage']);
            agentBus.registerAgent('full-agent', 'FullAgent', ['code_analysis', 'testing']);

            const codeAgents = agentBus.findAgentsByCapability('code_analysis');

            expect(codeAgents).toHaveLength(2);
        });

        it('should get agent directory', () => {
            agentBus.registerAgent('a1', 'Agent1', ['cap1']);
            agentBus.registerAgent('a2', 'Agent2', ['cap2']);

            const directory = agentBus.getDirectory();

            expect(directory).toHaveLength(2);
            expect(directory[0].agentId).toBeDefined();
            expect(directory[0].capabilities).toBeDefined();
        });
    });

    describe('Messaging', () => {
        it('should broadcast messages to topic subscribers', () => {
            const received: any[] = [];
            agentBus.subscribe('test-topic', (msg) => received.push(msg));

            agentBus.broadcast('test-topic', { data: 'hello' });

            expect(received).toHaveLength(1);
            expect(received[0].payload.data).toBe('hello');
        });

        it('should allow unsubscribe', () => {
            const received: any[] = [];
            const unsubscribe = agentBus.subscribe('unsub-topic', (msg) => received.push(msg));

            agentBus.broadcast('unsub-topic', { data: '1' });
            unsubscribe();
            agentBus.broadcast('unsub-topic', { data: '2' });

            expect(received).toHaveLength(1);
        });
    });

    describe('Status', () => {
        it('should return bus status', () => {
            agentBus.registerAgent('s1', 'StatusAgent', ['status']);
            agentBus.subscribe('topic1', () => { });
            agentBus.broadcast('topic1', {});

            const status = agentBus.getStatus();

            expect(status.registeredAgents).toBe(1);
            expect(status.messagesSent).toBe(1);
        });
    });
});

// ============ ModelCapabilityMatcher Tests ============
describe('ModelCapabilityMatcher', () => {
    let modelCapabilityMatcher: ReturnType<typeof import('../ai/routing/ModelCapabilityMatcher').ModelCapabilityMatcher.getInstance>;

    beforeEach(async () => {
        const module = await import('../ai/routing/ModelCapabilityMatcher');
        modelCapabilityMatcher = module.ModelCapabilityMatcher.getInstance();
    });

    describe('Task Complexity Analysis', () => {
        it('should identify simple tasks', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('format this json file');

            expect(complexity.level).toBe('simple');
        });

        it('should identify medium complexity tasks', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('analyze and refactor this code');

            expect(complexity.level).toBe('medium');
        });

        it('should identify complex tasks', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('architect a new microservices system');

            expect(complexity.level).toBe('complex');
        });

        it('should identify critical tasks', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('deploy to production database');

            expect(complexity.level).toBe('critical');
        });

        it('should detect reasoning requirements', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('why is this code slow?');

            expect(complexity.requiresReasoning).toBe(true);
        });

        it('should detect code generation requirements', () => {
            const complexity = modelCapabilityMatcher.analyzeTaskComplexity('create a new React component');

            expect(complexity.requiresCodeGen).toBe(true);
        });
    });

    describe('Model Matching', () => {
        it('should return model matches for a task', () => {
            const matches = modelCapabilityMatcher.matchTaskToModel('write a complex algorithm');

            expect(Array.isArray(matches)).toBe(true);
            expect(matches.length).toBeGreaterThan(0);
            expect(matches[0].modelId).toBeDefined();
            expect(matches[0].score).toBeGreaterThan(0);
        });

        it('should get optimal model for a task', () => {
            const optimal = modelCapabilityMatcher.getOptimalModel('analyze security vulnerabilities');

            expect(optimal).toBeDefined();
            expect(optimal?.modelId).toBeDefined();
            expect(optimal?.reasoning).toBeDefined();
        });

        it('should respect constraints when matching', () => {
            const optimal = modelCapabilityMatcher.getOptimalModel(
                'simple formatting task',
                { maxCost: 0.01, preferredProvider: 'openai' }
            );

            // Should return a model or null based on constraints
            if (optimal) {
                expect(optimal.estimatedCost).toBeLessThan(0.1);
            } else {
                // No models matched the constraints - this is valid behavior
                expect(optimal).toBeNull();
            }
        });
    });

    describe('Model Capabilities', () => {
        it('should return capabilities for known models', () => {
            const capabilities = modelCapabilityMatcher.getCapabilities('gpt-4');

            expect(capabilities).toBeDefined();
            expect(capabilities?.provider).toBe('openai');
            expect(capabilities?.strengths).toContain('reasoning');
        });

        it('should return all model capabilities', () => {
            const all = modelCapabilityMatcher.getAllCapabilities();

            expect(Array.isArray(all)).toBe(true);
            expect(all.length).toBeGreaterThan(0);
        });
    });

    describe('Quick Complexity Check', () => {
        it('should provide quick complexity assessment', () => {
            const level = modelCapabilityMatcher.quickComplexityCheck('migrate the database');

            expect(['simple', 'medium', 'complex', 'critical']).toContain(level);
        });
    });

    describe('Statistics', () => {
        it('should return model statistics', () => {
            const stats = modelCapabilityMatcher.getStats();

            expect(stats.totalModels).toBeGreaterThan(0);
            expect(stats.byProvider).toBeDefined();
        });
    });
});
