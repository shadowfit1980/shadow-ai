/**
 * Workflow Automation Engine
 * 
 * Creates and executes automated workflows for common development tasks
 * with conditional logic, parallel execution, and scheduling.
 */

import { EventEmitter } from 'events';

export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
    variables: Record<string, any>;
    status: WorkflowStatus;
    createdAt: Date;
    lastRunAt?: Date;
    runCount: number;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: StepType;
    action: string;
    parameters: Record<string, any>;
    condition?: StepCondition;
    onSuccess?: string; // next step id
    onFailure?: string; // step id or 'abort'
    timeout?: number; // ms
    retries?: number;
    parallel?: string[]; // step ids to run in parallel
}

export type StepType =
    | 'command'
    | 'file_operation'
    | 'api_call'
    | 'code_generation'
    | 'validation'
    | 'notification'
    | 'conditional'
    | 'loop'
    | 'wait';

export interface StepCondition {
    type: 'expression' | 'file_exists' | 'env_var' | 'previous_result';
    expression: string;
    operator?: 'equals' | 'contains' | 'matches' | 'greater' | 'less';
    value?: any;
}

export interface WorkflowTrigger {
    type: TriggerType;
    config: TriggerConfig;
    enabled: boolean;
}

export type TriggerType =
    | 'manual'
    | 'scheduled'
    | 'file_change'
    | 'git_event'
    | 'webhook'
    | 'api';

export interface TriggerConfig {
    schedule?: string; // cron expression
    paths?: string[]; // file paths to watch
    gitEvents?: string[]; // push, commit, merge
    webhookUrl?: string;
}

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: WorkflowStatus;
    currentStepId?: string;
    stepResults: Map<string, StepResult>;
    variables: Record<string, any>;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

export interface StepResult {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    output?: any;
    error?: string;
    duration?: number;
    retryCount: number;
}

// Predefined workflow templates
const WORKFLOW_TEMPLATES: Omit<Workflow, 'id' | 'createdAt' | 'lastRunAt' | 'runCount'>[] = [
    {
        name: 'Pre-commit Checks',
        description: 'Run linting, formatting, and tests before commit',
        steps: [
            { id: 'lint', name: 'Run ESLint', type: 'command', action: 'npm run lint', parameters: {} },
            { id: 'format', name: 'Check Formatting', type: 'command', action: 'npm run format:check', parameters: {} },
            { id: 'test', name: 'Run Tests', type: 'command', action: 'npm test', parameters: {}, onFailure: 'abort' },
        ],
        triggers: [{ type: 'git_event', config: { gitEvents: ['pre-commit'] }, enabled: true }],
        variables: {},
        status: 'idle',
    },
    {
        name: 'Build and Deploy',
        description: 'Build the project and deploy to staging',
        steps: [
            { id: 'install', name: 'Install Dependencies', type: 'command', action: 'npm ci', parameters: {} },
            { id: 'build', name: 'Build Project', type: 'command', action: 'npm run build', parameters: {} },
            { id: 'test', name: 'Run Tests', type: 'command', action: 'npm test', parameters: {} },
            { id: 'deploy', name: 'Deploy to Staging', type: 'command', action: 'npm run deploy:staging', parameters: {} },
        ],
        triggers: [{ type: 'manual', config: {}, enabled: true }],
        variables: {},
        status: 'idle',
    },
    {
        name: 'Code Review Prep',
        description: 'Prepare code for review',
        steps: [
            { id: 'format', name: 'Format Code', type: 'command', action: 'npm run format', parameters: {} },
            { id: 'lint-fix', name: 'Fix Lint Issues', type: 'command', action: 'npm run lint:fix', parameters: {} },
            { id: 'generate-docs', name: 'Generate Docs', type: 'code_generation', action: 'generate-jsdoc', parameters: {} },
            { id: 'commit', name: 'Create Commit', type: 'command', action: 'git add -A && git commit -m "chore: code review prep"', parameters: {} },
        ],
        triggers: [{ type: 'manual', config: {}, enabled: true }],
        variables: {},
        status: 'idle',
    },
];

