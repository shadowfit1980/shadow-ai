/**
 * Agentic Loop System
 * 
 * True autonomous task decomposition with self-correction,
 * reflection, and goal-oriented planning with rollback capability.
 */

import { EventEmitter } from 'events';
import { ModelManager } from '../ModelManager';
import { GoalTracker, Goal, GoalStatus } from './GoalTracker';
import { PolicyStore, ModeManager } from '../safety';
import { MetricsCollector } from '../metrics';
import { contextCompressor } from '../context/ContextCompressor';
// v24 APEX Imports
import { reasoningTracer, TraceSession } from '../reasoning/ReasoningTracer';
import { adaptiveToolSelector, ToolRecommendation } from '../tools/AdaptiveToolSelector';
import { agentBus } from '../bus/UnifiedAgentBus';
import { modelCapabilityMatcher } from '../routing/ModelCapabilityMatcher';

// ============================================================================
// TYPES
// ============================================================================

export interface AgenticTask {
    id: string;
    description: string;
    context: Record<string, any>;
    parentId?: string;
    subTasks: AgenticTask[];
    status: TaskStatus;
    attempts: number;
    maxAttempts: number;
    result?: any;
    error?: string;
    startTime?: Date;
    endTime?: Date;
}

export type TaskStatus =
    | 'pending'
    | 'decomposing'
    | 'executing'
    | 'reflecting'
    | 'correcting'
    | 'completed'
    | 'failed'
    | 'rolled_back';

export interface ExecutionStep {
    action: string;
    params: Record<string, any>;
    expectedOutcome: string;
    actualOutcome?: string;
    success?: boolean;
    timestamp: Date;
}

export interface ReflectionResult {
    isSuccessful: boolean;
    issues: string[];
    suggestions: string[];
    shouldRetry: boolean;
    shouldRollback: boolean;
    modifiedApproach?: string;
}

export interface AgenticLoopConfig {
    maxDepth: number;              // Maximum decomposition depth
    maxAttempts: number;           // Max retries per task
    reflectionEnabled: boolean;    // Enable self-reflection
    rollbackEnabled: boolean;      // Enable rollback on failure
    parallelExecution: boolean;    // Execute independent subtasks in parallel
    confidenceThreshold: number;   // Minimum confidence to proceed (0-1)
}

// ============================================================================
// AGENTIC LOOP
// ============================================================================

export class AgenticLoop extends EventEmitter {
    private static instance: AgenticLoop;
    private modelManager: ModelManager;
    private goalTracker: GoalTracker;
    private policyStore: PolicyStore;
    private modeManager: ModeManager;
    private metricsCollector: MetricsCollector;

    private config: AgenticLoopConfig = {
        maxDepth: 5,
        maxAttempts: 3,
        reflectionEnabled: true,
        rollbackEnabled: true,
        parallelExecution: true,
        confidenceThreshold: 0.7
    };

    private executionHistory: ExecutionStep[] = [];
    private taskCheckpoints: Map<string, any> = new Map();
    private currentTask: AgenticTask | null = null;
    private currentTraceSession: TraceSession | null = null;

    private constructor() {
        super();
        this.modelManager = ModelManager.getInstance();
        this.goalTracker = GoalTracker.getInstance();
        this.policyStore = PolicyStore.getInstance();
        this.modeManager = ModeManager.getInstance();
        this.metricsCollector = MetricsCollector.getInstance();
    }

    static getInstance(): AgenticLoop {
        if (!AgenticLoop.instance) {
            AgenticLoop.instance = new AgenticLoop();
        }
        return AgenticLoop.instance;
    }

    // ========================================================================
    // MAIN AGENTIC LOOP
    // ========================================================================

