/**
 * Dependency Graph Visualizer
 * 
 * Analyze and visualize project dependencies,
 * import graphs, and module relationships.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface DependencyNode {
    id: string;
    name: string;
    type: 'module' | 'package' | 'file' | 'class' | 'function';
    path?: string;
    version?: string;
    size?: number;
    metadata?: Record<string, any>;
}

export interface DependencyEdge {
    source: string;
    target: string;
    type: 'import' | 'export' | 'extends' | 'implements' | 'uses' | 'dependency';
    weight?: number;
}

export interface DependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    metadata: {
        totalNodes: number;
        totalEdges: number;
        circularDeps: string[][];
        orphans: string[];
    };
}

export interface AnalysisResult {
    graph: DependencyGraph;
    metrics: GraphMetrics;
    issues: DependencyIssue[];
}

export interface GraphMetrics {
    density: number;
    avgDegree: number;
    maxDepth: number;
    modularity: number;
    clusters: string[][];
}

export interface DependencyIssue {
    type: 'circular' | 'unused' | 'outdated' | 'duplicate' | 'deep';
    severity: 'error' | 'warning' | 'info';
    nodes: string[];
    message: string;
    suggestion?: string;
}

// ============================================================================
// DEPENDENCY GRAPH VISUALIZER
// ============================================================================

export class DependencyGraphVisualizer extends EventEmitter {
    private static instance: DependencyGraphVisualizer;
    private graphs: Map<string, DependencyGraph> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): DependencyGraphVisualizer {
        if (!DependencyGraphVisualizer.instance) {
            DependencyGraphVisualizer.instance = new DependencyGraphVisualizer();
        }
        return DependencyGraphVisualizer.instance;
    }

    // ========================================================================
    // IMPORT ANALYSIS
    // ========================================================================

    async analyzeImports(rootDir: string, options?: {
        extensions?: string[];
        exclude?: string[];
    }): Promise<DependencyGraph> {
        const nodes: Map<string, DependencyNode> = new Map();
        const edges: DependencyEdge[] = [];
        const extensions = options?.extensions || ['.ts', '.tsx', '.js', '.jsx'];
        const exclude = options?.exclude || ['node_modules', '.git', 'dist', 'build'];

        const files = await this.getFiles(rootDir, extensions, exclude);

        for (const file of files) {
            const relativePath = path.relative(rootDir, file);
            const nodeId = this.normalizeId(relativePath);

            nodes.set(nodeId, {
                id: nodeId,
                name: path.basename(file, path.extname(file)),
                type: 'file',
                path: file,
            });

            const imports = await this.extractImports(file);

            for (const imp of imports) {
                const targetId = this.resolveImport(imp, file, rootDir);

                edges.push({
                    source: nodeId,
                    target: targetId,
                    type: 'import',
                });

                // Add external packages as nodes
                if (imp.startsWith('.') === false && !nodes.has(targetId)) {
                    nodes.set(targetId, {
                        id: targetId,
                        name: imp.split('/')[0],
                        type: 'package',
                    });
                }
            }
        }

        const circularDeps = this.detectCircularDependencies(Array.from(nodes.values()), edges);
        const orphans = this.findOrphans(Array.from(nodes.values()), edges);

        const graph: DependencyGraph = {
            nodes: Array.from(nodes.values()),
            edges,
            metadata: {
                totalNodes: nodes.size,
                totalEdges: edges.length,
                circularDeps,
                orphans,
            },
        };

        this.graphs.set(rootDir, graph);
        this.emit('graphAnalyzed', graph);
        return graph;
    }

    private async getFiles(dir: string, extensions: string[], exclude: string[]): Promise<string[]> {
        const files: string[] = [];

        const processDir = async (currentDir: string) => {
            let entries: string[];
            try {
                entries = fs.readdirSync(currentDir);
            } catch {
                return;
            }

            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry);

                if (exclude.some(e => entry === e || fullPath.includes(e))) {
                    continue;
                }

                let stat;
                try {
                    stat = fs.statSync(fullPath);
                } catch {
                    continue;
                }

                if (stat.isDirectory()) {
                    await processDir(fullPath);
                } else if (extensions.includes(path.extname(entry))) {
                    files.push(fullPath);
                }
            }
        };

        await processDir(dir);
        return files;
    }

    private async extractImports(filePath: string): Promise<string[]> {
        const imports: string[] = [];

        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch {
            return imports;
        }

        // ES6 imports
        const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        // require statements
        const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        // Dynamic imports
        const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamicRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    private resolveImport(importPath: string, fromFile: string, rootDir: string): string {
        if (!importPath.startsWith('.')) {
            // External package
            return importPath.split('/')[0];
        }

        // Relative import
        const resolved = path.resolve(path.dirname(fromFile), importPath);
        const relative = path.relative(rootDir, resolved);
        return this.normalizeId(relative);
    }

    private normalizeId(p: string): string {
        return p.replace(/\\/g, '/').replace(/\.[jt]sx?$/, '');
    }

    // ========================================================================
    // PACKAGE.JSON ANALYSIS
    // ========================================================================

    async analyzePackageJson(packageJsonPath: string): Promise<DependencyGraph> {
        const content = fs.readFileSync(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(content);

        const nodes: DependencyNode[] = [{
            id: pkg.name,
            name: pkg.name,
            type: 'package',
            version: pkg.version,
        }];

        const edges: DependencyEdge[] = [];

        // Add dependencies
        for (const [name, version] of Object.entries(pkg.dependencies || {})) {
            nodes.push({
                id: name,
                name,
                type: 'package',
                version: version as string,
            });
            edges.push({
                source: pkg.name,
                target: name,
                type: 'dependency',
            });
        }

        // Add devDependencies
        for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
            if (!nodes.find(n => n.id === name)) {
                nodes.push({
                    id: name,
                    name,
                    type: 'package',
                    version: version as string,
                    metadata: { dev: true },
                });
            }
            edges.push({
                source: pkg.name,
                target: name,
                type: 'dependency',
            });
        }

        return {
            nodes,
            edges,
            metadata: {
                totalNodes: nodes.length,
                totalEdges: edges.length,
                circularDeps: [],
                orphans: [],
            },
        };
    }

    // ========================================================================
    // CIRCULAR DEPENDENCY DETECTION
    // ========================================================================

    private detectCircularDependencies(nodes: DependencyNode[], edges: DependencyEdge[]): string[][] {
        const cycles: string[][] = [];
        const adjacency = new Map<string, string[]>();

        for (const edge of edges) {
            if (!adjacency.has(edge.source)) {
                adjacency.set(edge.source, []);
            }
            adjacency.get(edge.source)!.push(edge.target);
        }

        const visited = new Set<string>();
        const recursionStack = new Set<string>();

        const dfs = (node: string, path: string[]): void => {
            visited.add(node);
            recursionStack.add(node);

            const neighbors = adjacency.get(node) || [];
            for (const neighbor of neighbors) {
                if (recursionStack.has(neighbor)) {
                    // Found cycle
                    const cycleStart = path.indexOf(neighbor);
                    cycles.push([...path.slice(cycleStart), neighbor]);
                } else if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path, node]);
                }
            }

            recursionStack.delete(node);
        };

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                dfs(node.id, []);
            }
        }

        return cycles;
    }

    private findOrphans(nodes: DependencyNode[], edges: DependencyEdge[]): string[] {
        const referenced = new Set<string>();
        const sources = new Set<string>();

        for (const edge of edges) {
            referenced.add(edge.target);
            sources.add(edge.source);
        }

        return nodes
            .filter(n => !referenced.has(n.id) && !sources.has(n.id))
            .map(n => n.id);
    }

    // ========================================================================
    // VISUALIZATION
    // ========================================================================

    generateMermaidDiagram(graph: DependencyGraph, options?: {
        maxNodes?: number;
        direction?: 'TB' | 'LR' | 'BT' | 'RL';
    }): string {
        const direction = options?.direction || 'TB';
        const maxNodes = options?.maxNodes || 50;

        let diagram = `graph ${direction}\n`;

        // Limit nodes for readability
        const nodesToShow = graph.nodes.slice(0, maxNodes);
        const nodeIds = new Set(nodesToShow.map(n => n.id));

        for (const node of nodesToShow) {
            const shape = node.type === 'package' ? `[${node.name}]` : `(${node.name})`;
            diagram += `  ${this.sanitizeId(node.id)}${shape}\n`;
        }

        for (const edge of graph.edges) {
            if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
                diagram += `  ${this.sanitizeId(edge.source)} --> ${this.sanitizeId(edge.target)}\n`;
            }
        }

        return diagram;
    }

    generateD3Data(graph: DependencyGraph): { nodes: any[]; links: any[] } {
        return {
            nodes: graph.nodes.map((n, i) => ({
                id: n.id,
                name: n.name,
                type: n.type,
                group: n.type === 'package' ? 1 : 2,
            })),
            links: graph.edges.map(e => ({
                source: e.source,
                target: e.target,
                value: e.weight || 1,
            })),
        };
    }

    generateReactFlowData(graph: DependencyGraph): { nodes: any[]; edges: any[] } {
        const positions = this.calculatePositions(graph);

        return {
            nodes: graph.nodes.map(n => ({
                id: n.id,
                data: { label: n.name },
                position: positions.get(n.id) || { x: 0, y: 0 },
                type: n.type === 'package' ? 'input' : 'default',
                style: {
                    background: n.type === 'package' ? '#6366f1' : '#10b981',
                    color: 'white',
                    padding: 10,
                    borderRadius: 5,
                },
            })),
            edges: graph.edges.map((e, i) => ({
                id: `e${i}`,
                source: e.source,
                target: e.target,
                animated: e.type === 'import',
            })),
        };
    }

    private calculatePositions(graph: DependencyGraph): Map<string, { x: number; y: number }> {
        const positions = new Map<string, { x: number; y: number }>();
        const levels = this.calculateLevels(graph);

        const nodesByLevel = new Map<number, string[]>();
        for (const [nodeId, level] of levels) {
            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level)!.push(nodeId);
        }

        const xSpacing = 200;
        const ySpacing = 100;

        for (const [level, nodes] of nodesByLevel) {
            const startX = -(nodes.length - 1) * xSpacing / 2;
            nodes.forEach((nodeId, i) => {
                positions.set(nodeId, {
                    x: startX + i * xSpacing,
                    y: level * ySpacing,
                });
            });
        }

        return positions;
    }

    private calculateLevels(graph: DependencyGraph): Map<string, number> {
        const levels = new Map<string, number>();
        const inDegree = new Map<string, number>();
        const adjacency = new Map<string, string[]>();

        for (const node of graph.nodes) {
            inDegree.set(node.id, 0);
            adjacency.set(node.id, []);
        }

        for (const edge of graph.edges) {
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
            adjacency.get(edge.source)?.push(edge.target);
        }

        // BFS for levels
        const queue = graph.nodes.filter(n => inDegree.get(n.id) === 0).map(n => n.id);
        queue.forEach(id => levels.set(id, 0));

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentLevel = levels.get(current) || 0;

            for (const neighbor of adjacency.get(current) || []) {
                if (!levels.has(neighbor)) {
                    levels.set(neighbor, currentLevel + 1);
                    queue.push(neighbor);
                }
            }
        }

        // Handle any not visited
        for (const node of graph.nodes) {
            if (!levels.has(node.id)) {
                levels.set(node.id, 0);
            }
        }

        return levels;
    }

    private sanitizeId(id: string): string {
        return id.replace(/[^a-zA-Z0-9]/g, '_');
    }

    // ========================================================================
    // REPORTS
    // ========================================================================

    generateReport(graph: DependencyGraph): string {
        const issues = this.detectIssues(graph);

        return `# Dependency Analysis Report

## Overview
- **Total Modules**: ${graph.metadata.totalNodes}
- **Total Dependencies**: ${graph.metadata.totalEdges}
- **Circular Dependencies**: ${graph.metadata.circularDeps.length}
- **Orphan Modules**: ${graph.metadata.orphans.length}

## Issues Found

${issues.map(issue => `### ${issue.severity.toUpperCase()}: ${issue.type}
${issue.message}
${issue.suggestion ? `\n**Suggestion**: ${issue.suggestion}` : ''}
`).join('\n')}

## Circular Dependencies
${graph.metadata.circularDeps.length > 0
                ? graph.metadata.circularDeps.map(cycle => `- ${cycle.join(' → ')}`).join('\n')
                : 'No circular dependencies detected.'}

## Orphan Modules
${graph.metadata.orphans.length > 0
                ? graph.metadata.orphans.map(o => `- ${o}`).join('\n')
                : 'No orphan modules detected.'}
`;
    }

    private detectIssues(graph: DependencyGraph): DependencyIssue[] {
        const issues: DependencyIssue[] = [];

        // Circular dependencies
        for (const cycle of graph.metadata.circularDeps) {
            issues.push({
                type: 'circular',
                severity: 'error',
                nodes: cycle,
                message: `Circular dependency detected: ${cycle.join(' → ')}`,
                suggestion: 'Consider extracting shared code into a separate module.',
            });
        }

        // Orphan modules
        for (const orphan of graph.metadata.orphans) {
            issues.push({
                type: 'unused',
                severity: 'warning',
                nodes: [orphan],
                message: `Module "${orphan}" is not imported anywhere.`,
                suggestion: 'Remove this module or add imports if needed.',
            });
        }

        // Deep dependency chains
        const depths = this.calculateDepths(graph);
        const deepNodes = Array.from(depths.entries())
            .filter(([_, depth]) => depth > 10)
            .map(([node]) => node);

        if (deepNodes.length > 0) {
            issues.push({
                type: 'deep',
                severity: 'warning',
                nodes: deepNodes,
                message: `${deepNodes.length} modules have deep dependency chains (>10 levels).`,
                suggestion: 'Consider flattening the module hierarchy.',
            });
        }

        return issues;
    }

    private calculateDepths(graph: DependencyGraph): Map<string, number> {
        const depths = new Map<string, number>();
        const adjacency = new Map<string, string[]>();

        for (const node of graph.nodes) {
            adjacency.set(node.id, []);
        }
        for (const edge of graph.edges) {
            adjacency.get(edge.source)?.push(edge.target);
        }

        const calculateDepth = (nodeId: string, visited: Set<string>): number => {
            if (visited.has(nodeId)) return 0;
            visited.add(nodeId);

            const neighbors = adjacency.get(nodeId) || [];
            if (neighbors.length === 0) return 0;

            const maxChildDepth = Math.max(...neighbors.map(n => calculateDepth(n, new Set(visited))));
            return 1 + maxChildDepth;
        };

        for (const node of graph.nodes) {
            depths.set(node.id, calculateDepth(node.id, new Set()));
        }

        return depths;
    }
}

export const dependencyGraphVisualizer = DependencyGraphVisualizer.getInstance();
