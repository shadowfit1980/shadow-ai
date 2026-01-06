/**
 * Visual Workflow Builder
 * 
 * Drag-and-drop task creation, visual pipeline for CI/CD,
 * and flowchart-based logic design.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowNode {
    id: string;
    type: 'start' | 'end' | 'task' | 'condition' | 'loop' | 'parallel' | 'ai_action';
    name: string;
    config: Record<string, any>;
    position: { x: number; y: number };
    inputs: string[];
    outputs: string[];
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    condition?: string;
    label?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
    currentNode?: string;
    results: Record<string, any>;
    startedAt: Date;
    completedAt?: Date;
    logs: Array<{ nodeId: string; message: string; timestamp: Date }>;
}

// ============================================================================
// WORKFLOW BUILDER
// ============================================================================

export class VisualWorkflowBuilder extends EventEmitter {
    private static instance: VisualWorkflowBuilder;
    private workflows: Map<string, Workflow> = new Map();
    private executions: Map<string, WorkflowExecution> = new Map();
    private nodeHandlers: Map<string, (config: any, context: any) => Promise<any>> = new Map();

    private constructor() {
        super();
        this.registerDefaultHandlers();
    }

    static getInstance(): VisualWorkflowBuilder {
        if (!VisualWorkflowBuilder.instance) {
            VisualWorkflowBuilder.instance = new VisualWorkflowBuilder();
        }
        return VisualWorkflowBuilder.instance;
    }

    // ========================================================================
    // WORKFLOW CRUD
    // ========================================================================

    /**
     * Create a new workflow
     */
    createWorkflow(name: string, description?: string): Workflow {
        const workflow: Workflow = {
            id: `wf_${Date.now()}`,
            name,
            description: description || '',
            nodes: [
                { id: 'start', type: 'start', name: 'Start', config: {}, position: { x: 100, y: 100 }, inputs: [], outputs: ['out'] },
                { id: 'end', type: 'end', name: 'End', config: {}, position: { x: 500, y: 100 }, inputs: ['in'], outputs: [] },
            ],
            edges: [],
            variables: {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.workflows.set(workflow.id, workflow);
        this.emit('workflow:created', workflow);
        return workflow;
    }

    /**
     * Get workflow
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
     * Delete workflow
     */
    deleteWorkflow(id: string): boolean {
        return this.workflows.delete(id);
    }

    // ========================================================================
    // NODE OPERATIONS
    // ========================================================================

    /**
     * Add a node to workflow
     */
    addNode(workflowId: string, node: Omit<WorkflowNode, 'id'>): WorkflowNode | null {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return null;

        const fullNode: WorkflowNode = {
            ...node,
            id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };

        workflow.nodes.push(fullNode);
        workflow.updatedAt = new Date();
        this.emit('node:added', { workflowId, node: fullNode });

        return fullNode;
    }

    /**
     * Update a node
     */
    updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): boolean {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return false;

        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) return false;

        Object.assign(node, updates);
        workflow.updatedAt = new Date();
        this.emit('node:updated', { workflowId, node });

        return true;
    }

    /**
     * Remove a node
     */
    removeNode(workflowId: string, nodeId: string): boolean {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return false;

        workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId);
        workflow.edges = workflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        workflow.updatedAt = new Date();
        this.emit('node:removed', { workflowId, nodeId });

        return true;
    }

    // ========================================================================
    // EDGE OPERATIONS
    // ========================================================================

    /**
     * Connect two nodes
     */
    connectNodes(workflowId: string, source: string, target: string, condition?: string): WorkflowEdge | null {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return null;

        const edge: WorkflowEdge = {
            id: `edge_${Date.now()}`,
            source,
            target,
            condition,
        };

        workflow.edges.push(edge);
        workflow.updatedAt = new Date();
        this.emit('edge:added', { workflowId, edge });

        return edge;
    }

    /**
     * Disconnect nodes
     */
    disconnectNodes(workflowId: string, edgeId: string): boolean {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return false;

        workflow.edges = workflow.edges.filter(e => e.id !== edgeId);
        workflow.updatedAt = new Date();
        return true;
    }

    // ========================================================================
    // WORKFLOW EXECUTION
    // ========================================================================

    /**
     * Execute a workflow
     */
    async executeWorkflow(workflowId: string, inputs: Record<string, any> = {}): Promise<WorkflowExecution> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

        const execution: WorkflowExecution = {
            id: `exec_${Date.now()}`,
            workflowId,
            status: 'running',
            results: { ...inputs },
            startedAt: new Date(),
            logs: [],
        };

        this.executions.set(execution.id, execution);
        this.emit('execution:started', execution);

        try {
            // Find start node
            const startNode = workflow.nodes.find(n => n.type === 'start');
            if (!startNode) throw new Error('No start node');

            // Execute workflow
            await this.executeNode(workflow, startNode.id, execution);

            execution.status = 'completed';
            execution.completedAt = new Date();
            this.emit('execution:completed', execution);

        } catch (error: any) {
            execution.status = 'failed';
            execution.completedAt = new Date();
            execution.logs.push({ nodeId: 'error', message: error.message, timestamp: new Date() });
            this.emit('execution:failed', { execution, error: error.message });
        }

        return execution;
    }

    /**
     * Execute a single node
     */
    private async executeNode(workflow: Workflow, nodeId: string, execution: WorkflowExecution): Promise<void> {
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) return;

        execution.currentNode = nodeId;
        this.emit('node:executing', { execution, node });

        // Get handler for node type
        const handler = this.nodeHandlers.get(node.type);
        if (handler) {
            const result = await handler(node.config, execution.results);
            execution.results[node.id] = result;
        }

        execution.logs.push({ nodeId, message: `Executed ${node.name}`, timestamp: new Date() });

        // Find next nodes
        const edges = workflow.edges.filter(e => e.source === nodeId);
        for (const edge of edges) {
            // Check condition if present
            if (edge.condition) {
                const conditionMet = this.evaluateCondition(edge.condition, execution.results);
                if (!conditionMet) continue;
            }
            await this.executeNode(workflow, edge.target, execution);
        }
    }

    private evaluateCondition(condition: string, context: Record<string, any>): boolean {
        try {
            const fn = new Function(...Object.keys(context), `return ${condition}`);
            return fn(...Object.values(context));
        } catch {
            return true;
        }
    }

    // ========================================================================
    // HANDLERS
    // ========================================================================

    /**
     * Register a node handler
     */
    registerHandler(type: string, handler: (config: any, context: any) => Promise<any>): void {
        this.nodeHandlers.set(type, handler);
    }

    private registerDefaultHandlers(): void {
        this.registerHandler('start', async () => true);
        this.registerHandler('end', async () => true);

        this.registerHandler('task', async (config: { command?: string }) => {
            if (config.command) {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                const { stdout } = await execAsync(config.command);
                return stdout;
            }
            return null;
        });

        this.registerHandler('condition', async (config: { expression?: string }, context: any) => {
            if (config.expression) {
                return this.evaluateCondition(config.expression, context);
            }
            return true;
        });

        this.registerHandler('ai_action', async (config: { prompt?: string }) => {
            // Would call AI model
            return { prompt: config.prompt, result: 'AI response placeholder' };
        });
    }

    // ========================================================================
    // TEMPLATES
    // ========================================================================

    /**
     * Create from template
     */
    createFromTemplate(template: 'cicd' | 'deploy' | 'test' | 'review'): Workflow {
        const workflow = this.createWorkflow(`${template} Pipeline`);

        switch (template) {
            case 'cicd':
                this.addNode(workflow.id, { type: 'task', name: 'Build', config: { command: 'npm run build' }, position: { x: 200, y: 100 }, inputs: ['in'], outputs: ['out'] });
                this.addNode(workflow.id, { type: 'task', name: 'Test', config: { command: 'npm test' }, position: { x: 300, y: 100 }, inputs: ['in'], outputs: ['out'] });
                this.addNode(workflow.id, { type: 'task', name: 'Deploy', config: { command: 'npm run deploy' }, position: { x: 400, y: 100 }, inputs: ['in'], outputs: ['out'] });
                break;
        }

        return workflow;
    }
}

// Export singleton
export const visualWorkflowBuilder = VisualWorkflowBuilder.getInstance();