    /**
     * Execute a complex task with full agentic capabilities
     */
    async executeTask(
        description: string,
        context: Record<string, any> = {},
        successCriteria?: string[]
    ): Promise<{
        success: boolean;
        result: any;
        executionTrace: ExecutionStep[];
        reflections: ReflectionResult[];
    }> {
        console.log('🔄 Starting Agentic Loop...');
        console.log(`📋 Task: ${description}`);

        // v24 APEX: Start reasoning trace
        this.currentTraceSession = reasoningTracer.startTrace(`task-${Date.now()}`);
        reasoningTracer.recordThought(`Starting task: ${description}`, 0.9);

        // v24 APEX: Get tool recommendations
        const toolRecommendations = await adaptiveToolSelector.analyzeTask(description, context);
        if (toolRecommendations.length > 0) {
            reasoningTracer.recordDecision(
                `Selected tools for task`,
                toolRecommendations.map(t => t.toolName),
                `Top recommendation: ${toolRecommendations[0].toolName} (score: ${toolRecommendations[0].score.toFixed(2)})`
            );
            context.recommendedTools = toolRecommendations;
        }

        // v24 APEX: Analyze task complexity for model selection
        const complexity = modelCapabilityMatcher.analyzeTaskComplexity(description);
        const optimalModel = modelCapabilityMatcher.getOptimalModel(description);
        if (optimalModel) {
            reasoningTracer.recordThought(
                `Task complexity: ${complexity.level}, optimal model: ${optimalModel.modelId}`,
                optimalModel.score
            );
            context.taskComplexity = complexity;
            context.optimalModel = optimalModel;
        }

        const reflections: ReflectionResult[] = [];

        // Create root task
        const rootTask = this.createTask(description, context);
        this.currentTask = rootTask;

        // Create goal for tracking
        const goalId = this.goalTracker.createGoal(
            description,
            successCriteria || ['Task completed successfully'],
            'high'
        );

        this.emit('loop:started', { taskId: rootTask.id, goalId });

        try {
            // Phase 0: Safety Check
            console.log('🛡️ Phase 0: Safety Validation...');
            const safetyResult = await this.performSafetyCheck(description, context);
            if (!safetyResult.allowed) {
                console.log(`❌ Task blocked by safety policies: ${safetyResult.reason}`);
                this.metricsCollector.recordSafetyEvent('blocked', { task: description, reason: safetyResult.reason });
                this.goalTracker.updateGoal(goalId, 'failed');
                return {
                    success: false,
                    result: { blocked: true, reason: safetyResult.reason },
                    executionTrace: this.executionHistory,
                    reflections
                };
            }

            if (safetyResult.requiresApproval) {
                console.log('⏳ Task requires human approval - pausing...');
                this.metricsCollector.recordSafetyEvent('approval_required', { task: description });
                const approval = await this.modeManager.requestApproval({
                    agent: 'AgenticLoop',
                    action: 'execute_task',
                    description,
                    risk: 'medium',
                    context,
                    timeout: 300000 // 5 minute timeout
                });

                if (!approval.approved) {
                    this.goalTracker.updateGoal(goalId, 'failed');
                    return {
                        success: false,
                        result: { blocked: true, reason: 'Human approval denied' },
                        executionTrace: this.executionHistory,
                        reflections
                    };
                }
            }

            // Phase 1: Decompose task into subtasks
            console.log('📊 Phase 1: Task Decomposition...');
            await this.decomposeTask(rootTask, 0);

            // Phase 2: Execute with reflection loop
            console.log('⚡ Phase 2: Execution with Reflection...');
            const result = await this.executeWithReflection(rootTask, reflections);

            // Phase 3: Evaluate success
            console.log('✅ Phase 3: Success Evaluation...');
            const success = await this.evaluateSuccess(rootTask, successCriteria);

            if (success) {
                this.goalTracker.updateGoal(goalId, 'completed');
            } else {
                this.goalTracker.updateGoal(goalId, 'failed');
            }

            // Record metrics
            this.metricsCollector.recordProductivity('task_completed', 1, { task: description });
            this.metricsCollector.recordCalibration({
                predicted: this.config.confidenceThreshold,
                actual: success ? 1 : 0,
                task: description
            });

            this.emit('loop:completed', {
                taskId: rootTask.id,
                success,
                result
            });

            // v24 APEX: End reasoning trace
            if (this.currentTraceSession) {
                reasoningTracer.recordReflection(`Task ${success ? 'completed successfully' : 'failed'}`, success ? 0.9 : 0.3);
                reasoningTracer.endTrace(`Task ${rootTask.id} ${success ? 'succeeded' : 'failed'}`);
                this.currentTraceSession = null;
            }

            return {
                success,
                result,
                executionTrace: this.executionHistory,
                reflections
            };

        } catch (error) {
            console.error('❌ Agentic Loop failed:', error);

            // v24 APEX: Record failure in trace
            if (this.currentTraceSession) {
                reasoningTracer.recordReflection(`Task failed: ${(error as Error).message}`, 0.1);
                reasoningTracer.failTrace((error as Error).message);
                this.currentTraceSession = null;
            }

            if (this.config.rollbackEnabled) {
                await this.rollback(rootTask);
            }

            this.goalTracker.updateGoal(goalId, 'failed');

            this.emit('loop:failed', {
                taskId: rootTask.id,
                error: (error as Error).message
            });

            return {
                success: false,
                result: null,
                executionTrace: this.executionHistory,
                reflections
            };
        }
    }

