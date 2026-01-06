/**
 * Visual Flow Builder
 * Low-code visual designer for agent logic flows
 * Similar to Cognigy's low-code designer
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export enum NodeType {
    START = 'start',
    END = 'end',
    MESSAGE = 'message',
    CONDITION = 'condition',
    ACTION = 'action',
    LOOP = 'loop',
    WAIT = 'wait',
    API_CALL = 'api_call',
    SET_VARIABLE = 'set_variable',
    INTENT_MATCH = 'intent_match',
    LLM_PROMPT = 'llm_prompt',
    HANDOFF = 'handoff',
}

export interface FlowNode {
    id: string;
    type: NodeType;
    label: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    outputs: string[]; // Connection IDs
}

export interface FlowConnection {
    id: string;
    sourceId: string;
    targetId: string;
    label?: string;
    condition?: string;
}

export interface Flow {
    id: string;
    name: string;
    description?: string;
    nodes: FlowNode[];
    connections: FlowConnection[];
    variables: FlowVariable[];
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
}

export interface FlowVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    defaultValue?: any;
    scope: 'flow' | 'session' | 'global';
}

export interface FlowExecutionContext {
    flowId: string;
    currentNodeId: string;
    variables: Record<string, any>;
    history: string[];
    startTime: number;
}

/**
 * FlowBuilder
 * Visual flow design and execution engine
 */
export class FlowBuilder extends EventEmitter {
    private static instance: FlowBuilder;
    private flows: Map<string, Flow> = new Map();
    private nodeCounter = 0;
    private connectionCounter = 0;

    private constructor() {
        super();
    }

    static getInstance(): FlowBuilder {
        if (!FlowBuilder.instance) {
            FlowBuilder.instance = new FlowBuilder();
        }
        return FlowBuilder.instance;
    }

    /**
     * Create a new flow
     */
    createFlow(options: { name: string; description?: string }): Flow {
        const id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        const flow: Flow = {
            id,
            name: options.name,
            description: options.description,
            nodes: [
                this.createNode(NodeType.START, 'Start', { x: 100, y: 100 }),
                this.createNode(NodeType.END, 'End', { x: 100, y: 400 }),
            ],
            connections: [],
            variables: [],
            metadata: {},
            createdAt: now,
            updatedAt: now,
        };

        this.flows.set(id, flow);
        this.emit('flowCreated', flow);
        return flow;
    }

    /**
     * Get flow by ID
     */
    getFlow(id: string): Flow | null {
        return this.flows.get(id) || null;
    }

    /**
     * Get all flows
     */
    getAllFlows(): Flow[] {
        return Array.from(this.flows.values());
    }

    /**
     * Delete flow
     */
    deleteFlow(id: string): boolean {
        const deleted = this.flows.delete(id);
        if (deleted) {
            this.emit('flowDeleted', { id });
        }
        return deleted;
    }

    /**
     * Add node to flow
     */
    addNode(flowId: string, type: NodeType, label: string, position: { x: number; y: number }, data?: Record<string, any>): FlowNode | null {
        const flow = this.flows.get(flowId);
        if (!flow) return null;

        const node = this.createNode(type, label, position, data);
        flow.nodes.push(node);
        flow.updatedAt = Date.now();

        this.emit('nodeAdded', { flowId, node });
        return node;
    }

    /**
     * Update node
     */
    updateNode(flowId: string, nodeId: string, updates: Partial<FlowNode>): FlowNode | null {
        const flow = this.flows.get(flowId);
        if (!flow) return null;

        const node = flow.nodes.find(n => n.id === nodeId);
        if (!node) return null;

        Object.assign(node, updates, { id: nodeId }); // Preserve ID
        flow.updatedAt = Date.now();

        this.emit('nodeUpdated', { flowId, node });
        return node;
    }

    /**
     * Delete node
     */
    deleteNode(flowId: string, nodeId: string): boolean {
        const flow = this.flows.get(flowId);
        if (!flow) return false;

        const index = flow.nodes.findIndex(n => n.id === nodeId);
        if (index === -1) return false;

        // Don't allow deleting start/end nodes
        const node = flow.nodes[index];
        if (node.type === NodeType.START || node.type === NodeType.END) {
            return false;
        }

        flow.nodes.splice(index, 1);

        // Remove related connections
        flow.connections = flow.connections.filter(
            c => c.sourceId !== nodeId && c.targetId !== nodeId
        );

        flow.updatedAt = Date.now();
        this.emit('nodeDeleted', { flowId, nodeId });
        return true;
    }

    /**
     * Add connection between nodes
     */
    addConnection(flowId: string, sourceId: string, targetId: string, options?: { label?: string; condition?: string }): FlowConnection | null {
        const flow = this.flows.get(flowId);
        if (!flow) return null;

        // Validate nodes exist
        const sourceNode = flow.nodes.find(n => n.id === sourceId);
        const targetNode = flow.nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return null;

        const connection: FlowConnection = {
            id: `conn_${++this.connectionCounter}_${Date.now()}`,
            sourceId,
            targetId,
            label: options?.label,
            condition: options?.condition,
        };

        flow.connections.push(connection);
        sourceNode.outputs.push(connection.id);
        flow.updatedAt = Date.now();

        this.emit('connectionAdded', { flowId, connection });
        return connection;
    }

