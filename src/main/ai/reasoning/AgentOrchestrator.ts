import {
    Task,
    Step,
    ExecutionResult,
    ExecutionPlan,
    ToolDefinition,
} from './types';
import { DependencyResolver } from './DependencyResolver';
import { ReasoningEngine } from './ReasoningEngine';
import { HybridExecutor } from './executors/HybridExecutor';

export class AgentOrchestrator {
    private dependencyResolver: DependencyResolver;
    private reasoningEngine: ReasoningEngine;
    private executor: HybridExecutor;
    private tools: Map<string, ToolDefinition> = new Map();

    constructor() {
        this.dependencyResolver = new DependencyResolver();
        this.reasoningEngine = new ReasoningEngine();
        this.executor = new HybridExecutor();
    }

    /**
     * Execute a complex task with multi-step reasoning
     */
    async executeTask(task: Task): Promise<ExecutionResult> {
        const startTime = Date.now();
        console.log(`🚀 Starting task: ${task.description}`);

        try {
            // Step 1: Apply reasoning
            const reasoning = await this.reasoningEngine.reason(
                task.description,
                task.context
            );
            console.log(`🧠 Reasoning complete. Confidence: ${(reasoning.confidence * 100).toFixed(0)}%`);

            // Step 2: Break down task into steps
            const steps = await this.breakdownTask(task, reasoning.conclusion);
            console.log(`📋 Task broken down into ${steps.length} steps`);

            // Step 3: Analyze dependencies
            const graph = this.dependencyResolver.resolve(steps);
            const groups = this.dependencyResolver.findParallelGroups(graph);
            console.log(`🔗 Identified ${groups.length} execution levels`);

            // Step 4: Create execution plan
            const plan: ExecutionPlan = {
                groups,
                totalSteps: steps.length,
                estimatedDuration: this.dependencyResolver.estimateDuration(groups),
            };

            // Step 5: Execute plan
            const stepResults = await this.executor.execute(plan.groups);

            // Step 6: Aggregate results
            const success = stepResults.every(r => r.success);
            const completedSteps = stepResults.filter(r => r.success).length;
            const failedSteps = stepResults.filter(r => !r.success).length;
            const errors = stepResults
                .filter(r => !r.success)
                .map(r => r.error)
                .filter((e): e is Error => e !== undefined);

            return {
                taskId: task.id,
                success,
                steps: stepResults,
                duration: Date.now() - startTime,
                errors,
                completedSteps,
                failedSteps,
            };
        } catch (error: any) {
            console.error('❌ Task execution failed:', error);

            return {
                taskId: task.id,
                success: false,
                steps: [],
                duration: Date.now() - startTime,
                errors: [error],
                completedSteps: 0,
                failedSteps: 0,
            };
        }
    }

    /**
     * Break down task into atomic steps
     */
    private async breakdownTask(task: Task, reasoning: string): Promise<Step[]> {
        const steps: Step[] = [];

        // Simple breakdown based on task description
        const lower = task.description.toLowerCase();

        if (lower.includes('create') || lower.includes('build')) {
            steps.push(
                this.createStep('prepare', 'Prepare environment', []),
                this.createStep('implement', 'Implement core logic', ['prepare']),
                this.createStep('test', 'Test implementation', ['implement']),
                this.createStep('validate', 'Validate results', ['test'])
            );
        } else if (lower.includes('refactor')) {
            steps.push(
                this.createStep('analyze', 'Analyze current code', []),
                this.createStep('plan', 'Plan refactoring', ['analyze']),
                this.createStep('apply', 'Apply changes', ['plan']),
                this.createStep('verify', 'Verify functionality', ['apply'])
            );
        } else if (lower.includes('integrate')) {
            steps.push(
                this.createStep('setup_a', 'Setup system A', []),
                this.createStep('setup_b', 'Setup system B', []),
                this.createStep('connect', 'Connect systems', ['setup_a', 'setup_b']),
                this.createStep('test_integration', 'Test integration', ['connect'])
            );
        } else {
            // Generic breakdown
            steps.push(
                this.createStep('analyze', 'Analyze task', []),
                this.createStep('execute', 'Execute task', ['analyze']),
                this.createStep('verify', 'Verify completion', ['execute'])
            );
        }

        return steps;
    }

    /**
     * Create a step with default values
     */
    private createStep(
        id: string,
        description: string,
        dependencies: string[]
    ): Step {
        return {
            id,
            action: description,
            description,
            inputs: {},
            outputs: [],
            dependencies,
            retryable: true,
            status: 'pending',
        };
    }

    /**
     * Register a tool for step execution
     */
    registerTool(tool: ToolDefinition): void {
        this.tools.set(tool.name, tool);
        this.executor.registerTool(tool);
    }

    /**
     * Get reasoning explanation for a task
     */
    async explainReasoning(task: Task): Promise<string> {
        const reasoning = await this.reasoningEngine.reason(task.description, task.context);
        return this.reasoningEngine.explainReasoning(reasoning);
    }
}

// Singleton instance
let instance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
    if (!instance) {
        instance = new AgentOrchestrator();
    }
    return instance;
}