    // ========================================================================
    // TASK DECOMPOSITION
    // ========================================================================

    /**
     * Recursively decompose a complex task into subtasks
     */
    private async decomposeTask(task: AgenticTask, depth: number): Promise<void> {
        if (depth >= this.config.maxDepth) {
            console.log(`  └─ Max depth reached for: ${task.description.substring(0, 50)}...`);
            return;
        }

        task.status = 'decomposing';
        this.emit('task:decomposing', { taskId: task.id, depth });

        const prompt = `Analyze this software engineering task and determine if it needs to be broken down into subtasks.

Task: ${task.description}

Context: ${JSON.stringify(task.context, null, 2)}

Rules:
1. If the task is simple and can be done in one step, respond with: {"needsDecomposition": false}
2. If the task is complex, break it into 2-5 subtasks
3. Each subtask should be concrete and actionable
4. Subtasks should be ordered by dependency

Respond in JSON:
\`\`\`json
{
    "needsDecomposition": true/false,
    "reasoning": "explanation",
    "subtasks": [
        {
            "description": "subtask description",
            "context": {},
            "dependencies": []
        }
    ]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        if (parsed.needsDecomposition && parsed.subtasks?.length > 0) {
            console.log(`  ${'  '.repeat(depth)}├─ Decomposed into ${parsed.subtasks.length} subtasks`);

            for (const subtaskData of parsed.subtasks) {
                const subtask = this.createTask(
                    subtaskData.description,
                    { ...task.context, ...subtaskData.context },
                    task.id
                );
                task.subTasks.push(subtask);

                // Recursively decompose
                await this.decomposeTask(subtask, depth + 1);
            }
        } else {
            console.log(`  ${'  '.repeat(depth)}└─ Leaf task: ${task.description.substring(0, 40)}...`);
        }
    }

    // ========================================================================
    // EXECUTION WITH REFLECTION
    // ========================================================================

    /**
     * Execute task with self-reflection and correction loop
     */
    private async executeWithReflection(
        task: AgenticTask,
        reflections: ReflectionResult[]
    ): Promise<any> {
        // If task has subtasks, execute them first
        if (task.subTasks.length > 0) {
            if (this.config.parallelExecution) {
                // Execute independent subtasks in parallel
                const results = await Promise.all(
                    task.subTasks.map(subtask =>
                        this.executeWithReflection(subtask, reflections)
                    )
                );
                task.result = results;
            } else {
                // Execute sequentially
                for (const subtask of task.subTasks) {
                    await this.executeWithReflection(subtask, reflections);
                }
                task.result = task.subTasks.map(st => st.result);
            }

            task.status = 'completed';
            return task.result;
        }

        // Execute leaf task with retry loop
        while (task.attempts < this.config.maxAttempts) {
            task.attempts++;
            task.status = 'executing';
            task.startTime = new Date();

            console.log(`    → Executing (attempt ${task.attempts}): ${task.description.substring(0, 50)}...`);
            this.emit('task:executing', { taskId: task.id, attempt: task.attempts });

            // Save checkpoint for rollback
            this.saveCheckpoint(task);

            try {
                // Execute the task
                const result = await this.executeLeafTask(task);
                task.result = result;

                // Record execution step
                this.recordStep({
                    action: task.description,
                    params: task.context,
                    expectedOutcome: 'Successful completion',
                    actualOutcome: JSON.stringify(result).substring(0, 200),
                    success: true,
                    timestamp: new Date()
                });

                // Reflect on execution if enabled
                if (this.config.reflectionEnabled) {
                    task.status = 'reflecting';
                    const reflection = await this.reflect(task, result);
                    reflections.push(reflection);

                    if (!reflection.isSuccessful && reflection.shouldRetry) {
                        console.log(`    ⟲ Reflection suggests retry: ${reflection.issues.join(', ')}`);

                        if (reflection.modifiedApproach) {
                            task.description = reflection.modifiedApproach;
                        }
                        continue; // Retry with corrections
                    }

                    if (reflection.shouldRollback) {
                        throw new Error('Reflection determined rollback is needed');
                    }
                }

                task.status = 'completed';
                task.endTime = new Date();
                this.emit('task:completed', { taskId: task.id, result });
                return result;

            } catch (error) {
                task.error = (error as Error).message;
                console.log(`    ✗ Attempt ${task.attempts} failed: ${task.error}`);

                this.recordStep({
                    action: task.description,
                    params: task.context,
                    expectedOutcome: 'Successful completion',
                    actualOutcome: task.error,
                    success: false,
                    timestamp: new Date()
                });

                if (task.attempts >= this.config.maxAttempts) {
                    task.status = 'failed';
                    throw error;
                }

                // Try self-correction
                task.status = 'correcting';
                const correction = await this.selfCorrect(task, error as Error);
                if (correction) {
                    task.context = { ...task.context, ...correction };
                }
            }
        }

        throw new Error(`Task failed after ${this.config.maxAttempts} attempts`);
    }

    /**
     * Execute a leaf task (actual work)
     */
    private async executeLeafTask(task: AgenticTask): Promise<any> {
        const prompt = `Execute this software engineering task and provide the result.

Task: ${task.description}

Context: ${JSON.stringify(task.context, null, 2)}

Provide your response as:
1. The actual output/code/result
2. A brief explanation of what was done

Format:
\`\`\`json
{
    "output": "the actual result, code, or output",
    "explanation": "what was done",
    "confidence": 0.0-1.0,
    "artifacts": ["list of created/modified items"]
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        if (parsed.confidence < this.config.confidenceThreshold) {
            throw new Error(`Low confidence (${parsed.confidence}) - below threshold`);
        }

        return parsed;
    }

    // ========================================================================
    // REFLECTION & SELF-CORRECTION
    // ========================================================================

    /**
     * Reflect on execution result
     */
    private async reflect(task: AgenticTask, result: any): Promise<ReflectionResult> {
        const prompt = `Reflect on this task execution and evaluate the result.

Task: ${task.description}

Result: ${JSON.stringify(result, null, 2)}

Previous attempts: ${task.attempts}
Execution history: ${JSON.stringify(this.executionHistory.slice(-5), null, 2)}

Evaluate:
1. Is the result correct and complete?
2. Are there any issues or improvements needed?
3. Should we retry with a different approach?
4. Should we rollback changes?

Respond in JSON:
\`\`\`json
{
    "isSuccessful": true/false,
    "issues": ["list of issues found"],
    "suggestions": ["improvements for next time"],
    "shouldRetry": true/false,
    "shouldRollback": true/false,
    "modifiedApproach": "new approach if shouldRetry is true"
}
\`\`\``;

        const response = await this.callModel(prompt);
        return this.parseJSON(response) as ReflectionResult;
    }

