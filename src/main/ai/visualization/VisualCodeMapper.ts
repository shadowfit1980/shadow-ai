/**
 * Visual Code Mapper
 * 
 * Creates 3D/graph visualizations of codebase dependencies,
 * call flows, and architecture for AI-guided navigation.
 */

import { EventEmitter } from 'events';

export interface CodeMap {
    id: string;
    name: string;
    rootPath: string;
    nodes: MapNode[];
    edges: MapEdge[];
    clusters: Cluster[];
    metrics: MapMetrics;
    generatedAt: Date;
}

export interface MapNode {
    id: string;
    label: string;
    type: NodeType;
    path: string;
    position: Position3D;
    size: number;
    color: string;
    metadata: NodeMetadata;
}

export type NodeType =
    | 'file'
    | 'directory'
    | 'function'
    | 'class'
    | 'module'
    | 'interface'
    | 'component'
    | 'hook'
    | 'api';

export interface Position3D {
    x: number;
    y: number;
    z: number;
}

export interface NodeMetadata {
    lines?: number;
    complexity?: number;
    dependencies?: number;
    dependents?: number;
    lastModified?: Date;
}

export interface MapEdge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    weight: number;
    animated?: boolean;
}

export type EdgeType =
    | 'imports'
    | 'exports'
    | 'calls'
    | 'extends'
    | 'implements'
    | 'uses'
    | 'contains';

export interface Cluster {
    id: string;
    name: string;
    nodes: string[];
    color: string;
    bounds: { min: Position3D; max: Position3D };
}

export interface MapMetrics {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    avgConnectivity: number;
    hotspots: string[];
}

export interface NavigationPath {
    from: string;
    to: string;
    nodes: string[];
    edges: string[];
    distance: number;
}

export class VisualCodeMapper extends EventEmitter {
    private static instance: VisualCodeMapper;
    private maps: Map<string, CodeMap> = new Map();
    private colorScheme = {
        file: '#3498db',
        directory: '#9b59b6',
        function: '#2ecc71',
        class: '#e74c3c',
        module: '#f39c12',
        interface: '#1abc9c',
        component: '#e94560',
        hook: '#00d9ff',
        api: '#ff6b6b',
    };

    private constructor() {
        super();
    }

    static getInstance(): VisualCodeMapper {
        if (!VisualCodeMapper.instance) {
            VisualCodeMapper.instance = new VisualCodeMapper();
        }
        return VisualCodeMapper.instance;
    }

    // ========================================================================
    // MAP GENERATION
    // ========================================================================

    async generateMap(files: { path: string; content: string }[], projectName: string): Promise<CodeMap> {
        const nodes: MapNode[] = [];
        const edges: MapEdge[] = [];
        const nodeIndex = new Map<string, MapNode>();

        // Parse files and create nodes
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileNodes = this.parseFileNodes(file.path, file.content, i);

            for (const node of fileNodes) {
                nodes.push(node);
                nodeIndex.set(node.id, node);
            }
        }

        // Detect relationships and create edges
        for (const file of files) {
            const fileEdges = this.detectRelationships(file.path, file.content, nodeIndex);
            edges.push(...fileEdges);
        }

        // Create clusters based on directory structure
        const clusters = this.createClusters(nodes);

        // Calculate positions using force-directed layout
        this.layoutNodes(nodes, edges);

        // Calculate metrics
        const metrics = this.calculateMetrics(nodes, edges);

        const map: CodeMap = {
            id: `map_${Date.now()}`,
            name: projectName,
            rootPath: this.findCommonRoot(files.map(f => f.path)),
            nodes,
            edges,
            clusters,
            metrics,
            generatedAt: new Date(),
        };

