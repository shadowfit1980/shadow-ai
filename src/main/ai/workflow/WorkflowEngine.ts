/**
 * Workflow Engine
 * 
 * Execute visual workflows step by step
 */

import { EventEmitter } from 'events';

interface WorkflowNode {
    id: string;
    type: 'trigger' | 'action' | 'condition' | 'agent' | 'output';
    title: string;
    config: Record<string, any>;
    position: { x: number; y: number };
}

interface WorkflowConnection {
    id: string;
    from: string;
    to: string;
    label?: string;
}

interface Workflow {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
}

interface ExecutionContext {
    workflowId: string;
    nodeId: string;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    startTime: Date;
    endTime?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}

interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    nodeExecutions: ExecutionContext[];
    currentNodeId?: string;
}

/**
 * WorkflowEngine - Execute workflows
 */
export class WorkflowEngine extends EventEmitter {
    private static instance: WorkflowEngine;
    private workflows: Map<string, Workflow> = new Map();
    private executions: Map<string, WorkflowExecution> = new Map();
    private actionHandlers: Map<string, (config: any, inputs: any) => Promise<any>> = new Map();

    private constructor() {
        super();
        this.registerDefaultHandlers();
    }

    static getInstance(): WorkflowEngine {
        if (!WorkflowEngine.instance) {
            WorkflowEngine.instance = new WorkflowEngine();
        }
        return WorkflowEngine.instance;
    }

    /**
     * Register default action handlers
     */
    private registerDefaultHandlers(): void {
        // Send to AI
        this.actionHandlers.set('ai-chat', async (config, inputs) => {
            const { ModelManager } = await import('../ModelManager');
            const manager = ModelManager.getInstance();
            const response = await manager.chat([{
                role: 'user',
                content: config.prompt || inputs.message,
                timestamp: new Date(),
            }]);
            return { response };
        });

        // File operations
        this.actionHandlers.set('write-file', async (config, inputs) => {
            const fs = await import('fs/promises');
            await fs.writeFile(config.path, config.content || inputs.content);
            return { success: true, path: config.path };
        });

        this.actionHandlers.set('read-file', async (config, inputs) => {
            const fs = await import('fs/promises');
            const content = await fs.readFile(config.path || inputs.path, 'utf-8');
            return { content };
        });

        // HTTP request
        this.actionHandlers.set('http-request', async (config, inputs) => {
            const axios = (await import('axios')).default;
            const response = await axios({
                method: config.method || 'GET',
                url: config.url || inputs.url,
                data: config.body,
                headers: config.headers,
            });
            return { data: response.data, status: response.status };
        });

        // Git operations
        this.actionHandlers.set('git-commit', async (config, inputs) => {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            await execAsync(`git add .`, { cwd: config.cwd || process.cwd() });
            const { stdout } = await execAsync(
                `git commit -m "${config.message || inputs.message}"`,
                { cwd: config.cwd || process.cwd() }
            );
            return { output: stdout };
        });

        // Delay
        this.actionHandlers.set('delay', async (config) => {
            await new Promise(resolve => setTimeout(resolve, config.ms || 1000));
            return { delayed: true };
        });

        // Notification
        this.actionHandlers.set('notify', async (config, inputs) => {
            const { Notification } = await import('electron');
            new Notification({
                title: config.title || 'Workflow',
                body: config.message || inputs.message,
            }).show();
            return { notified: true };
        });
    }

    /**
     * Register a workflow
     */
    registerWorkflow(workflow: Workflow): void {
        this.workflows.set(workflow.id, workflow);
        this.emit('workflow:registered', workflow);
    }

    /**
     * Get a workflow
     */
    getWorkflow(id: string): Workflow | undefined {
        return this.workflows.get(id);
    }

    /**
     * List all workflows
     */
    listWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Execute a workflow
     */
    async execute(workflowId: string, inputs: Record<string, any> = {}): Promise<WorkflowExecution> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        const execution: WorkflowExecution = {
            id: `exec_${Date.now()}`,
            workflowId,
            status: 'running',
            startTime: new Date(),
            nodeExecutions: [],
        };

        this.executions.set(execution.id, execution);
        this.emit('execution:started', execution);

