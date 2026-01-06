/**
 * Workflow Engine
 * Parameterized, reusable workflows like Warp's Workflows feature
 * Supports team sharing and sync
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import Store from 'electron-store';

export interface WorkflowParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'file';
    description?: string;
    default?: any;
    required?: boolean;
    options?: string[]; // For select type
}

export interface WorkflowStep {
    name: string;
    command: string;
    description?: string;
    condition?: string; // JS expression to check
    continueOnError?: boolean;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    category?: string;
    parameters: WorkflowParameter[];
    steps: WorkflowStep[];
    author?: string;
    version?: string;
    tags?: string[];
    shared?: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    parameters: Record<string, any>;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    currentStep: number;
    stepResults: StepResult[];
    startTime: number;
    endTime?: number;
    error?: string;
}

export interface StepResult {
    stepIndex: number;
    stepName: string;
    command: string;
    output: string;
    exitCode: number;
    duration: number;
    status: 'success' | 'failed' | 'skipped';
}

/**
 * WorkflowEngine
 * Manages parameterized workflow definitions and execution
 */
export class WorkflowEngine extends EventEmitter {
    private static instance: WorkflowEngine;
    private store: Store;
    private workflows: Map<string, Workflow> = new Map();
    private executions: Map<string, WorkflowExecution> = new Map();
    private workflowsDir: string;

    private constructor() {
        super();
        this.store = new Store({ name: 'shadow-ai-workflows' });
        this.workflowsDir = this.store.get('workflowsDir', '.agent/workflows') as string;
        this.loadWorkflows();
    }

    static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    /**
     * Load workflows from directory
     */
    async loadWorkflows(dir?: string): Promise<void> {
        const workflowDir = dir || this.workflowsDir;

        try {
            const absPath = path.isAbsolute(workflowDir)
                ? workflowDir
                : path.join(process.cwd(), workflowDir);

            const files = await fs.readdir(absPath);

            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')) {
                    try {
                        const content = await fs.readFile(path.join(absPath, file), 'utf-8');
                        const workflow = file.endsWith('.json')
                            ? JSON.parse(content)
                            : yaml.parse(content);

                        if (this.validateWorkflow(workflow)) {
                            workflow.id = workflow.id || path.basename(file, path.extname(file));
                            this.workflows.set(workflow.id, workflow);
                        }
                    } catch (e) {
                        console.warn(`Failed to load workflow ${file}:`, e);
                    }
                }
            }

