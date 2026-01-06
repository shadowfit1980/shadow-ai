/**
 * Infinite Wisdom Tree
 * 
 * A knowledge representation system that grows organically,
 * connecting concepts across codebases, documentation, and developer insights.
 */

import { EventEmitter } from 'events';

export interface WisdomTree {
    id: string;
    name: string;
    root: WisdomNode;
    branches: Branch[];
    connections: Connection[];
    growth: GrowthMetrics;
    lastGrowth: Date;
    createdAt: Date;
}

export interface WisdomNode {
    id: string;
    type: NodeType;
    title: string;
    content: string;
    depth: number;
    children: WisdomNode[];
    metadata: NodeMetadata;
    resonance: number; // How relevant/important
}

export type NodeType =
    | 'concept'
    | 'pattern'
    | 'example'
    | 'insight'
    | 'question'
    | 'solution'
    | 'story'
    | 'principle';

export interface NodeMetadata {
    source?: string;
    author?: string;
    createdAt: Date;
    updatedAt: Date;
    accessCount: number;
    usefulness: number;
    tags: string[];
}

export interface Branch {
    id: string;
    name: string;
    theme: string;
    nodes: string[]; // Node IDs
    health: number;
}

export interface Connection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    strength: number;
    description?: string;
}

export type ConnectionType =
    | 'builds-on'
    | 'contradicts'
    | 'exemplifies'
    | 'generalizes'
    | 'applies-to'
    | 'requires';

export interface GrowthMetrics {
    totalNodes: number;
    totalConnections: number;
    depth: number;
    breadth: number;
    density: number;
    growthRate: number;
}

export interface SearchResult {
    node: WisdomNode;
    relevance: number;
    path: string[];
    relatedNodes: WisdomNode[];
}

export interface GrowthSuggestion {
    type: 'expand' | 'connect' | 'prune' | 'deepen';
    nodeId: string;
    description: string;
    impact: number;
}

