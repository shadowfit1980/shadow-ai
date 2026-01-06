/**
 * AI Knowledge Graph
 * 
 * Builds and queries a knowledge graph from code relationships,
 * documentation, and learned patterns to provide intelligent insights.
 */

import { EventEmitter } from 'events';

export interface KnowledgeNode {
    id: string;
    type: NodeType;
    label: string;
    properties: Record<string, any>;
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        confidence: number;
        source: string;
    };
}

export type NodeType =
    | 'file'
    | 'function'
    | 'class'
    | 'module'
    | 'variable'
    | 'concept'
    | 'pattern'
    | 'dependency'
    | 'error'
    | 'solution';

export interface KnowledgeEdge {
    id: string;
    type: EdgeType;
    from: string;
    to: string;
    weight: number;
    properties: Record<string, any>;
}

export type EdgeType =
    | 'imports'
    | 'exports'
    | 'calls'
    | 'implements'
    | 'extends'
    | 'depends_on'
    | 'related_to'
    | 'solves'
    | 'causes'
    | 'similar_to';

export interface GraphQuery {
    startNode?: string;
    nodeTypes?: NodeType[];
    edgeTypes?: EdgeType[];
    maxDepth?: number;
    limit?: number;
}

export interface GraphInsight {
    type: 'pattern' | 'anomaly' | 'suggestion' | 'relationship';
    title: string;
    description: string;
    nodes: string[];
    confidence: number;
}

export interface SubGraph {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
}