            this.emit('workflowsLoaded', { count: this.workflows.size });
        } catch (error) {
            // Directory doesn't exist yet
            console.log('Workflows directory not found, starting with empty set');
        }
    }

    /**
     * Create a new workflow
     */
    async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
        const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newWorkflow: Workflow = {
            ...workflow,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.workflows.set(id, newWorkflow);
        await this.saveWorkflow(newWorkflow);

        this.emit('workflowCreated', newWorkflow);
        return newWorkflow;
    }

    /**
     * Update an existing workflow
     */
    async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
        const existing = this.workflows.get(id);
        if (!existing) return null;

        const updated: Workflow = {
            ...existing,
            ...updates,
            id, // Preserve ID
            updatedAt: Date.now(),
        };

        this.workflows.set(id, updated);
        await this.saveWorkflow(updated);

        this.emit('workflowUpdated', updated);
        return updated;
    }

    /**
     * Delete a workflow
     */
    async deleteWorkflow(id: string): Promise<boolean> {
        const workflow = this.workflows.get(id);
        if (!workflow) return false;

        this.workflows.delete(id);

        // Delete file if exists
        try {
            const filePath = path.join(this.workflowsDir, `${id}.yaml`);
            await fs.unlink(filePath);
        } catch (e) {
            // File might not exist
        }

        this.emit('workflowDeleted', { id });
        return true;
    }

    /**
     * Get a workflow by ID
     */
    getWorkflow(id: string): Workflow | null {
        return this.workflows.get(id) || null;
    }

    /**
     * Get all workflows
     */
    getAllWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Search workflows
     */
    searchWorkflows(query: string): Workflow[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllWorkflows().filter(w =>
            w.name.toLowerCase().includes(lowerQuery) ||
            w.description?.toLowerCase().includes(lowerQuery) ||
            w.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Execute a workflow
     */
    async executeWorkflow(
        workflowId: string,
        parameters: Record<string, any>,
        options?: { dryRun?: boolean; cwd?: string }
    ): Promise<WorkflowExecution> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        // Validate parameters
        for (const param of workflow.parameters) {
            if (param.required && !(param.name in parameters) && param.default === undefined) {
                throw new Error(`Missing required parameter: ${param.name}`);
            }
        }

        // Fill defaults
        const resolvedParams: Record<string, any> = {};
        for (const param of workflow.parameters) {
            resolvedParams[param.name] = parameters[param.name] ?? param.default;
        }

        const executionId = `exec_${Date.now()}`;
        const execution: WorkflowExecution = {
            id: executionId,
            workflowId,
            parameters: resolvedParams,
            status: 'running',
            currentStep: 0,
            stepResults: [],
            startTime: Date.now(),
        };

        this.executions.set(executionId, execution);
        this.emit('executionStarted', execution);

        if (options?.dryRun) {
            // Just return the would-be commands
            execution.status = 'completed';
            execution.endTime = Date.now();
            return execution;
        }

        // Execute steps
        try {
            for (let i = 0; i < workflow.steps.length; i++) {
                execution.currentStep = i;
                const step = workflow.steps[i];

                // Check condition
                if (step.condition) {
                    try {
                        const conditionFn = new Function('params', `return ${step.condition}`);
                        if (!conditionFn(resolvedParams)) {
                            execution.stepResults.push({
                                stepIndex: i,
                                stepName: step.name,
                                command: step.command,
                                output: 'Skipped due to condition',
                                exitCode: 0,
                                duration: 0,
                                status: 'skipped',
                            });
                            continue;
                        }
                    } catch (e) {
                        console.warn(`Condition evaluation failed for step ${step.name}:`, e);
                    }
                }

                // Interpolate parameters
                const command = this.interpolateCommand(step.command, resolvedParams);

                this.emit('stepStarted', { executionId, stepIndex: i, command });

                const stepStart = Date.now();
                const result = await this.executeCommand(command, options?.cwd);

                const stepResult: StepResult = {
                    stepIndex: i,
                    stepName: step.name,
                    command,
                    output: result.output,
                    exitCode: result.exitCode,
                    duration: Date.now() - stepStart,
                    status: result.exitCode === 0 ? 'success' : 'failed',
                };

                execution.stepResults.push(stepResult);
                this.emit('stepCompleted', { executionId, result: stepResult });

                if (result.exitCode !== 0 && !step.continueOnError) {
                    throw new Error(`Step "${step.name}" failed with exit code ${result.exitCode}`);
                }
            }

            execution.status = 'completed';
        } catch (error: any) {
            execution.status = 'failed';
            execution.error = error.message;
        }

        execution.endTime = Date.now();
        this.emit('executionCompleted', execution);
        return execution;
    }

    /**
     * Cancel an execution
     */
    async cancelExecution(executionId: string): Promise<boolean> {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'running') return false;

        execution.status = 'cancelled';
        execution.endTime = Date.now();
        this.emit('executionCancelled', { executionId });
        return true;
    }

    /**
     * Get execution by ID
     */
    getExecution(executionId: string): WorkflowExecution | null {
        return this.executions.get(executionId) || null;
    }

    /**
     * Get recent executions
     */
    getRecentExecutions(limit = 20): WorkflowExecution[] {
        return Array.from(this.executions.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, limit);
    }

    /**
     * Generate command preview
     */
    previewWorkflow(workflowId: string, parameters: Record<string, any>): string[] {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return [];

        return workflow.steps.map(step => this.interpolateCommand(step.command, parameters));
    }

    // Private methods

    private async saveWorkflow(workflow: Workflow): Promise<void> {
        try {
            const absPath = path.isAbsolute(this.workflowsDir)
                ? this.workflowsDir
                : path.join(process.cwd(), this.workflowsDir);

            await fs.mkdir(absPath, { recursive: true });

            const filePath = path.join(absPath, `${workflow.id}.yaml`);
            await fs.writeFile(filePath, yaml.stringify(workflow), 'utf-8');
        } catch (error) {
            console.error('Failed to save workflow:', error);
        }
    }

    private validateWorkflow(workflow: any): boolean {
        return (
            typeof workflow.name === 'string' &&
            Array.isArray(workflow.steps) &&
            workflow.steps.length > 0
        );
    }

    private interpolateCommand(command: string, params: Record<string, any>): string {
        return command.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            return params[key]?.toString() || '';
        });
    }

    private async executeCommand(command: string, cwd?: string): Promise<{ output: string; exitCode: number }> {
        const { exec } = await import('child_process');

        return new Promise((resolve) => {
            exec(command, { cwd: cwd || process.cwd() }, (error, stdout, stderr) => {
                resolve({
                    output: stdout + stderr,
                    exitCode: error?.code || 0,
                });
            });
        });
    }
}

// Singleton getter
export function getWorkflowEngine(): WorkflowEngine {
    return WorkflowEngine.getInstance();
}