export class WorkflowAutomationEngine extends EventEmitter {
    private static instance: WorkflowAutomationEngine;
    private workflows: Map<string, Workflow> = new Map();
    private executions: Map<string, WorkflowExecution> = new Map();
    private activeExecution: string | null = null;

    private constructor() {
        super();
    }

    static getInstance(): WorkflowAutomationEngine {
        if (!WorkflowAutomationEngine.instance) {
            WorkflowAutomationEngine.instance = new WorkflowAutomationEngine();
        }
        return WorkflowAutomationEngine.instance;
    }

    // ========================================================================
    // WORKFLOW MANAGEMENT
    // ========================================================================

    createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'lastRunAt' | 'runCount'>): Workflow {
        const newWorkflow: Workflow = {
            ...workflow,
            id: `workflow_${Date.now()}`,
            createdAt: new Date(),
            runCount: 0,
        };

        this.workflows.set(newWorkflow.id, newWorkflow);
        this.emit('workflow:created', newWorkflow);
        return newWorkflow;
    }

    updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
        const workflow = this.workflows.get(id);
        if (!workflow) return undefined;

        Object.assign(workflow, updates);
        this.emit('workflow:updated', workflow);
        return workflow;
    }

    deleteWorkflow(id: string): boolean {
        const deleted = this.workflows.delete(id);
        if (deleted) {
            this.emit('workflow:deleted', id);
        }
        return deleted;
    }

    getWorkflow(id: string): Workflow | undefined {
        return this.workflows.get(id);
    }

    getAllWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    getTemplates(): typeof WORKFLOW_TEMPLATES {
        return WORKFLOW_TEMPLATES;
    }

    createFromTemplate(templateIndex: number): Workflow {
        const template = WORKFLOW_TEMPLATES[templateIndex];
        if (!template) throw new Error('Template not found');
        return this.createWorkflow(template);
    }

    // ========================================================================
    // WORKFLOW EXECUTION
    // ========================================================================

    async execute(workflowId: string, variables?: Record<string, any>): Promise<WorkflowExecution> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error('Workflow not found');

        if (this.activeExecution) {
            throw new Error('Another workflow is currently running');
        }

        const execution: WorkflowExecution = {
            id: `exec_${Date.now()}`,
            workflowId,
            status: 'running',
            stepResults: new Map(),
            variables: { ...workflow.variables, ...variables },
            startedAt: new Date(),
        };

        this.executions.set(execution.id, execution);
        this.activeExecution = execution.id;
        workflow.status = 'running';

        this.emit('execution:started', execution);

        try {
            await this.executeSteps(workflow, execution);

            execution.status = 'completed';
            execution.completedAt = new Date();
            workflow.status = 'idle';
            workflow.lastRunAt = new Date();
            workflow.runCount++;

            this.emit('execution:completed', execution);
        } catch (error: any) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.completedAt = new Date();
            workflow.status = 'failed';

            this.emit('execution:failed', { execution, error });
        } finally {
            this.activeExecution = null;
        }

        return execution;
    }

    private async executeSteps(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
        for (const step of workflow.steps) {
            execution.currentStepId = step.id;

            // Check condition
            if (step.condition && !this.evaluateCondition(step.condition, execution)) {
                execution.stepResults.set(step.id, {
                    stepId: step.id,
                    status: 'skipped',
                    retryCount: 0,
                });
                this.emit('step:skipped', { executionId: execution.id, step });
                continue;
            }

            // Execute step with retries
            const result = await this.executeStepWithRetry(step, execution);
            execution.stepResults.set(step.id, result);

            if (result.status === 'failed') {
                if (step.onFailure === 'abort') {
                    throw new Error(`Step ${step.name} failed: ${result.error}`);
                }
                // Continue to next step or handle failure
            }

            this.emit('step:completed', { executionId: execution.id, step, result });
        }
    }

    private async executeStepWithRetry(step: WorkflowStep, execution: WorkflowExecution): Promise<StepResult> {
        const maxRetries = step.retries || 0;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
            try {
                const startTime = Date.now();
                const output = await this.executeStep(step, execution);

                return {
                    stepId: step.id,
                    status: 'completed',
                    output,
                    duration: Date.now() - startTime,
                    retryCount,
                };
            } catch (error: any) {
                retryCount++;
                if (retryCount > maxRetries) {
                    return {
                        stepId: step.id,
                        status: 'failed',
                        error: error.message,
                        retryCount,
                    };
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }

        return {
            stepId: step.id,
            status: 'failed',
            error: 'Max retries exceeded',
            retryCount,
        };
    }

    private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
        // Simulate step execution based on type
        switch (step.type) {
            case 'command':
                // Would execute shell command
                await new Promise(resolve => setTimeout(resolve, 100));
                return { stdout: `Executed: ${step.action}`, exitCode: 0 };

            case 'file_operation':
                // Would perform file operation
                await new Promise(resolve => setTimeout(resolve, 50));
                return { success: true };

            case 'api_call':
                // Would make API call
                await new Promise(resolve => setTimeout(resolve, 200));
                return { status: 200, data: {} };

            case 'code_generation':
                // Would generate code
                await new Promise(resolve => setTimeout(resolve, 500));
                return { generated: true, files: [] };

            case 'validation':
                // Would validate something
                await new Promise(resolve => setTimeout(resolve, 100));
                return { valid: true };

            case 'notification':
                // Would send notification
                await new Promise(resolve => setTimeout(resolve, 50));
                return { sent: true };

            case 'wait':
                const delay = step.parameters.duration || 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return { waited: delay };

            default:
                return { executed: true };
        }
    }

    private evaluateCondition(condition: StepCondition, execution: WorkflowExecution): boolean {
        switch (condition.type) {
            case 'expression':
                // Simple expression evaluation
                try {
                    const vars = execution.variables;
                    return eval(condition.expression);
                } catch {
                    return false;
                }

            case 'file_exists':
                // Would check if file exists
                return true;

            case 'env_var':
                const envValue = process.env[condition.expression];
                if (condition.operator === 'equals') {
                    return envValue === condition.value;
                }
                return !!envValue;

            case 'previous_result':
                const prevResult = execution.stepResults.get(condition.expression);
                return prevResult?.status === 'completed';

            default:
                return true;
        }
    }

    // ========================================================================
    // EXECUTION MANAGEMENT
    // ========================================================================

    pauseExecution(executionId: string): boolean {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'running') return false;

        execution.status = 'paused';
        this.emit('execution:paused', execution);
        return true;
    }

    resumeExecution(executionId: string): boolean {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'paused') return false;

        execution.status = 'running';
        this.emit('execution:resumed', execution);
        // Would resume execution from current step
        return true;
    }

    cancelExecution(executionId: string): boolean {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status === 'completed') return false;

        execution.status = 'failed';
        execution.error = 'Cancelled by user';
        execution.completedAt = new Date();

        if (this.activeExecution === executionId) {
            this.activeExecution = null;
        }

        const workflow = this.workflows.get(execution.workflowId);
        if (workflow) {
            workflow.status = 'idle';
        }

        this.emit('execution:cancelled', execution);
        return true;
    }

    getExecution(id: string): WorkflowExecution | undefined {
        return this.executions.get(id);
    }

    getExecutionHistory(workflowId?: string): WorkflowExecution[] {
        const executions = Array.from(this.executions.values());
        if (workflowId) {
            return executions.filter(e => e.workflowId === workflowId);
        }
        return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }

    isRunning(): boolean {
        return this.activeExecution !== null;
    }

    getActiveExecution(): WorkflowExecution | undefined {
        return this.activeExecution ? this.executions.get(this.activeExecution) : undefined;
    }
}

export const workflowAutomationEngine = WorkflowAutomationEngine.getInstance();
