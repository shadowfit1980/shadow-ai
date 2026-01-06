/**
 * ShadowOrchestrator - Multi-Agent Coordination System
 * 
 * Orchestrates execution of multiple specialized AI agents to solve complex tasks
 * This is the brain of the multi-agent system
 */

import { getMemoryEngine } from '../memory';
import { TaskAnalyzer } from './TaskAnalyzer';
import { ExecutionPlanner } from './ExecutionPlanner';
import { BaseAgent } from './BaseAgent';
import { ArchitectAgent } from './specialized/ArchitectAgent';
import { CoderAgent } from './specialized/CoderAgent';
import { ReviewerAgent } from './specialized/ReviewerAgent';
import { DebuggerAgent } from './specialized/DebuggerAgent';
import { DevOpsAgent } from './specialized/DevOpsAgent';
import { DesignerAgent } from './specialized/DesignerAgent';
import {
    ComplexTask,
    TaskAnalysis,
    ExecutionPlan,
    ExecutionStep,
    AgentType,
    AgentResult,
    AgentContext,
    OrchestrationResult,
    QualityMetrics,
    ExecutionProgress,
    AgentEvent
} from './types';
import { EventEmitter } from 'events';

export class ShadowOrchestrator extends EventEmitter {
    private static instance: ShadowOrchestrator;

    private agents: Map<AgentType, BaseAgent>;
    private memory = getMemoryEngine();
    private taskAnalyzer = new TaskAnalyzer();
    private executionPlanner = new ExecutionPlanner();

    private constructor() {
        super();

        // Initialize all specialized agents
        this.agents = new Map();
        this.agents.set('architect', new ArchitectAgent());
        this.agents.set('coder', new CoderAgent());
        this.agents.set('reviewer', new ReviewerAgent());
        this.agents.set('debugger', new DebuggerAgent());
        this.agents.set('devops', new DevOpsAgent());
        this.agents.set('designer', new DesignerAgent());

        console.log('🤖 Shadow Orchestrator initialized with 6 specialized agents');
    }

    static getInstance(): ShadowOrchestrator {
        if (!ShadowOrchestrator.instance) {
            ShadowOrchestrator.instance = new ShadowOrchestrator();
        }
        return ShadowOrchestrator.instance;
    }