        try {
            // Find trigger node
            const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
            if (!triggerNode) {
                throw new Error('No trigger node found');
            }

            // Execute from trigger
            let currentOutputs = inputs;
            const executedNodes = new Set<string>();
            const nodesToExecute = [triggerNode.id];

            while (nodesToExecute.length > 0) {
                const nodeId = nodesToExecute.shift()!;
                if (executedNodes.has(nodeId)) continue;

                const node = workflow.nodes.find(n => n.id === nodeId);
                if (!node) continue;

                execution.currentNodeId = nodeId;
                this.emit('node:started', { executionId: execution.id, nodeId });

                const nodeContext: ExecutionContext = {
                    workflowId,
                    nodeId,
                    inputs: currentOutputs,
                    outputs: {},
                    startTime: new Date(),
                    status: 'running',
                };

                try {
                    // Execute node based on type
                    const outputs = await this.executeNode(node, currentOutputs);
                    nodeContext.outputs = outputs;
                    nodeContext.status = 'completed';
                    nodeContext.endTime = new Date();
                    currentOutputs = { ...currentOutputs, ...outputs };

                    // Handle conditions
                    if (node.type === 'condition') {
                        const nextNodeId = outputs.result ?
                            workflow.connections.find(c => c.from === nodeId && c.label === 'true')?.to :
                            workflow.connections.find(c => c.from === nodeId && c.label === 'false')?.to;
                        if (nextNodeId) nodesToExecute.push(nextNodeId);
                    } else {
                        // Add connected nodes
                        workflow.connections
                            .filter(c => c.from === nodeId)
                            .forEach(c => nodesToExecute.push(c.to));
                    }

                    this.emit('node:completed', { executionId: execution.id, nodeId, outputs });
                } catch (error: any) {
                    nodeContext.status = 'failed';
                    nodeContext.error = error.message;
                    nodeContext.endTime = new Date();
                    this.emit('node:failed', { executionId: execution.id, nodeId, error: error.message });
                    throw error;
                }

                execution.nodeExecutions.push(nodeContext);
                executedNodes.add(nodeId);
            }

            execution.status = 'completed';
            execution.endTime = new Date();
            this.emit('execution:completed', execution);
        } catch (error: any) {
            execution.status = 'failed';
            execution.endTime = new Date();
            this.emit('execution:failed', { execution, error: error.message });
        }

        return execution;
    }

    /**
     * Execute a single node
     */
    private async executeNode(node: WorkflowNode, inputs: Record<string, any>): Promise<Record<string, any>> {
        switch (node.type) {
            case 'trigger':
                return inputs;

            case 'output':
                return { output: inputs };

            case 'condition':
                // Simple condition evaluation
                const condition = node.config.condition || 'true';
                try {
                    const result = eval(condition.replace(/\$\{(\w+)\}/g, (_: string, key: string) => JSON.stringify(inputs[key])));
                    return { result: Boolean(result) };
                } catch {
                    return { result: false };
                }

            case 'agent':
            case 'action':
                const actionType = node.config.actionType || node.config.type;
                const handler = this.actionHandlers.get(actionType);
                if (handler) {
                    return handler(node.config, inputs);
                }
                return { warning: `Unknown action type: ${actionType}` };

            default:
                return {};
        }
    }

    /**
     * Cancel an execution
     */
    cancelExecution(executionId: string): boolean {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== 'running') return false;

        execution.status = 'cancelled';
        execution.endTime = new Date();
        this.emit('execution:cancelled', execution);
        return true;
    }

    /**
     * Get execution status
     */
    getExecution(executionId: string): WorkflowExecution | undefined {
        return this.executions.get(executionId);
    }

    /**
     * List all executions
     */
    listExecutions(workflowId?: string): WorkflowExecution[] {
        const executions = Array.from(this.executions.values());
        if (workflowId) {
            return executions.filter(e => e.workflowId === workflowId);
        }
        return executions;
    }

    /**
     * Register custom action handler
     */
    registerActionHandler(type: string, handler: (config: any, inputs: any) => Promise<any>): void {
        this.actionHandlers.set(type, handler);
    }
}

export default WorkflowEngine;