export class AIKnowledgeGraph extends EventEmitter {
    private static instance: AIKnowledgeGraph;
    private nodes: Map<string, KnowledgeNode> = new Map();
    private edges: Map<string, KnowledgeEdge> = new Map();
    private adjacencyList: Map<string, Set<string>> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): AIKnowledgeGraph {
        if (!AIKnowledgeGraph.instance) {
            AIKnowledgeGraph.instance = new AIKnowledgeGraph();
        }
        return AIKnowledgeGraph.instance;
    }

    // ========================================================================
    // NODE OPERATIONS
    // ========================================================================

    addNode(type: NodeType, label: string, properties: Record<string, any> = {}): KnowledgeNode {
        const node: KnowledgeNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            label,
            properties,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                confidence: 1.0,
                source: 'user',
            },
        };

        this.nodes.set(node.id, node);
        this.adjacencyList.set(node.id, new Set());
        this.emit('node:added', node);
        return node;
    }

    updateNode(id: string, updates: Partial<Pick<KnowledgeNode, 'label' | 'properties'>>): KnowledgeNode | undefined {
        const node = this.nodes.get(id);
        if (!node) return undefined;

        if (updates.label) node.label = updates.label;
        if (updates.properties) Object.assign(node.properties, updates.properties);
        node.metadata.updatedAt = new Date();

        this.emit('node:updated', node);
        return node;
    }

    removeNode(id: string): boolean {
        const node = this.nodes.get(id);
        if (!node) return false;

        // Remove all connected edges
        const connected = this.adjacencyList.get(id) || new Set();
        for (const edgeId of connected) {
            this.edges.delete(edgeId);
        }

        this.nodes.delete(id);
        this.adjacencyList.delete(id);
        this.emit('node:removed', id);
        return true;
    }

    getNode(id: string): KnowledgeNode | undefined {
        return this.nodes.get(id);
    }

    findNodes(query: { type?: NodeType; label?: string; properties?: Record<string, any> }): KnowledgeNode[] {
        return Array.from(this.nodes.values()).filter(node => {
            if (query.type && node.type !== query.type) return false;
            if (query.label && !node.label.toLowerCase().includes(query.label.toLowerCase())) return false;
            if (query.properties) {
                for (const [key, value] of Object.entries(query.properties)) {
                    if (node.properties[key] !== value) return false;
                }
            }
            return true;
        });
    }

    // ========================================================================
    // EDGE OPERATIONS
    // ========================================================================

    addEdge(type: EdgeType, from: string, to: string, properties: Record<string, any> = {}): KnowledgeEdge | undefined {
        if (!this.nodes.has(from) || !this.nodes.has(to)) return undefined;

        const edge: KnowledgeEdge = {
            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            from,
            to,
            weight: 1.0,
            properties,
        };

        this.edges.set(edge.id, edge);
        this.adjacencyList.get(from)?.add(edge.id);
        this.adjacencyList.get(to)?.add(edge.id);
        this.emit('edge:added', edge);
        return edge;
    }

    removeEdge(id: string): boolean {
        const edge = this.edges.get(id);
        if (!edge) return false;

        this.adjacencyList.get(edge.from)?.delete(id);
        this.adjacencyList.get(edge.to)?.delete(id);
        this.edges.delete(id);
        this.emit('edge:removed', id);
        return true;
    }

    getEdge(id: string): KnowledgeEdge | undefined {
        return this.edges.get(id);
    }

    getEdgesBetween(from: string, to: string): KnowledgeEdge[] {
        return Array.from(this.edges.values()).filter(
            edge => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
        );
    }

    // ========================================================================
    // GRAPH TRAVERSAL
    // ========================================================================

    traverse(query: GraphQuery): SubGraph {
        const visitedNodes = new Set<string>();
        const visitedEdges = new Set<string>();
        const resultNodes: KnowledgeNode[] = [];
        const resultEdges: KnowledgeEdge[] = [];

        const startNodes = query.startNode
            ? [this.nodes.get(query.startNode)].filter(Boolean) as KnowledgeNode[]
            : Array.from(this.nodes.values()).slice(0, 10);

        const bfs = (start: KnowledgeNode, depth: number) => {
            if (depth > (query.maxDepth || 3)) return;
            if (visitedNodes.has(start.id)) return;
            if (query.limit && resultNodes.length >= query.limit) return;

            if (!query.nodeTypes || query.nodeTypes.includes(start.type)) {
                visitedNodes.add(start.id);
                resultNodes.push(start);
            }

            const edgeIds = this.adjacencyList.get(start.id) || new Set();
            for (const edgeId of edgeIds) {
                if (visitedEdges.has(edgeId)) continue;

                const edge = this.edges.get(edgeId);
                if (!edge) continue;
                if (query.edgeTypes && !query.edgeTypes.includes(edge.type)) continue;

                visitedEdges.add(edgeId);
                resultEdges.push(edge);

                const nextNodeId = edge.from === start.id ? edge.to : edge.from;
                const nextNode = this.nodes.get(nextNodeId);
                if (nextNode) {
                    bfs(nextNode, depth + 1);
                }
            }
        };

        for (const node of startNodes) {
            bfs(node, 0);
        }

        return { nodes: resultNodes, edges: resultEdges };
    }

    findPath(from: string, to: string): KnowledgeNode[] {
        if (!this.nodes.has(from) || !this.nodes.has(to)) return [];

        const visited = new Set<string>();
        const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];

        while (queue.length > 0) {
            const { node, path } = queue.shift()!;

            if (node === to) {
                return path.map(id => this.nodes.get(id)!);
            }

            if (visited.has(node)) continue;
            visited.add(node);

            const edgeIds = this.adjacencyList.get(node) || new Set();
            for (const edgeId of edgeIds) {
                const edge = this.edges.get(edgeId);
                if (!edge) continue;

                const nextNode = edge.from === node ? edge.to : edge.from;
                if (!visited.has(nextNode)) {
                    queue.push({ node: nextNode, path: [...path, nextNode] });
                }
            }
        }

        return [];
    }

    // ========================================================================
    // INSIGHTS
    // ========================================================================

    generateInsights(): GraphInsight[] {
        const insights: GraphInsight[] = [];

        // Find highly connected nodes (hubs)
        const connectionCounts = new Map<string, number>();
        for (const [nodeId, edges] of this.adjacencyList) {
            connectionCounts.set(nodeId, edges.size);
        }

        const sorted = Array.from(connectionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [nodeId, count] of sorted) {
            if (count > 3) {
                const node = this.nodes.get(nodeId);
                if (node) {
                    insights.push({
                        type: 'pattern',
                        title: `Hub node: ${node.label}`,
                        description: `This ${node.type} is connected to ${count} other nodes, indicating it's a central part of the codebase.`,
                        nodes: [nodeId],
                        confidence: 0.9,
                    });
                }
            }
        }

        // Find isolated nodes
        for (const [nodeId, edges] of this.adjacencyList) {
            if (edges.size === 0) {
                const node = this.nodes.get(nodeId);
                if (node) {
                    insights.push({
                        type: 'anomaly',
                        title: `Isolated ${node.type}: ${node.label}`,
                        description: 'This node has no connections, which might indicate dead code or missing relationships.',
                        nodes: [nodeId],
                        confidence: 0.7,
                    });
                }
            }
        }

        return insights;
    }

    // ========================================================================
    // IMPORT/EXPORT
    // ========================================================================

    export(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values()),
        };
    }

    import(data: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }): void {
        this.clear();

        for (const node of data.nodes) {
            this.nodes.set(node.id, node);
            this.adjacencyList.set(node.id, new Set());
        }

        for (const edge of data.edges) {
            this.edges.set(edge.id, edge);
            this.adjacencyList.get(edge.from)?.add(edge.id);
            this.adjacencyList.get(edge.to)?.add(edge.id);
        }

        this.emit('graph:imported', { nodes: data.nodes.length, edges: data.edges.length });
    }

    clear(): void {
        this.nodes.clear();
        this.edges.clear();
        this.adjacencyList.clear();
        this.emit('graph:cleared');
    }

    // ========================================================================
    // STATS
    // ========================================================================

    getStats(): {
        nodeCount: number;
        edgeCount: number;
        nodesByType: Record<NodeType, number>;
        edgesByType: Record<EdgeType, number>;
        avgConnections: number;
    } {
        const nodesByType: Record<string, number> = {};
        for (const node of this.nodes.values()) {
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
        }

        const edgesByType: Record<string, number> = {};
        for (const edge of this.edges.values()) {
            edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
        }

        const totalConnections = Array.from(this.adjacencyList.values())
            .reduce((sum, edges) => sum + edges.size, 0);

        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.size,
            nodesByType: nodesByType as Record<NodeType, number>,
            edgesByType: edgesByType as Record<EdgeType, number>,
            avgConnections: this.nodes.size > 0 ? totalConnections / this.nodes.size : 0,
        };
    }
}

export const aiKnowledgeGraph = AIKnowledgeGraph.getInstance();