    /**
     * Self-correct after a failure
     */
    private async selfCorrect(task: AgenticTask, error: Error): Promise<Record<string, any> | null> {
        console.log('    🔧 Attempting self-correction...');

        const prompt = `A task execution failed. Analyze the error and suggest corrections.

Task: ${task.description}
Error: ${error.message}
Previous context: ${JSON.stringify(task.context, null, 2)}
Attempts so far: ${task.attempts}

Provide corrections as JSON:
\`\`\`json
{
    "diagnosis": "what went wrong",
    "corrections": {
        "key": "value pairs to add/modify in context"
    },
    "newApproach": "modified approach description if needed"
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);

        if (parsed.newApproach) {
            task.description = parsed.newApproach;
        }

        return parsed.corrections || null;
    }

    // ========================================================================
    // ROLLBACK
    // ========================================================================

    /**
     * Rollback task to last checkpoint
     */
    private async rollback(task: AgenticTask): Promise<void> {
        console.log(`🔙 Rolling back task: ${task.id}`);

        const checkpoint = this.taskCheckpoints.get(task.id);
        if (checkpoint) {
            task.context = checkpoint.context;
            task.result = null;
            task.error = undefined;
            task.status = 'rolled_back';
        }

        // Rollback subtasks recursively
        for (const subtask of task.subTasks) {
            await this.rollback(subtask);
        }

        this.emit('task:rolled_back', { taskId: task.id });
    }

    // ========================================================================
    // SUCCESS EVALUATION
    // ========================================================================

    /**
     * Evaluate if task met success criteria
     */
    private async evaluateSuccess(
        task: AgenticTask,
        criteria?: string[]
    ): Promise<boolean> {
        if (!criteria || criteria.length === 0) {
            return task.status === 'completed' && !task.error;
        }

        const prompt = `Evaluate if this task execution met the success criteria.

Task: ${task.description}
Result: ${JSON.stringify(task.result, null, 2)}
Status: ${task.status}

Success Criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond in JSON:
\`\`\`json
{
    "allCriteriaMet": true/false,
    "criteriaResults": [
        {"criterion": "...", "met": true/false, "evidence": "..."}
    ],
    "overallSuccess": true/false
}
\`\`\``;

        const response = await this.callModel(prompt);
        const parsed = this.parseJSON(response);
        return parsed.overallSuccess === true;
    }

