/**
 * Visual Workflow Editor
 * Node-based workflow design like Google Opal Canvas
 */

import { EventEmitter } from 'events';

export interface WorkflowNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: Record<string, any>;
    inputs: string[];
    outputs: string[];
}

export type NodeType =
    | 'start'
    | 'end'
    | 'llm'
    | 'code'
    | 'condition'
    | 'loop'
    | 'http'
    | 'database'
    | 'file'
    | 'output';

export interface WorkflowEdge {
    id: string;
    source: string;
    sourceHandle: string;
    target: string;
    targetHandle: string;
    label?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface ExecutionResult {
    workflowId: string;
    nodeId: string;
    status: 'success' | 'error' | 'skipped';
    output: any;
    duration: number;
    error?: string;
}

/**
 * VisualWorkflowEditor
 * Create and execute visual workflows
 */
export class VisualWorkflowEditor extends EventEmitter {
    private static instance: VisualWorkflowEditor;
    private workflows: Map<string, Workflow> = new Map();
    private executionHistory: ExecutionResult[] = [];

    private constructor() {
        super();
    }

    static getInstance(): VisualWorkflowEditor {
        if (!VisualWorkflowEditor.instance) {
            VisualWorkflowEditor.instance = new VisualWorkflowEditor();
        }
        return VisualWorkflowEditor.instance;
    }

    /**
     * Create a new workflow
     */
    createWorkflow(name: string, description?: string): Workflow {
        const workflow: Workflow = {
            id: `workflow_${Date.now()}`,
            name,
            description,
            nodes: [
                { id: 'start', type: 'start', position: { x: 100, y: 100 }, data: {}, inputs: [], outputs: ['out'] },
                { id: 'end', type: 'end', position: { x: 500, y: 100 }, data: {}, inputs: ['in'], outputs: [] },
            ],
            edges: [],
            variables: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.workflows.set(workflow.id, workflow);
        this.emit('workflowCreated', workflow);
        return workflow;
    }

    /**
     * Add a node to workflow
     */
    addNode(workflowId: string, type: NodeType, position: { x: number; y: number }, data: Record<string, any> = {}): WorkflowNode {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error('Workflow not found');

        const node: WorkflowNode = {
            id: `node_${Date.now()}`,
            type,
            position,
            data,
            inputs: this.getDefaultInputs(type),
            outputs: this.getDefaultOutputs(type),
        };

        workflow.nodes.push(node);
        workflow.updatedAt = Date.now();
        this.emit('nodeAdded', { workflowId, node });

        return node;
    }

    /**
     * Remove a node
     */
    removeNode(workflowId: string, nodeId: string): boolean {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return false;

        const index = workflow.nodes.findIndex(n => n.id === nodeId);
        if (index === -1) return false;

        workflow.nodes.splice(index, 1);
        workflow.edges = workflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
        workflow.updatedAt = Date.now();

        this.emit('nodeRemoved', { workflowId, nodeId });
        return true;
    }

    /**
     * Connect nodes
     */
    connect(workflowId: string, source: string, target: string, sourceHandle = 'out', targetHandle = 'in'): WorkflowEdge {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error('Workflow not found');

        const edge: WorkflowEdge = {
            id: `edge_${Date.now()}`,
            source,
            sourceHandle,
            target,
            targetHandle,
        };

        workflow.edges.push(edge);
        workflow.updatedAt = Date.now();
        this.emit('edgeAdded', { workflowId, edge });

        return edge;
    }

    /**
     * Disconnect nodes
     */
    disconnect(workflowId: string, edgeId: string): boolean {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) return false;

        const index = workflow.edges.findIndex(e => e.id === edgeId);
        if (index === -1) return false;

        workflow.edges.splice(index, 1);
        workflow.updatedAt = Date.now();

        this.emit('edgeRemoved', { workflowId, edgeId });
        return true;
    }

    /**
     * Execute workflow
     */
    async execute(workflowId: string, input: Record<string, any> = {}): Promise<ExecutionResult[]> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) throw new Error('Workflow not found');

        this.emit('executionStarted', { workflowId });
        const results: ExecutionResult[] = [];
        const context = { ...workflow.variables, ...input };

        // Find start node
        const startNode = workflow.nodes.find(n => n.type === 'start');
        if (!startNode) throw new Error('No start node');

        // Execute in order
        const visited = new Set<string>();
        const queue = [startNode.id];

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const node = workflow.nodes.find(n => n.id === nodeId);
            if (!node) continue;

            const result = await this.executeNode(node, context);
            results.push(result);
            this.executionHistory.push(result);

            // Find connected nodes
            const outEdges = workflow.edges.filter(e => e.source === nodeId);
            for (const edge of outEdges) {
                queue.push(edge.target);
            }
        }

        this.emit('executionCompleted', { workflowId, results });
        return results;
    }

    /**
     * Execute single node
     */
    private async executeNode(node: WorkflowNode, context: Record<string, any>): Promise<ExecutionResult> {
        const startTime = Date.now();

        try {
            let output: any;

            switch (node.type) {
                case 'start':
                    output = context;
                    break;
                case 'end':
                    output = context;
                    break;
                case 'llm':
                    output = await this.executeLLM(node.data, context);
                    break;
                case 'code':
                    output = await this.executeCode(node.data, context);
                    break;
                case 'condition':
                    output = this.evaluateCondition(node.data, context);
                    break;
                case 'http':
                    output = await this.executeHTTP(node.data, context);
                    break;
                default:
                    output = {};
            }

            return {
                workflowId: '',
                nodeId: node.id,
                status: 'success',
                output,
                duration: Date.now() - startTime,
            };
        } catch (error: any) {
            return {
                workflowId: '',
                nodeId: node.id,
                status: 'error',
                output: null,
                duration: Date.now() - startTime,
                error: error.message,
            };
        }
    }

    private async executeLLM(data: any, context: any): Promise<any> {
        return { response: `AI response based on: ${data.prompt}` };
    }

    private async executeCode(data: any, context: any): Promise<any> {
        return { result: 'Code executed' };
    }

    private evaluateCondition(data: any, context: any): boolean {
        return true;
    }

    private async executeHTTP(data: any, context: any): Promise<any> {
        return { status: 200, body: {} };
    }

    private getDefaultInputs(type: NodeType): string[] {
        if (type === 'start') return [];
        return ['in'];
    }

    private getDefaultOutputs(type: NodeType): string[] {
        if (type === 'end') return [];
        if (type === 'condition') return ['true', 'false'];
        return ['out'];
    }

    // CRUD operations

    getWorkflow(id: string): Workflow | null {
        return this.workflows.get(id) || null;
    }

    getAllWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    deleteWorkflow(id: string): boolean {
        return this.workflows.delete(id);
    }

    exportWorkflow(id: string): string {
        const workflow = this.workflows.get(id);
        if (!workflow) throw new Error('Workflow not found');
        return JSON.stringify(workflow, null, 2);
    }

    importWorkflow(json: string): Workflow {
        const workflow = JSON.parse(json) as Workflow;
        workflow.id = `workflow_${Date.now()}`;
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
}

// Singleton getter
export function getVisualWorkflowEditor(): VisualWorkflowEditor {
    return VisualWorkflowEditor.getInstance();
}
