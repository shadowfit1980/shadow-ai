/**
 * Code Mindmap Generator
 * Visual mind mapping of codebase structure and relationships
 * Grok Recommendation: Code Mindmapping
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface MindmapNode {
    id: string;
    label: string;
    type: 'root' | 'module' | 'class' | 'function' | 'variable' | 'concept' | 'note' | 'link';
    shape: 'ellipse' | 'rectangle' | 'diamond' | 'cloud' | 'hexagon' | 'star';
    color: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    children: string[];
    parent?: string;
    metadata: Record<string, unknown>;
    collapsed: boolean;
    notes?: string;
}

interface MindmapEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    style: 'solid' | 'dashed' | 'dotted' | 'curved';
    color: string;
    thickness: number;
}

interface Mindmap {
    id: string;
    name: string;
    description: string;
    rootNode: string;
    nodes: Map<string, MindmapNode>;
    edges: Map<string, MindmapEdge>;
    theme: MindmapTheme;
    createdAt: Date;
    updatedAt: Date;
}

interface MindmapTheme {
    name: string;
    background: string;
    nodeColors: { [key in MindmapNode['type']]: string };
    edgeColor: string;
    fontFamily: string;
    fontSize: number;
}

interface LayoutAlgorithm {
    name: 'radial' | 'tree' | 'force' | 'hierarchical' | 'organic';
    parameters: Record<string, number>;
}

interface ExportFormat {
    type: 'svg' | 'png' | 'json' | 'markdown' | 'html' | 'mermaid';
    options?: Record<string, unknown>;
}

const DEFAULT_THEMES: MindmapTheme[] = [
    {
        name: 'Modern',
        background: '#1a1a2e',
        nodeColors: { root: '#e94560', module: '#0f3460', class: '#16213e', function: '#533483', variable: '#4a47a3', concept: '#009688', note: '#f9a825', link: '#03a9f4' },
        edgeColor: '#4a4a6a',
        fontFamily: 'Inter, sans-serif',
        fontSize: 14
    },
    {
        name: 'Nature',
        background: '#1b4332',
        nodeColors: { root: '#d4a373', module: '#264653', class: '#2a9d8f', function: '#e9c46a', variable: '#f4a261', concept: '#e76f51', note: '#606c38', link: '#8ecae6' },
        edgeColor: '#40916c',
        fontFamily: 'Nunito, sans-serif',
        fontSize: 14
    },
    {
        name: 'Light',
        background: '#ffffff',
        nodeColors: { root: '#1976d2', module: '#43a047', class: '#8e24aa', function: '#f57c00', variable: '#00897b', concept: '#5c6bc0', note: '#fdd835', link: '#26c6da' },
        edgeColor: '#bdbdbd',
        fontFamily: 'Roboto, sans-serif',
        fontSize: 14
    }
];

export class CodeMindmapGenerator extends EventEmitter {
    private static instance: CodeMindmapGenerator;
    private mindmaps: Map<string, Mindmap> = new Map();
    private themes: Map<string, MindmapTheme> = new Map();

    private constructor() {
        super();
        DEFAULT_THEMES.forEach(t => this.themes.set(t.name, t));
    }

    static getInstance(): CodeMindmapGenerator {
        if (!CodeMindmapGenerator.instance) {
            CodeMindmapGenerator.instance = new CodeMindmapGenerator();
        }
        return CodeMindmapGenerator.instance;
    }

    createMindmap(name: string, description: string = '', themeName: string = 'Modern'): Mindmap {
        const rootNode: MindmapNode = {
            id: crypto.randomUUID(),
            label: name,
            type: 'root',
            shape: 'ellipse',
            color: this.themes.get(themeName)?.nodeColors.root || '#e94560',
            position: { x: 0, y: 0 },
            size: { width: 150, height: 60 },
            children: [],
            collapsed: false,
            metadata: {}
        };

        const mindmap: Mindmap = {
            id: crypto.randomUUID(),
            name,
            description,
            rootNode: rootNode.id,
            nodes: new Map([[rootNode.id, rootNode]]),
            edges: new Map(),
            theme: this.themes.get(themeName) || DEFAULT_THEMES[0],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.mindmaps.set(mindmap.id, mindmap);
        this.emit('mindmapCreated', mindmap);
        return mindmap;
    }

    addNode(mindmapId: string, parentId: string, config: {
        label: string;
        type?: MindmapNode['type'];
        notes?: string;
        metadata?: Record<string, unknown>;
    }): MindmapNode | null {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return null;

        const parent = mindmap.nodes.get(parentId);
        if (!parent) return null;

        const childCount = parent.children.length;
        const angle = (childCount * (2 * Math.PI / 8)) - Math.PI / 2;
        const distance = 200;

        const node: MindmapNode = {
            id: crypto.randomUUID(),
            label: config.label,
            type: config.type || 'concept',
            shape: this.getShapeForType(config.type || 'concept'),
            color: mindmap.theme.nodeColors[config.type || 'concept'],
            position: {
                x: parent.position.x + Math.cos(angle) * distance,
                y: parent.position.y + Math.sin(angle) * distance
            },
            size: { width: 120, height: 40 },
            children: [],
            parent: parentId,
            metadata: config.metadata || {},
            collapsed: false,
            notes: config.notes
        };

        mindmap.nodes.set(node.id, node);
        parent.children.push(node.id);

        // Create edge
        const edge: MindmapEdge = {
            id: crypto.randomUUID(),
            source: parentId,
            target: node.id,
            style: 'curved',
            color: mindmap.theme.edgeColor,
            thickness: 2
        };
        mindmap.edges.set(edge.id, edge);

        mindmap.updatedAt = new Date();
        this.emit('nodeAdded', { mindmapId, node });
        return node;
    }

    private getShapeForType(type: MindmapNode['type']): MindmapNode['shape'] {
        const shapes: Record<MindmapNode['type'], MindmapNode['shape']> = {
            root: 'ellipse',
            module: 'rectangle',
            class: 'hexagon',
            function: 'rectangle',
            variable: 'diamond',
            concept: 'cloud',
            note: 'rectangle',
            link: 'ellipse'
        };
        return shapes[type];
    }

    generateFromCode(mindmapId: string, code: string, language: string = 'typescript'): number {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return 0;

        let nodesAdded = 0;
        const rootId = mindmap.rootNode;

        // Parse and extract structure based on language
        const patterns = {
            classPattern: /class\s+(\w+)/g,
            functionPattern: /(?:function|const|let)\s+(\w+)\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>|[\(:])/g,
            interfacePattern: /interface\s+(\w+)/g,
            typePattern: /type\s+(\w+)\s*=/g,
            importPattern: /import\s+(?:{([^}]+)}|(\w+))\s+from/g,
            exportPattern: /export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/g
        };

        // Extract classes
        let match;
        const classIds: Map<string, string> = new Map();

        while ((match = patterns.classPattern.exec(code)) !== null) {
            const node = this.addNode(mindmapId, rootId, {
                label: match[1],
                type: 'class',
                metadata: { kind: 'class' }
            });
            if (node) {
                classIds.set(match[1], node.id);
                nodesAdded++;
            }
        }

        // Extract functions
        while ((match = patterns.functionPattern.exec(code)) !== null) {
            const funcName = match[1];
            if (!classIds.has(funcName)) { // Skip class names
                const node = this.addNode(mindmapId, rootId, {
                    label: funcName,
                    type: 'function',
                    metadata: { kind: 'function' }
                });
                if (node) nodesAdded++;
            }
        }

        // Extract interfaces
        while ((match = patterns.interfacePattern.exec(code)) !== null) {
            const node = this.addNode(mindmapId, rootId, {
                label: match[1],
                type: 'concept',
                metadata: { kind: 'interface' }
            });
            if (node) nodesAdded++;
        }

        // Extract types
        while ((match = patterns.typePattern.exec(code)) !== null) {
            const node = this.addNode(mindmapId, rootId, {
                label: match[1],
                type: 'variable',
                metadata: { kind: 'type' }
            });
            if (node) nodesAdded++;
        }

        this.applyLayout(mindmapId, 'radial');
        return nodesAdded;
    }

    applyLayout(mindmapId: string, algorithm: LayoutAlgorithm['name']): void {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return;

        const root = mindmap.nodes.get(mindmap.rootNode);
        if (!root) return;

        switch (algorithm) {
            case 'radial':
                this.applyRadialLayout(mindmap, root);
                break;
            case 'tree':
                this.applyTreeLayout(mindmap, root);
                break;
            case 'hierarchical':
                this.applyHierarchicalLayout(mindmap, root);
                break;
            default:
                this.applyRadialLayout(mindmap, root);
        }

        this.emit('layoutApplied', { mindmapId, algorithm });
    }

    private applyRadialLayout(mindmap: Mindmap, root: MindmapNode): void {
        root.position = { x: 0, y: 0 };
        this.layoutChildren(mindmap, root.id, 0, 0, 200, 0, 2 * Math.PI);
    }

    private layoutChildren(
        mindmap: Mindmap,
        nodeId: string,
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        endAngle: number
    ): void {
        const node = mindmap.nodes.get(nodeId);
        if (!node || node.children.length === 0) return;

        const angleStep = (endAngle - startAngle) / node.children.length;

        node.children.forEach((childId, index) => {
            const child = mindmap.nodes.get(childId);
            if (!child) return;

            const angle = startAngle + angleStep * (index + 0.5);
            child.position = {
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius
            };

            this.layoutChildren(
                mindmap,
                childId,
                child.position.x,
                child.position.y,
                radius * 0.7,
                angle - angleStep / 2,
                angle + angleStep / 2
            );
        });
    }

    private applyTreeLayout(mindmap: Mindmap, root: MindmapNode): void {
        root.position = { x: 0, y: -300 };
        this.layoutTreeLevel(mindmap, [root.id], 0, 100);
    }

    private layoutTreeLevel(mindmap: Mindmap, nodeIds: string[], y: number, spacing: number): void {
        const nextLevel: string[] = [];
        const totalWidth = nodeIds.length * spacing;
        const startX = -totalWidth / 2;

        nodeIds.forEach((nodeId, index) => {
            const node = mindmap.nodes.get(nodeId);
            if (!node) return;

            node.position = { x: startX + index * spacing, y };
            nextLevel.push(...node.children);
        });

        if (nextLevel.length > 0) {
            this.layoutTreeLevel(mindmap, nextLevel, y + 120, spacing * 0.8);
        }
    }

    private applyHierarchicalLayout(mindmap: Mindmap, root: MindmapNode): void {
        // Similar to tree but with horizontal layout
        root.position = { x: -400, y: 0 };
        this.layoutHierarchyLevel(mindmap, [root.id], -200, 80);
    }

    private layoutHierarchyLevel(mindmap: Mindmap, nodeIds: string[], x: number, spacing: number): void {
        const nextLevel: string[] = [];
        const totalHeight = nodeIds.length * spacing;
        const startY = -totalHeight / 2;

        nodeIds.forEach((nodeId, index) => {
            const node = mindmap.nodes.get(nodeId);
            if (!node) return;

            node.position = { x, y: startY + index * spacing };
            nextLevel.push(...node.children);
        });

        if (nextLevel.length > 0) {
            this.layoutHierarchyLevel(mindmap, nextLevel, x + 180, spacing * 0.8);
        }
    }

    toggleCollapse(mindmapId: string, nodeId: string): boolean {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return false;

        const node = mindmap.nodes.get(nodeId);
        if (!node) return false;

        node.collapsed = !node.collapsed;
        this.emit('nodeToggled', { mindmapId, nodeId, collapsed: node.collapsed });
        return node.collapsed;
    }

    updateNode(mindmapId: string, nodeId: string, updates: Partial<MindmapNode>): boolean {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return false;

        const node = mindmap.nodes.get(nodeId);
        if (!node) return false;

        Object.assign(node, updates);
        mindmap.updatedAt = new Date();
        this.emit('nodeUpdated', { mindmapId, node });
        return true;
    }

    deleteNode(mindmapId: string, nodeId: string): boolean {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap || nodeId === mindmap.rootNode) return false;

        const node = mindmap.nodes.get(nodeId);
        if (!node) return false;

        // Remove from parent
        if (node.parent) {
            const parent = mindmap.nodes.get(node.parent);
            if (parent) {
                parent.children = parent.children.filter(id => id !== nodeId);
            }
        }

        // Delete children recursively
        const deleteRecursive = (id: string) => {
            const n = mindmap.nodes.get(id);
            if (n) {
                n.children.forEach(deleteRecursive);
                mindmap.nodes.delete(id);
            }
        };
        deleteRecursive(nodeId);

        // Delete related edges
        for (const [edgeId, edge] of mindmap.edges) {
            if (edge.source === nodeId || edge.target === nodeId) {
                mindmap.edges.delete(edgeId);
            }
        }

        mindmap.updatedAt = new Date();
        return true;
    }

    export(mindmapId: string, format: ExportFormat): string {
        const mindmap = this.mindmaps.get(mindmapId);
        if (!mindmap) return '';

        switch (format.type) {
            case 'json':
                return JSON.stringify({
                    ...mindmap,
                    nodes: Array.from(mindmap.nodes.values()),
                    edges: Array.from(mindmap.edges.values())
                }, null, 2);

            case 'mermaid':
                return this.exportToMermaid(mindmap);

            case 'markdown':
                return this.exportToMarkdown(mindmap);

            default:
                return this.exportToMermaid(mindmap);
        }
    }

    private exportToMermaid(mindmap: Mindmap): string {
        const lines: string[] = ['mindmap'];

        const addNode = (nodeId: string, indent: number) => {
            const node = mindmap.nodes.get(nodeId);
            if (!node) return;

            const prefix = '  '.repeat(indent);
            const shape = node.type === 'root' ? 'root' : '';
            lines.push(`${prefix}${shape}(${node.label})`);

            node.children.forEach(childId => addNode(childId, indent + 1));
        };

        addNode(mindmap.rootNode, 1);
        return lines.join('\n');
    }

    private exportToMarkdown(mindmap: Mindmap): string {
        const lines: string[] = [`# ${mindmap.name}`, '', mindmap.description, ''];

        const addNode = (nodeId: string, level: number) => {
            const node = mindmap.nodes.get(nodeId);
            if (!node) return;

            const indent = '  '.repeat(level);
            const bullet = level === 0 ? '##' : '-';
            lines.push(`${indent}${bullet} ${node.label}`);

            if (node.notes) {
                lines.push(`${indent}  > ${node.notes}`);
            }

            node.children.forEach(childId => addNode(childId, level + 1));
        };

        addNode(mindmap.rootNode, 0);
        return lines.join('\n');
    }

    getMindmap(id: string): Mindmap | undefined {
        return this.mindmaps.get(id);
    }

    getMindmaps(): Mindmap[] {
        return Array.from(this.mindmaps.values());
    }

    getThemes(): MindmapTheme[] {
        return Array.from(this.themes.values());
    }

    setTheme(mindmapId: string, themeName: string): boolean {
        const mindmap = this.mindmaps.get(mindmapId);
        const theme = this.themes.get(themeName);

        if (!mindmap || !theme) return false;

        mindmap.theme = theme;

        // Update node colors
        for (const node of mindmap.nodes.values()) {
            node.color = theme.nodeColors[node.type];
        }

        // Update edge colors
        for (const edge of mindmap.edges.values()) {
            edge.color = theme.edgeColor;
        }

        this.emit('themeChanged', { mindmapId, theme });
        return true;
    }

    deleteMindmap(id: string): boolean {
        return this.mindmaps.delete(id);
    }
}

export const codeMindmapGenerator = CodeMindmapGenerator.getInstance();