    /**
     * Delete connection
     */
    deleteConnection(flowId: string, connectionId: string): boolean {
        const flow = this.flows.get(flowId);
        if (!flow) return false;

        const index = flow.connections.findIndex(c => c.id === connectionId);
        if (index === -1) return false;

        const connection = flow.connections[index];
        flow.connections.splice(index, 1);

        // Remove from source node's outputs
        const sourceNode = flow.nodes.find(n => n.id === connection.sourceId);
        if (sourceNode) {
            sourceNode.outputs = sourceNode.outputs.filter(id => id !== connectionId);
        }

        flow.updatedAt = Date.now();
        this.emit('connectionDeleted', { flowId, connectionId });
        return true;
    }

    /**
     * Add variable to flow
     */
    addVariable(flowId: string, variable: FlowVariable): boolean {
        const flow = this.flows.get(flowId);
        if (!flow) return false;

        flow.variables.push(variable);
        flow.updatedAt = Date.now();

        this.emit('variableAdded', { flowId, variable });
        return true;
    }

    /**
     * Validate flow
     */
    validateFlow(flowId: string): { valid: boolean; errors: string[] } {
        const flow = this.flows.get(flowId);
        if (!flow) return { valid: false, errors: ['Flow not found'] };

        const errors: string[] = [];

        // Check for start and end nodes
        const hasStart = flow.nodes.some(n => n.type === NodeType.START);
        const hasEnd = flow.nodes.some(n => n.type === NodeType.END);

        if (!hasStart) errors.push('Flow must have a start node');
        if (!hasEnd) errors.push('Flow must have an end node');

        // Check for disconnected nodes
        const connectedNodes = new Set<string>();
        for (const conn of flow.connections) {
            connectedNodes.add(conn.sourceId);
            connectedNodes.add(conn.targetId);
        }

        for (const node of flow.nodes) {
            if (!connectedNodes.has(node.id) && node.type !== NodeType.START && node.type !== NodeType.END) {
                errors.push(`Node "${node.label}" is disconnected`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Export flow to JSON
     */
    exportFlow(flowId: string): string | null {
        const flow = this.flows.get(flowId);
        if (!flow) return null;
        return JSON.stringify(flow, null, 2);
    }

    /**
     * Import flow from JSON
     */
    importFlow(json: string): Flow | null {
        try {
            const flow = JSON.parse(json) as Flow;
            flow.id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            flow.createdAt = Date.now();
            flow.updatedAt = Date.now();

            this.flows.set(flow.id, flow);
            this.emit('flowImported', flow);
            return flow;
        } catch (error) {
            console.error('Failed to import flow:', error);
            return null;
        }
    }

    /**
     * Generate code from flow
     */
    generateCode(flowId: string): string | null {
        const flow = this.flows.get(flowId);
        if (!flow) return null;

        const lines: string[] = [
            `// Auto-generated from flow: ${flow.name}`,
            `// Generated at: ${new Date().toISOString()}`,
            '',
            'async function executeFlow(context) {',
            '  const variables = {};',
            '',
        ];

        // Find start node
        const startNode = flow.nodes.find(n => n.type === NodeType.START);
        if (!startNode) return null;

        // Generate code for each node (simplified)
        const visited = new Set<string>();
        const queue = [startNode.id];

        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const node = flow.nodes.find(n => n.id === nodeId);
            if (!node) continue;

            lines.push(`  // ${node.label}`);

            switch (node.type) {
                case NodeType.MESSAGE:
                    lines.push(`  await sendMessage(${JSON.stringify(node.data.message || '')});`);
                    break;
                case NodeType.CONDITION:
                    lines.push(`  if (${node.data.condition || 'true'}) {`);
                    lines.push(`    // True branch`);
                    lines.push(`  }`);
                    break;
                case NodeType.ACTION:
                    lines.push(`  await executeAction(${JSON.stringify(node.data.action || '')});`);
                    break;
                case NodeType.LLM_PROMPT:
                    lines.push(`  const response = await callLLM(${JSON.stringify(node.data.prompt || '')});`);
                    break;
                case NodeType.SET_VARIABLE:
                    lines.push(`  variables[${JSON.stringify(node.data.name)}] = ${node.data.value};`);
                    break;
            }

            // Add connected nodes to queue
            for (const conn of flow.connections) {
                if (conn.sourceId === nodeId) {
                    queue.push(conn.targetId);
                }
            }
        }

        lines.push('');
        lines.push('  return { success: true, variables };');
        lines.push('}');

        return lines.join('\n');
    }

    // Private methods

    private createNode(type: NodeType, label: string, position: { x: number; y: number }, data?: Record<string, any>): FlowNode {
        return {
            id: `node_${++this.nodeCounter}_${Date.now()}`,
            type,
            label,
            position,
            data: data || {},
            outputs: [],
        };
    }
}

// Singleton getter
export function getFlowBuilder(): FlowBuilder {
    return FlowBuilder.getInstance();
}