    /**
     * Main entry point - handle a complex task
     */
    async handleTask(task: ComplexTask): Promise<OrchestrationResult> {
        const startTime = Date.now();

        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log('║   Shadow AI Multi-Agent Orchestration             ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
        console.log(`📋 Task: ${task.description}`);

        try {
            // Step 1: Analyze the task
            this.emitProgress(task.id, 'planning', 0, 'Analyzing task requirements');
            const analysis = await this.analyzeTask(task);

            // Step 2: Create execution plan
            this.emitProgress(task.id, 'planning', 10, 'Creating execution plan');
            const plan = await this.planExecution(task, analysis);

            // Step 3: Execute the plan
            this.emitProgress(task.id, 'executing', 20, 'Beginning agent execution');
            const results = await this.executePlan(task, plan);

            // Step 4: Synthesize final result
            this.emitProgress(task.id, 'reviewing', 90, 'Synthesizing results');
            const finalOutput = await this.synthesizeResults(results, analysis);

            // Step 5: Calculate quality metrics
            const quality = this.calculateQuality(results);

            const totalDuration = (Date.now() - startTime) / 1000;

            this.emitProgress(task.id, 'complete', 100, 'Task complete!');

            console.log('\n✅ Orchestration Complete!');
            console.log(`   Duration: ${Math.round(totalDuration)}s`);
            console.log(`   Quality Score: ${(quality.overallScore * 100).toFixed(1)}%`);
            console.log(`   Steps: ${results.length}/${plan.steps.length}`);

            return {
                taskId: task.id,
                success: true,
                results,
                finalOutput,
                totalDuration,
                stepsCompleted: results.length,
                stepsTotal: plan.steps.length,
                quality
            };

        } catch (error: any) {
            console.error('\n❌ Orchestration Failed:', error.message);

            this.emitProgress(task.id, 'failed', 0, error.message);

            return {
                taskId: task.id,
                success: false,
                results: [],
                finalOutput: null,
                totalDuration: (Date.now() - startTime) / 1000,
                stepsCompleted: 0,
                stepsTotal: 0,
                quality: {
                    overallScore: 0
                }
            };
        }
    }

    /**
     * Analyze the task to understand requirements
     */
    private async analyzeTask(task: ComplexTask): Promise<TaskAnalysis> {
        console.log('\n🔍 Phase 1: Task Analysis');
        console.log('─'.repeat(50));

        const analysis = await this.taskAnalyzer.analyze(task);

        console.log(`   Type: ${analysis.type}`);
        console.log(`   Complexity: ${analysis.complexity}`);
        console.log(`   Agents needed: ${analysis.requiredAgents.join(', ')}`);

        if (analysis.risks.length > 0) {
            console.log(`   Risks: ${analysis.risks.length}`);
        }

        return analysis;
    }

    /**
     * Create an execution plan
     */
    private async planExecution(task: ComplexTask, analysis: TaskAnalysis): Promise<ExecutionPlan> {
        console.log('\n📋 Phase 2: Execution Planning');
        console.log('─'.repeat(50));

        const plan = await this.executionPlanner.plan(task, analysis);

        console.log(`   Steps: ${plan.steps.length}`);
        console.log(`   Estimated time: ~${Math.round(plan.estimatedDuration / 60)} minutes`);
        console.log(`   Risk level: ${plan.riskLevel}`);

        return plan;
    }

    /**
     * Execute the plan step by step
     */
    private async executePlan(task: ComplexTask, plan: ExecutionPlan): Promise<AgentResult[]> {
        console.log('\n🚀 Phase 3: Agent Execution');
        console.log('─'.repeat(50));

        const results: AgentResult[] = [];
        const completedSteps = new Set<string>();

        // Execute steps in dependency order
        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];

            // Check if dependencies are met
            const depsMet = step.dependencies.every(dep => completedSteps.has(dep));

            if (!depsMet) {
                console.warn(`⚠️  Skipping step ${step.id} - dependencies not met`);
                continue;
            }

            // Build context for this step
            const context: AgentContext = {
                previousResults: results,
                memory: await this.memory.getRelevantContext(step.description),
                currentStep: step,
                plan
            };

            // Get the appropriate agent
            const agent = this.agents.get(step.agentType);
            if (!agent) {
                console.error(`❌ Agent not found: ${step.agentType}`);
                continue;
            }

            // Emit progress
            const percentage = 20 + Math.round((i / plan.steps.length) * 70);
            this.emitProgress(
                task.id,
                'executing',
                percentage,
                `Executing: ${agent.metadata.name}`,
                step.agentType
            );

            // Emit event
            this.emitEvent({
                type: 'step_start',
                timestamp: new Date(),
                agentType: step.agentType,
                stepId: step.id,
                message: `${agent.metadata.name} starting: ${step.description}`
            });

            try {
                // Execute step
                const result = await agent.execute(step, context);

                results.push(result);
                completedSteps.add(step.id);

                // Emit success event
                this.emitEvent({
                    type: 'step_complete',
                    timestamp: new Date(),
                    agentType: step.agentType,
                    stepId: step.id,
                    message: `${agent.metadata.name} completed successfully`,
                    data: { confidence: result.confidence }
                });

                // Check if we need to replan
                if (result.requiresReplanning) {
                    console.log('\n⚠️  Replanning required based on agent feedback');
                    this.emitEvent({
                        type: 'replanning',
                        timestamp: new Date(),
                        agentType: step.agentType,
                        message: 'Replanning execution'
                    });

                    // For now, continue with current plan
                    // In future, could dynamically adjust the plan
                }

            } catch (error: any) {
                console.error(`❌ Step failed: ${step.id}`, error.message);

                // Emit failure event
                this.emitEvent({
                    type: 'step_failed',
                    timestamp: new Date(),
                    agentType: step.agentType,
                    stepId: step.id,
                    message: `${agent.metadata.name} failed: ${error.message}`
                });

                // Add failure result
                results.push({
                    stepId: step.id,
                    agentType: step.agentType,
                    success: false,
                    output: null,
                    duration: 0,
                    issues: [{
                        severity: 'critical',
                        description: error.message
                    }]
                });
            }
        }

