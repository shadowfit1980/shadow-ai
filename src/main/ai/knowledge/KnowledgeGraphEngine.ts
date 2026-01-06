/**
 * Knowledge Graph Engine
 * Build and query a semantic knowledge graph from codebase
 * Grok Recommendation: Knowledge Graph Building
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface KnowledgeNode {
    id: string;
    type: 'concept' | 'entity' | 'file' | 'function' | 'class' | 'variable' | 'pattern' | 'technology';
    label: string;
    properties: Record<string, unknown>;
    embeddings?: number[];
    createdAt: Date;
    updatedAt: Date;
}

interface KnowledgeEdge {
    id: string;
    source: string;
    target: string;
    relationship: string;
    weight: number;
    properties: Record<string, unknown>;
    bidirectional: boolean;
}

interface GraphQuery {
    startNode?: string;
    nodeType?: KnowledgeNode['type'];
    relationship?: string;
    depth?: number;
    limit?: number;
}

interface QueryResult {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    paths: { nodes: string[]; relationships: string[] }[];
    executionTime: number;
}

interface GraphStats {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByRelationship: Record<string, number>;
    averageDegree: number;
    density: number;
}

interface Cluster {
    id: string;
    name: string;
    nodes: string[];
    centroid: KnowledgeNode;
    cohesion: number;
}

interface Recommendation {
    type: 'related' | 'similar' | 'learned_from' | 'dependency';
    source: string;
    target: string;
    confidence: number;
    reason: string;
}

export class KnowledgeGraphEngine extends EventEmitter {
    private static instance: KnowledgeGraphEngine;
    private nodes: Map<string, KnowledgeNode> = new Map();
    private edges: Map<string, KnowledgeEdge> = new Map();
    private adjacencyList: Map<string, Set<string>> = new Map();
    private reverseAdjacencyList: Map<string, Set<string>> = new Map();
    private clusters: Map<string, Cluster> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): KnowledgeGraphEngine {
        if (!KnowledgeGraphEngine.instance) {
            KnowledgeGraphEngine.instance = new KnowledgeGraphEngine();
        }
        return KnowledgeGraphEngine.instance;
    }

    addNode(config: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeNode {
        const node: KnowledgeNode = {
            id: crypto.randomUUID(),
            ...config,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.nodes.set(node.id, node);
        this.adjacencyList.set(node.id, new Set());
        this.reverseAdjacencyList.set(node.id, new Set());

        this.emit('nodeAdded', node);
        return node;
    }

    addEdge(source: string, target: string, relationship: string, properties: Record<string, unknown> = {}): KnowledgeEdge | null {
        if (!this.nodes.has(source) || !this.nodes.has(target)) {
            return null;
        }

        const edge: KnowledgeEdge = {
            id: crypto.randomUUID(),
            source,
            target,
            relationship,
            weight: 1,
            properties,
            bidirectional: false
        };

        this.edges.set(edge.id, edge);
        this.adjacencyList.get(source)?.add(edge.id);
        this.reverseAdjacencyList.get(target)?.add(edge.id);

        this.emit('edgeAdded', edge);
        return edge;
    }

    findNode(label: string): KnowledgeNode | undefined {
        return Array.from(this.nodes.values()).find(n => n.label === label);
    }

    getNode(id: string): KnowledgeNode | undefined {
        return this.nodes.get(id);
    }

    query(graphQuery: GraphQuery): QueryResult {
        const startTime = Date.now();
        const resultNodes: Map<string, KnowledgeNode> = new Map();
        const resultEdges: Map<string, KnowledgeEdge> = new Map();
        const paths: { nodes: string[]; relationships: string[] }[] = [];

        if (graphQuery.startNode) {
            const startNode = this.nodes.get(graphQuery.startNode);
            if (startNode) {
                const visited = new Set<string>();
                this.traverseGraph(
                    graphQuery.startNode,
                    visited,
                    resultNodes,
                    resultEdges,
                    paths,
                    [],
                    [],
                    graphQuery.depth || 2,
                    graphQuery.relationship
                );
            }
        } else if (graphQuery.nodeType) {
            for (const node of this.nodes.values()) {
                if (node.type === graphQuery.nodeType) {
                    resultNodes.set(node.id, node);
                }
            }
        }

        const limit = graphQuery.limit || 100;
        const limitedNodes = Array.from(resultNodes.values()).slice(0, limit);
        const limitedEdges = Array.from(resultEdges.values()).slice(0, limit * 2);

        return {
            nodes: limitedNodes,
            edges: limitedEdges,
            paths: paths.slice(0, 10),
            executionTime: Date.now() - startTime
        };
    }

    private traverseGraph(
        nodeId: string,
        visited: Set<string>,
        resultNodes: Map<string, KnowledgeNode>,
        resultEdges: Map<string, KnowledgeEdge>,
        paths: { nodes: string[]; relationships: string[] }[],
        currentPath: string[],
        currentRels: string[],
        depth: number,
        relationship?: string
    ): void {
        if (depth < 0 || visited.has(nodeId)) return;

        visited.add(nodeId);
        const node = this.nodes.get(nodeId);
        if (node) {
            resultNodes.set(node.id, node);
            currentPath.push(nodeId);
        }

        const edgeIds = this.adjacencyList.get(nodeId);
        if (edgeIds) {
            for (const edgeId of edgeIds) {
                const edge = this.edges.get(edgeId);
                if (edge && (!relationship || edge.relationship === relationship)) {
                    resultEdges.set(edge.id, edge);

                    const newPath = [...currentPath];
                    const newRels = [...currentRels, edge.relationship];

                    this.traverseGraph(
                        edge.target,
                        visited,
                        resultNodes,
                        resultEdges,
                        paths,
                        newPath,
                        newRels,
                        depth - 1,
                        relationship
                    );
                }
            }
        }

        if (currentPath.length > 1) {
            paths.push({ nodes: [...currentPath], relationships: [...currentRels] });
        }
    }

    getNeighbors(nodeId: string, direction: 'outgoing' | 'incoming' | 'both' = 'both'): KnowledgeNode[] {
        const neighbors: KnowledgeNode[] = [];
        const seen = new Set<string>();

        if (direction === 'outgoing' || direction === 'both') {
            const outEdges = this.adjacencyList.get(nodeId);
            if (outEdges) {
                for (const edgeId of outEdges) {
                    const edge = this.edges.get(edgeId);
                    if (edge && !seen.has(edge.target)) {
                        const neighbor = this.nodes.get(edge.target);
                        if (neighbor) {
                            neighbors.push(neighbor);
                            seen.add(edge.target);
                        }
                    }
                }
            }
        }

        if (direction === 'incoming' || direction === 'both') {
            const inEdges = this.reverseAdjacencyList.get(nodeId);
            if (inEdges) {
                for (const edgeId of inEdges) {
                    const edge = this.edges.get(edgeId);
                    if (edge && !seen.has(edge.source)) {
                        const neighbor = this.nodes.get(edge.source);
                        if (neighbor) {
                            neighbors.push(neighbor);
                            seen.add(edge.source);
                        }
                    }
                }
            }
        }

        return neighbors;
    }

    findShortestPath(sourceId: string, targetId: string): { path: string[]; distance: number } | null {
        if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
            return null;
        }

        const visited = new Set<string>();
        const queue: { nodeId: string; path: string[] }[] = [{ nodeId: sourceId, path: [sourceId] }];

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.nodeId === targetId) {
                return { path: current.path, distance: current.path.length - 1 };
            }

            if (visited.has(current.nodeId)) continue;
            visited.add(current.nodeId);

            const neighbors = this.getNeighbors(current.nodeId, 'outgoing');
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    queue.push({ nodeId: neighbor.id, path: [...current.path, neighbor.id] });
                }
            }
        }

        return null;
    }

    computePageRank(iterations: number = 20, dampingFactor: number = 0.85): Map<string, number> {
        const nodeIds = Array.from(this.nodes.keys());
        const n = nodeIds.length;
        const ranks = new Map<string, number>();

        // Initialize ranks
        for (const id of nodeIds) {
            ranks.set(id, 1 / n);
        }

        for (let i = 0; i < iterations; i++) {
            const newRanks = new Map<string, number>();

            for (const id of nodeIds) {
                let rank = (1 - dampingFactor) / n;

                const inEdges = this.reverseAdjacencyList.get(id);
                if (inEdges) {
                    for (const edgeId of inEdges) {
                        const edge = this.edges.get(edgeId);
                        if (edge) {
                            const sourceOutDegree = this.adjacencyList.get(edge.source)?.size || 1;
                            const sourceRank = ranks.get(edge.source) || 0;
                            rank += dampingFactor * (sourceRank / sourceOutDegree);
                        }
                    }
                }

                newRanks.set(id, rank);
            }

            for (const [id, rank] of newRanks) {
                ranks.set(id, rank);
            }
        }

        return ranks;
    }

    findClusters(k: number = 5): Cluster[] {
        const nodeIds = Array.from(this.nodes.keys());
        if (nodeIds.length < k) k = nodeIds.length;

        // Simple k-means-like clustering based on connectivity
        const clusters: Cluster[] = [];
        const assigned = new Set<string>();

        // Pick k centroids (most connected nodes)
        const degrees = new Map<string, number>();
        for (const id of nodeIds) {
            degrees.set(id, (this.adjacencyList.get(id)?.size || 0) + (this.reverseAdjacencyList.get(id)?.size || 0));
        }

        const sortedByDegree = nodeIds.sort((a, b) => (degrees.get(b) || 0) - (degrees.get(a) || 0));
        const centroids = sortedByDegree.slice(0, k);

        for (let i = 0; i < k; i++) {
            const centroidNode = this.nodes.get(centroids[i]);
            if (!centroidNode) continue;

            const cluster: Cluster = {
                id: `cluster_${i}`,
                name: `Cluster ${i + 1}`,
                nodes: [centroids[i]],
                centroid: centroidNode,
                cohesion: 0
            };

            // Assign nearest nodes to this cluster
            const neighbors = this.getNeighbors(centroids[i], 'both');
            for (const neighbor of neighbors) {
                if (!assigned.has(neighbor.id)) {
                    cluster.nodes.push(neighbor.id);
                    assigned.add(neighbor.id);
                }
            }

            assigned.add(centroids[i]);
            clusters.push(cluster);
            this.clusters.set(cluster.id, cluster);
        }

        return clusters;
    }

    getRecommendations(nodeId: string, limit: number = 10): Recommendation[] {
        const recommendations: Recommendation[] = [];
        const node = this.nodes.get(nodeId);
        if (!node) return recommendations;

        // Find related nodes through connections
        const neighbors = this.getNeighbors(nodeId, 'both');
        for (const neighbor of neighbors.slice(0, limit)) {
            recommendations.push({
                type: 'related',
                source: nodeId,
                target: neighbor.id,
                confidence: 0.8,
                reason: `Directly connected to ${node.label}`
            });
        }

        // Find similar nodes by type
        const similarNodes = Array.from(this.nodes.values())
            .filter(n => n.type === node.type && n.id !== nodeId)
            .slice(0, limit);

        for (const similar of similarNodes) {
            recommendations.push({
                type: 'similar',
                source: nodeId,
                target: similar.id,
                confidence: 0.6,
                reason: `Same type: ${node.type}`
            });
        }

        return recommendations.slice(0, limit);
    }

    getStats(): GraphStats {
        const nodesByType: Record<string, number> = {};
        const edgesByRelationship: Record<string, number> = {};

        for (const node of this.nodes.values()) {
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
        }

        for (const edge of this.edges.values()) {
            edgesByRelationship[edge.relationship] = (edgesByRelationship[edge.relationship] || 0) + 1;
        }

        const totalNodes = this.nodes.size;
        const totalEdges = this.edges.size;
        const averageDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
        const maxPossibleEdges = totalNodes * (totalNodes - 1);
        const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

        return {
            totalNodes,
            totalEdges,
            nodesByType,
            edgesByRelationship,
            averageDegree: Math.round(averageDegree * 100) / 100,
            density: Math.round(density * 10000) / 10000
        };
    }

    exportToJSON(): string {
        return JSON.stringify({
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values())
        }, null, 2);
    }

    importFromJSON(json: string): { nodesImported: number; edgesImported: number } {
        const data = JSON.parse(json);
        let nodesImported = 0;
        let edgesImported = 0;

        for (const nodeData of data.nodes || []) {
            const node: KnowledgeNode = {
                ...nodeData,
                createdAt: new Date(nodeData.createdAt),
                updatedAt: new Date(nodeData.updatedAt)
            };
            this.nodes.set(node.id, node);
            this.adjacencyList.set(node.id, new Set());
            this.reverseAdjacencyList.set(node.id, new Set());
            nodesImported++;
        }

        for (const edgeData of data.edges || []) {
            const edge: KnowledgeEdge = { ...edgeData };
            this.edges.set(edge.id, edge);
            this.adjacencyList.get(edge.source)?.add(edge.id);
            this.reverseAdjacencyList.get(edge.target)?.add(edge.id);
            edgesImported++;
        }

        return { nodesImported, edgesImported };
    }

    clear(): void {
        this.nodes.clear();
        this.edges.clear();
        this.adjacencyList.clear();
        this.reverseAdjacencyList.clear();
        this.clusters.clear();
    }

    deleteNode(id: string): boolean {
        if (!this.nodes.has(id)) return false;

        // Remove all edges connected to this node
        const outEdges = this.adjacencyList.get(id);
        const inEdges = this.reverseAdjacencyList.get(id);

        if (outEdges) {
            for (const edgeId of outEdges) {
                this.edges.delete(edgeId);
            }
        }

        if (inEdges) {
            for (const edgeId of inEdges) {
                this.edges.delete(edgeId);
            }
        }

        this.nodes.delete(id);
        this.adjacencyList.delete(id);
        this.reverseAdjacencyList.delete(id);

        return true;
    }
}

export const knowledgeGraphEngine = KnowledgeGraphEngine.getInstance();