        this.maps.set(map.id, map);
        this.emit('map:generated', map);
        return map;
    }

    private parseFileNodes(path: string, content: string, fileIndex: number): MapNode[] {
        const nodes: MapNode[] = [];
        const lines = content.split('\n');
        const baseY = fileIndex * 50;

        // File node
        nodes.push({
            id: `file_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            label: path.split('/').pop() || path,
            type: 'file',
            path,
            position: { x: 0, y: baseY, z: 0 },
            size: Math.log(lines.length + 1) * 5,
            color: this.colorScheme.file,
            metadata: {
                lines: lines.length,
                dependencies: 0,
                dependents: 0,
            },
        });

        let nodeCount = 0;

        // Parse functions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Functions
            const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (funcMatch) {
                nodes.push({
                    id: `func_${path}_${funcMatch[1]}`,
                    label: funcMatch[1],
                    type: 'function',
                    path: `${path}:${i + 1}`,
                    position: { x: (nodeCount % 5) * 30, y: baseY + Math.floor(nodeCount / 5) * 30, z: 10 },
                    size: 8,
                    color: this.colorScheme.function,
                    metadata: { lines: this.countFunctionLines(lines, i) },
                });
                nodeCount++;
            }

            // Classes
            const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
            if (classMatch) {
                nodes.push({
                    id: `class_${path}_${classMatch[1]}`,
                    label: classMatch[1],
                    type: 'class',
                    path: `${path}:${i + 1}`,
                    position: { x: (nodeCount % 5) * 30, y: baseY + Math.floor(nodeCount / 5) * 30, z: 20 },
                    size: 15,
                    color: this.colorScheme.class,
                    metadata: {},
                });
                nodeCount++;
            }

            // React Components
            const componentMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z]\w+)/);
            if (componentMatch && (content.includes('React') || content.includes('jsx'))) {
                if (!nodes.some(n => n.label === componentMatch[1])) {
                    nodes.push({
                        id: `component_${path}_${componentMatch[1]}`,
                        label: componentMatch[1],
                        type: 'component',
                        path: `${path}:${i + 1}`,
                        position: { x: (nodeCount % 5) * 30, y: baseY + Math.floor(nodeCount / 5) * 30, z: 15 },
                        size: 12,
                        color: this.colorScheme.component,
                        metadata: {},
                    });
                    nodeCount++;
                }
            }

            // Interfaces
            const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
            if (interfaceMatch) {
                nodes.push({
                    id: `interface_${path}_${interfaceMatch[1]}`,
                    label: interfaceMatch[1],
                    type: 'interface',
                    path: `${path}:${i + 1}`,
                    position: { x: (nodeCount % 5) * 30, y: baseY + Math.floor(nodeCount / 5) * 30, z: 5 },
                    size: 6,
                    color: this.colorScheme.interface,
                    metadata: {},
                });
                nodeCount++;
            }
        }

        return nodes;
    }

    private countFunctionLines(lines: string[], startLine: number): number {
        let braceCount = 0;
        let started = false;

        for (let i = startLine; i < lines.length; i++) {
            for (const char of lines[i]) {
                if (char === '{') { braceCount++; started = true; }
                if (char === '}') braceCount--;
            }
            if (started && braceCount === 0) return i - startLine + 1;
        }
        return 1;
    }

    private detectRelationships(path: string, content: string, nodeIndex: Map<string, MapNode>): MapEdge[] {
        const edges: MapEdge[] = [];
        const fileNodeId = `file_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;

        // Detect imports
        const importMatches = content.matchAll(/import\s+.*from\s+['"]([^'"]+)['"]/g);
        for (const match of importMatches) {
            const importPath = match[1];
            // Create edge to imported module
            edges.push({
                id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                source: fileNodeId,
                target: `file_${importPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
                type: 'imports',
                weight: 1,
            });
        }

        // Detect function calls
        for (const [id, node] of nodeIndex) {
            if (node.type === 'function' && !node.path.startsWith(path)) {
                if (content.includes(`${node.label}(`)) {
                    edges.push({
                        id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        source: fileNodeId,
                        target: id,
                        type: 'calls',
                        weight: 1,
                        animated: true,
                    });
                }
            }
        }

        // Detect extends/implements
        const extendsMatch = content.match(/extends\s+(\w+)/g);
        if (extendsMatch) {
            for (const ext of extendsMatch) {
                const className = ext.replace('extends ', '');
                for (const [id, node] of nodeIndex) {
                    if (node.label === className && node.type === 'class') {
                        edges.push({
                            id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            source: fileNodeId,
                            target: id,
                            type: 'extends',
                            weight: 2,
                        });
                    }
                }
            }
        }

        return edges;
    }

    private createClusters(nodes: MapNode[]): Cluster[] {
        const dirMap = new Map<string, string[]>();

        for (const node of nodes) {
            if (node.type === 'file') {
                const dir = node.path.split('/').slice(0, -1).join('/') || 'root';
                if (!dirMap.has(dir)) dirMap.set(dir, []);
                dirMap.get(dir)!.push(node.id);
            }
        }

        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c'];
        const clusters: Cluster[] = [];
        let colorIndex = 0;

        for (const [dir, nodeIds] of dirMap) {
            clusters.push({
                id: `cluster_${dir.replace(/[^a-zA-Z0-9]/g, '_')}`,
                name: dir.split('/').pop() || 'root',
                nodes: nodeIds,
                color: colors[colorIndex % colors.length],
                bounds: {
                    min: { x: -100, y: -100, z: 0 },
                    max: { x: 100, y: 100, z: 100 },
                },
            });
            colorIndex++;
        }

        return clusters;
    }

    private layoutNodes(nodes: MapNode[], edges: MapEdge[]): void {
        // Simple force-directed layout simulation
        const iterations = 50;
        const repulsion = 100;
        const attraction = 0.1;

        for (let iter = 0; iter < iterations; iter++) {
            // Repulsion between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[j].position.x - nodes[i].position.x;
                    const dy = nodes[j].position.y - nodes[i].position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                    const force = repulsion / (dist * dist);

                    nodes[i].position.x -= (dx / dist) * force;
                    nodes[i].position.y -= (dy / dist) * force;
                    nodes[j].position.x += (dx / dist) * force;
                    nodes[j].position.y += (dy / dist) * force;
                }
            }

            // Attraction along edges
            for (const edge of edges) {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (source && target) {
                    const dx = target.position.x - source.position.x;
                    const dy = target.position.y - source.position.y;

                    source.position.x += dx * attraction;
                    source.position.y += dy * attraction;
                    target.position.x -= dx * attraction;
                    target.position.y -= dy * attraction;
                }
            }
        }
    }

    private calculateMetrics(nodes: MapNode[], edges: MapEdge[]): MapMetrics {
        const connectivity = new Map<string, number>();
        for (const edge of edges) {
            connectivity.set(edge.source, (connectivity.get(edge.source) || 0) + 1);
            connectivity.set(edge.target, (connectivity.get(edge.target) || 0) + 1);
        }

        const sorted = Array.from(connectivity.entries()).sort((a, b) => b[1] - a[1]);
        const hotspots = sorted.slice(0, 5).map(([id]) => id);

        const avgConnectivity = nodes.length > 0
            ? Array.from(connectivity.values()).reduce((a, b) => a + b, 0) / nodes.length
            : 0;

        return {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            maxDepth: Math.max(...nodes.map(n => n.position.z)),
            avgConnectivity,
            hotspots,
        };
    }

    private findCommonRoot(paths: string[]): string {
        if (paths.length === 0) return '';
        const parts = paths[0].split('/');
        let common = '';

        for (let i = 0; i < parts.length; i++) {
            const prefix = parts.slice(0, i + 1).join('/');
            if (paths.every(p => p.startsWith(prefix))) {
                common = prefix;
            } else break;
        }

        return common;
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    findPath(mapId: string, from: string, to: string): NavigationPath | undefined {
        const map = this.maps.get(mapId);
        if (!map) return undefined;

        // BFS to find shortest path
        const visited = new Set<string>();
        const queue: { node: string; path: string[]; edges: string[] }[] = [
            { node: from, path: [from], edges: [] }
        ];

        while (queue.length > 0) {
            const { node, path, edges } = queue.shift()!;

            if (node === to) {
                return { from, to, nodes: path, edges, distance: path.length - 1 };
            }

            if (visited.has(node)) continue;
            visited.add(node);

            for (const edge of map.edges) {
                let nextNode: string | null = null;
                if (edge.source === node) nextNode = edge.target;
                if (edge.target === node) nextNode = edge.source;

                if (nextNode && !visited.has(nextNode)) {
                    queue.push({
                        node: nextNode,
                        path: [...path, nextNode],
                        edges: [...edges, edge.id],
                    });
                }
            }
        }

        return undefined;
    }

    highlightFlow(mapId: string, startNode: string): string[] {
        const map = this.maps.get(mapId);
        if (!map) return [];

        const highlighted: string[] = [startNode];
        const visited = new Set<string>([startNode]);
        const queue = [startNode];

        while (queue.length > 0) {
            const current = queue.shift()!;

            for (const edge of map.edges) {
                if (edge.source === current && !visited.has(edge.target)) {
                    visited.add(edge.target);
                    highlighted.push(edge.target);
                    queue.push(edge.target);
                }
            }
        }

        return highlighted;
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getMap(id: string): CodeMap | undefined {
        return this.maps.get(id);
    }

    getAllMaps(): CodeMap[] {
        return Array.from(this.maps.values());
    }

    exportToMermaid(mapId: string): string | undefined {
        const map = this.maps.get(mapId);
        if (!map) return undefined;

        let mermaid = 'graph TD\n';

        for (const node of map.nodes.slice(0, 30)) {
            const shape = node.type === 'class' ? '[[' : node.type === 'function' ? '((' : '[';
            const closeShape = node.type === 'class' ? ']]' : node.type === 'function' ? '))' : ']';
            mermaid += `    ${node.id.slice(0, 20)}${shape}${node.label}${closeShape}\n`;
        }

        for (const edge of map.edges.slice(0, 50)) {
            const arrow = edge.type === 'extends' ? '--|>' : edge.type === 'calls' ? '-.->' : '-->';
            mermaid += `    ${edge.source.slice(0, 20)} ${arrow} ${edge.target.slice(0, 20)}\n`;
        }

        return mermaid;
    }

    getStats(): { totalMaps: number; totalNodes: number; totalEdges: number } {
        const maps = Array.from(this.maps.values());
        return {
            totalMaps: maps.length,
            totalNodes: maps.reduce((s, m) => s + m.nodes.length, 0),
            totalEdges: maps.reduce((s, m) => s + m.edges.length, 0),
        };
    }
}

export const visualCodeMapper = VisualCodeMapper.getInstance();