        return results;
    }

    /**
     * Synthesize results from all agents into final output
     */
    private async synthesizeResults(results: AgentResult[], analysis: TaskAnalysis): Promise<any> {
        console.log('\n🔄 Phase 4: Result Synthesis');
        console.log('─'.repeat(50));

        const output: any = {
            type: analysis.type,
            agents: {}
        };

        // Collect outputs from each agent type
        for (const result of results) {
            if (result.success && result.output) {
                output.agents[result.agentType] = result.output;
            }
        }

        // Add metadata
        output.metadata = {
            completedSteps: results.filter(r => r.success).length,
            totalSteps: results.length,
            averageConfidence: this.calculateAverageConfidence(results),
            totalIssues: results.reduce((sum, r) => sum + (r.issues?.length || 0), 0)
        };

        console.log(`   Outputs collected from ${Object.keys(output.agents).length} agents`);

        return output;
    }

    /**
     * Calculate quality metrics
     */
    private calculateQuality(results: AgentResult[]): QualityMetrics {
        const successfulResults = results.filter(r => r.success);

        const codeQuality = this.extractMetric(results, 'reviewer', 'overallScore');
        const testCoverage = this.extractMetric(results, 'debugger', 'coverage');
        const confidenceAvg = this.calculateAverageConfidence(results);

        const overallScore = (
            (codeQuality || 0.5) * 0.3 +
            ((testCoverage || 50) / 100) * 0.2 +
            (confidenceAvg || 0.5) * 0.3 +
            (successfulResults.length / results.length) * 0.2
        );

        return {
            codeQuality,
            testCoverage,
            securityScore: codeQuality, // Reviewer includes security
            performanceScore: undefined,
            overallScore
        };
    }

    private extractMetric(results: AgentResult[], agentType: AgentType, metric: string): number | undefined {
        const result = results.find(r => r.agentType === agentType && r.success);
        return result?.output?.[metric];
    }

    private calculateAverageConfidence(results: AgentResult[]): number {
        const confidences = results
            .filter(r => r.confidence !== undefined)
            .map(r => r.confidence!);

        if (confidences.length === 0) return 0.5;

        return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    }

    /**
     * Emit progress update
     */
    private emitProgress(
        taskId: string,
        status: 'planning' | 'executing' | 'reviewing' | 'complete' | 'failed',
        percentage: number,
        message: string,
        currentAgent?: AgentType
    ) {
        const progress: ExecutionProgress = {
            taskId,
            currentStep: 0,
            totalSteps: 0,
            currentAgent: currentAgent || 'architect',
            status,
            message,
            percentage
        };

        this.emit('progress', progress);
    }

    /**
     * Emit agent event
     */
    private emitEvent(event: AgentEvent) {
        this.emit('event', event);
    }

    /**
     * Get plan without executing (for preview)
     */
    async getPlan(task: ComplexTask): Promise<{ analysis: TaskAnalysis; plan: ExecutionPlan }> {
        const analysis = await this.analyzeTask(task);
        const plan = await this.planExecution(task, analysis);

        return { analysis, plan };
    }

    /**
     * Consult a specific agent (for agent-to-agent communication)
     */
    async consultAgent(agentType: AgentType, question: string, context?: any): Promise<string> {
        const agent = this.agents.get(agentType);
        if (!agent) {
            return `Agent ${agentType} not available`;
        }

        // Simple consultation - could be enhanced
        return `${agent.metadata.name} says: This feature is not yet fully implemented`;
    }
}

/**
 * Get singleton instance
 */
export function getOrchestrator(): ShadowOrchestrator {
    return ShadowOrchestrator.getInstance();
}