export class InfiniteWisdomTree extends EventEmitter {
    private static instance: InfiniteWisdomTree;
    private trees: Map<string, WisdomTree> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): InfiniteWisdomTree {
        if (!InfiniteWisdomTree.instance) {
            InfiniteWisdomTree.instance = new InfiniteWisdomTree();
        }
        return InfiniteWisdomTree.instance;
    }

    // ========================================================================
    // TREE CREATION
    // ========================================================================

    createTree(name: string, rootTitle: string, rootContent: string): WisdomTree {
        const root: WisdomNode = {
            id: `node_${Date.now()}`,
            type: 'concept',
            title: rootTitle,
            content: rootContent,
            depth: 0,
            children: [],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                accessCount: 0,
                usefulness: 0.5,
                tags: [],
            },
            resonance: 1,
        };

        const tree: WisdomTree = {
            id: `tree_${Date.now()}`,
            name,
            root,
            branches: [],
            connections: [],
            growth: {
                totalNodes: 1,
                totalConnections: 0,
                depth: 0,
                breadth: 0,
                density: 0,
                growthRate: 0,
            },
            lastGrowth: new Date(),
            createdAt: new Date(),
        };

        this.trees.set(tree.id, tree);
        this.emit('tree:created', tree);
        return tree;
    }

    // ========================================================================
    // NODE MANAGEMENT
    // ========================================================================

    addNode(
        treeId: string,
        parentId: string,
        type: NodeType,
        title: string,
        content: string,
        tags: string[] = []
    ): WisdomNode | undefined {
        const tree = this.trees.get(treeId);
        if (!tree) return undefined;

        const parent = this.findNode(tree.root, parentId);
        if (!parent) return undefined;

        const node: WisdomNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type,
            title,
            content,
            depth: parent.depth + 1,
            children: [],
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                accessCount: 0,
                usefulness: 0.5,
                tags,
            },
            resonance: 0.5,
        };

        parent.children.push(node);
        this.updateGrowthMetrics(tree);
        this.emit('node:added', { tree, node, parent });
        return node;
    }

    private findNode(node: WisdomNode, id: string): WisdomNode | undefined {
        if (node.id === id) return node;
        for (const child of node.children) {
            const found = this.findNode(child, id);
            if (found) return found;
        }
        return undefined;
    }

    // ========================================================================
    // CONNECTIONS
    // ========================================================================

    connect(
        treeId: string,
        sourceId: string,
        targetId: string,
        type: ConnectionType,
        description?: string
    ): Connection | undefined {
        const tree = this.trees.get(treeId);
        if (!tree) return undefined;

        const source = this.findNode(tree.root, sourceId);
        const target = this.findNode(tree.root, targetId);
        if (!source || !target) return undefined;

        const connection: Connection = {
            id: `conn_${Date.now()}`,
            sourceId,
            targetId,
            type,
            strength: 0.5,
            description,
        };

        tree.connections.push(connection);
        this.updateGrowthMetrics(tree);
        this.emit('connection:created', { tree, connection });
        return connection;
    }

    strengthenConnection(treeId: string, connectionId: string, amount: number = 0.1): void {
        const tree = this.trees.get(treeId);
        if (!tree) return;

        const connection = tree.connections.find(c => c.id === connectionId);
        if (connection) {
            connection.strength = Math.min(1, connection.strength + amount);
            this.emit('connection:strengthened', { tree, connection });
        }
    }

    // ========================================================================
    // BRANCHES
    // ========================================================================

    createBranch(treeId: string, name: string, theme: string, nodeIds: string[]): Branch | undefined {
        const tree = this.trees.get(treeId);
        if (!tree) return undefined;

        // Verify all nodes exist
        for (const id of nodeIds) {
            if (!this.findNode(tree.root, id)) return undefined;
        }

        const branch: Branch = {
            id: `branch_${Date.now()}`,
            name,
            theme,
            nodes: nodeIds,
            health: 1,
        };

        tree.branches.push(branch);
        this.emit('branch:created', { tree, branch });
        return branch;
    }

    // ========================================================================
    // SEARCH & DISCOVERY
    // ========================================================================

    search(treeId: string, query: string): SearchResult[] {
        const tree = this.trees.get(treeId);
        if (!tree) return [];

        const results: SearchResult[] = [];
        const queryLower = query.toLowerCase();

        this.searchRecursive(tree.root, queryLower, [], results);

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        return results.slice(0, 10);
    }

    private searchRecursive(
        node: WisdomNode,
        query: string,
        path: string[],
        results: SearchResult[]
    ): void {
        const currentPath = [...path, node.id];

        // Calculate relevance
        let relevance = 0;
        if (node.title.toLowerCase().includes(query)) relevance += 0.5;
        if (node.content.toLowerCase().includes(query)) relevance += 0.3;
        if (node.metadata.tags.some(t => t.toLowerCase().includes(query))) relevance += 0.2;

        relevance *= node.resonance;

        if (relevance > 0) {
            results.push({
                node,
                relevance,
                path: currentPath,
                relatedNodes: node.children.slice(0, 3),
            });
        }

        for (const child of node.children) {
            this.searchRecursive(child, query, currentPath, results);
        }
    }

    // ========================================================================
    // GROWTH
    // ========================================================================

    private updateGrowthMetrics(tree: WisdomTree): void {
        const countNodes = (node: WisdomNode): number => {
            return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
        };

        const findMaxDepth = (node: WisdomNode): number => {
            if (node.children.length === 0) return node.depth;
            return Math.max(...node.children.map(c => findMaxDepth(c)));
        };

        const countBreadth = (node: WisdomNode, depth: number[]): void => {
            depth[node.depth] = (depth[node.depth] || 0) + 1;
            node.children.forEach(c => countBreadth(c, depth));
        };

        const depthCounts: number[] = [];
        countBreadth(tree.root, depthCounts);

        const totalNodes = countNodes(tree.root);
        const totalConnections = tree.connections.length;
        const depth = findMaxDepth(tree.root);
        const breadth = Math.max(...depthCounts, 0);
        const density = totalConnections / Math.max(1, totalNodes * (totalNodes - 1) / 2);

        const previousTotal = tree.growth.totalNodes;
        const growthRate = previousTotal > 0 ? (totalNodes - previousTotal) / previousTotal : 0;

        tree.growth = {
            totalNodes,
            totalConnections,
            depth,
            breadth,
            density,
            growthRate,
        };

        tree.lastGrowth = new Date();
    }

    suggestGrowth(treeId: string): GrowthSuggestion[] {
        const tree = this.trees.get(treeId);
        if (!tree) return [];

        const suggestions: GrowthSuggestion[] = [];
        const allNodes: WisdomNode[] = [];
        this.collectAllNodes(tree.root, allNodes);

        // Suggest expansions for leaf nodes with high resonance
        const leafNodes = allNodes.filter(n => n.children.length === 0 && n.resonance > 0.7);
        for (const node of leafNodes.slice(0, 3)) {
            suggestions.push({
                type: 'expand',
                nodeId: node.id,
                description: `Expand "${node.title}" with more detailed concepts`,
                impact: node.resonance,
            });
        }

        // Suggest connections between related but unconnected nodes
        for (const node of allNodes.slice(0, 5)) {
            for (const other of allNodes.slice(5, 10)) {
                const connected = tree.connections.some(
                    c => (c.sourceId === node.id && c.targetId === other.id) ||
                        (c.sourceId === other.id && c.targetId === node.id)
                );
                if (!connected && this.areSimilar(node, other)) {
                    suggestions.push({
                        type: 'connect',
                        nodeId: node.id,
                        description: `Connect "${node.title}" to "${other.title}"`,
                        impact: 0.6,
                    });
                    break;
                }
            }
        }

        // Suggest pruning for low-value nodes
        const lowValueNodes = allNodes.filter(
            n => n.metadata.accessCount === 0 && n.metadata.usefulness < 0.3
        );
        for (const node of lowValueNodes.slice(0, 2)) {
            suggestions.push({
                type: 'prune',
                nodeId: node.id,
                description: `Consider removing "${node.title}" (low usage)`,
                impact: 0.3,
            });
        }

        return suggestions;
    }

    private collectAllNodes(node: WisdomNode, result: WisdomNode[]): void {
        result.push(node);
        node.children.forEach(c => this.collectAllNodes(c, result));
    }

    private areSimilar(a: WisdomNode, b: WisdomNode): boolean {
        const aWords = new Set(a.title.toLowerCase().split(/\s+/));
        const bWords = new Set(b.title.toLowerCase().split(/\s+/));
        let common = 0;
        for (const word of aWords) {
            if (bWords.has(word)) common++;
        }
        return common >= 1 || a.metadata.tags.some(t => b.metadata.tags.includes(t));
    }

    // ========================================================================
    // RESONANCE
    // ========================================================================

    increaseResonance(treeId: string, nodeId: string, amount: number = 0.1): void {
        const tree = this.trees.get(treeId);
        if (!tree) return;

        const node = this.findNode(tree.root, nodeId);
        if (node) {
            node.resonance = Math.min(1, node.resonance + amount);
            node.metadata.accessCount++;
            node.metadata.updatedAt = new Date();
            this.emit('resonance:increased', { tree, node });
        }
    }

    markUseful(treeId: string, nodeId: string): void {
        const tree = this.trees.get(treeId);
        if (!tree) return;

        const node = this.findNode(tree.root, nodeId);
        if (node) {
            node.metadata.usefulness = Math.min(1, node.metadata.usefulness + 0.1);
            this.emit('node:useful', { tree, node });
        }
    }

    // ========================================================================
    // VISUALIZATION
    // ========================================================================

    exportToMermaid(treeId: string): string | undefined {
        const tree = this.trees.get(treeId);
        if (!tree) return undefined;

        let diagram = 'mindmap\n  root((' + tree.root.title + '))\n';

        const addNodes = (node: WisdomNode, indent: number): void => {
            for (const child of node.children) {
                const prefix = '  '.repeat(indent);
                const shape = child.type === 'concept' ? '(' : '[';
                const closeShape = child.type === 'concept' ? ')' : ']';
                diagram += `${prefix}${shape}${child.title}${closeShape}\n`;
                addNodes(child, indent + 1);
            }
        };

        addNodes(tree.root, 2);
        return diagram;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getTree(id: string): WisdomTree | undefined {
        return this.trees.get(id);
    }

    getAllTrees(): WisdomTree[] {
        return Array.from(this.trees.values());
    }

    getStats(): {
        totalTrees: number;
        totalNodes: number;
        totalConnections: number;
        avgDepth: number;
    } {
        const trees = Array.from(this.trees.values());
        return {
            totalTrees: trees.length,
            totalNodes: trees.reduce((s, t) => s + t.growth.totalNodes, 0),
            totalConnections: trees.reduce((s, t) => s + t.growth.totalConnections, 0),
            avgDepth: trees.length > 0 ? trees.reduce((s, t) => s + t.growth.depth, 0) / trees.length : 0,
        };
    }
}

export const infiniteWisdomTree = InfiniteWisdomTree.getInstance();