    // ========================================================================
    // SAFETY CHECK
    // ========================================================================

    /**
     * Perform safety checks using PolicyStore and ModeManager
     */
    private async performSafetyCheck(
        description: string,
        context: Record<string, any>
    ): Promise<{ allowed: boolean; requiresApproval: boolean; reason?: string }> {
        // Check with PolicyStore
        const policyCheck = await this.policyStore.checkAction({
            agent: 'AgenticLoop',
            action: 'execute_task',
            content: description,
            context
        });

        if (!policyCheck.passed) {
            return {
                allowed: false,
                requiresApproval: false,
                reason: policyCheck.violations.map(v => v.policyName).join(', ')
            };
        }

        // Check with ModeManager
        const modeCheck = await this.modeManager.checkAction({
            agent: 'AgenticLoop',
            action: 'execute_task',
            context
        });

        if (!modeCheck.allowed) {
            return {
                allowed: false,
                requiresApproval: modeCheck.requiresApproval,
                reason: modeCheck.reason
            };
        }

        return {
            allowed: true,
            requiresApproval: modeCheck.requiresApproval || policyCheck.requiredApprovals.length > 0
        };
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private createTask(
        description: string,
        context: Record<string, any>,
        parentId?: string
    ): AgenticTask {
        return {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description,
            context,
            parentId,
            subTasks: [],
            status: 'pending',
            attempts: 0,
            maxAttempts: this.config.maxAttempts
        };
    }

    private saveCheckpoint(task: AgenticTask): void {
        this.taskCheckpoints.set(task.id, {
            context: { ...task.context },
            result: task.result,
            timestamp: new Date()
        });
    }

    private recordStep(step: ExecutionStep): void {
        this.executionHistory.push(step);
        this.emit('step:executed', step);
    }

    private async callModel(prompt: string): Promise<string> {
        try {
            const response = await this.modelManager.chat([
                {
                    role: 'system',
                    content: 'You are an expert autonomous software engineering agent. You analyze, decompose, execute, and reflect on complex tasks.',
                    timestamp: new Date()
                },
                {
                    role: 'user',
                    content: prompt,
                    timestamp: new Date()
                }
            ]);
            return response;
        } catch (error) {
            console.error('Model call failed:', error);
            return '{}';
        }
    }

    private parseJSON(text: string): any {
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;
            return JSON.parse(jsonStr);
        } catch {
            return {};
        }
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    setConfig(config: Partial<AgenticLoopConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): AgenticLoopConfig {
        return { ...this.config };
    }

    getCurrentTask(): AgenticTask | null {
        return this.currentTask;
    }

    getExecutionHistory(): ExecutionStep[] {
        return [...this.executionHistory];
    }

    clearHistory(): void {
        this.executionHistory = [];
        this.taskCheckpoints.clear();
    }

    getStats() {
        const completed = this.executionHistory.filter(s => s.success).length;
        const total = this.executionHistory.length;
        return {
            totalSteps: total,
            successfulSteps: completed,
            failedSteps: total - completed,
            successRate: total > 0 ? completed / total : 0
        };
    }
}

// Export singleton
export const agenticLoop = AgenticLoop.getInstance();
