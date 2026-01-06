/**
 * Infinite Canvas Workspace
 * 
 * Zoomable, pannable workspace for visual mind-mapping and code organization.
 * Supports nodes, connections, and spatial arrangement of code artifacts.
 */

import { EventEmitter } from 'events';

export interface Canvas {
    id: string;
    name: string;
    nodes: CanvasNode[];
    connections: Connection[];
    viewport: Viewport;
    settings: CanvasSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface CanvasNode {
    id: string;
    type: NodeType;
    position: Position;
    size: Size;
    content: NodeContent;
    style: NodeStyle;
    locked: boolean;
    collapsed: boolean;
    children?: string[];
}

export type NodeType =
    | 'code'
    | 'markdown'
    | 'file'
    | 'image'
    | 'link'
    | 'group'
    | 'sticky'
    | 'shape'
    | 'embed';

export interface Position {
    x: number;
    y: number;
    z?: number; // For layering
}

export interface Size {
    width: number;
    height: number;
}

export interface NodeContent {
    text?: string;
    code?: { language: string; content: string };
    file?: { path: string; name: string };
    url?: string;
    imageUrl?: string;
    embedType?: 'iframe' | 'video' | 'audio';
}

export interface NodeStyle {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    shadowEnabled?: boolean;
    fontFamily?: string;
    fontSize?: number;
}

export interface Connection {
    id: string;
    from: string; // Node ID
    to: string;   // Node ID
    type: ConnectionType;
    label?: string;
    style: ConnectionStyle;
}

export type ConnectionType =
    | 'arrow'
    | 'line'
    | 'curved'
    | 'dashed'
    | 'dependency';

export interface ConnectionStyle {
    color: string;
    width: number;
    endArrow: boolean;
    startArrow: boolean;
    animated: boolean;
}

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
    minZoom: number;
    maxZoom: number;
}

export interface CanvasSettings {
    gridEnabled: boolean;
    gridSize: number;
    snapToGrid: boolean;
    darkMode: boolean;
    autoLayout: boolean;
    showMinimap: boolean;
}

export interface LayoutAlgorithm {
    name: string;
    apply: (nodes: CanvasNode[], connections: Connection[]) => CanvasNode[];
}

const DEFAULT_SETTINGS: CanvasSettings = {
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
    darkMode: true,
    autoLayout: false,
    showMinimap: true,
};

const DEFAULT_VIEWPORT: Viewport = {
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.1,
    maxZoom: 5,
};

export class InfiniteCanvasWorkspace extends EventEmitter {
    private static instance: InfiniteCanvasWorkspace;
    private canvases: Map<string, Canvas> = new Map();
    private activeCanvasId: string | null = null;
    private clipboard: CanvasNode[] = [];
    private undoStack: Map<string, Canvas[]> = new Map();
    private redoStack: Map<string, Canvas[]> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): InfiniteCanvasWorkspace {
        if (!InfiniteCanvasWorkspace.instance) {
            InfiniteCanvasWorkspace.instance = new InfiniteCanvasWorkspace();
        }
        return InfiniteCanvasWorkspace.instance;
    }

    // ========================================================================
    // CANVAS MANAGEMENT
    // ========================================================================

    createCanvas(name: string): Canvas {
        const canvas: Canvas = {
            id: `canvas_${Date.now()}`,
            name,
            nodes: [],
            connections: [],
            viewport: { ...DEFAULT_VIEWPORT },
            settings: { ...DEFAULT_SETTINGS },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.canvases.set(canvas.id, canvas);
        this.undoStack.set(canvas.id, []);
        this.redoStack.set(canvas.id, []);
        this.activeCanvasId = canvas.id;

        this.emit('canvas:created', canvas);
        return canvas;
    }

    getCanvas(id: string): Canvas | undefined {
        return this.canvases.get(id);
    }

    deleteCanvas(id: string): boolean {
        const deleted = this.canvases.delete(id);
        if (deleted && this.activeCanvasId === id) {
            this.activeCanvasId = null;
        }
        return deleted;
    }

    setActiveCanvas(id: string): void {
        if (this.canvases.has(id)) {
            this.activeCanvasId = id;
            this.emit('canvas:activated', id);
        }
    }

    // ========================================================================
    // NODE OPERATIONS
    // ========================================================================

    addNode(canvasId: string, node: Omit<CanvasNode, 'id'>): CanvasNode | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return undefined;

        this.saveState(canvasId);

        const newNode: CanvasNode = {
            ...node,
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // Snap to grid if enabled
        if (canvas.settings.snapToGrid) {
            newNode.position = this.snapToGrid(newNode.position, canvas.settings.gridSize);
        }

        canvas.nodes.push(newNode);
        canvas.updatedAt = new Date();

        this.emit('node:added', { canvasId, node: newNode });
        return newNode;
    }

    updateNode(canvasId: string, nodeId: string, updates: Partial<CanvasNode>): CanvasNode | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return undefined;

        const nodeIndex = canvas.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return undefined;

        this.saveState(canvasId);

        const updatedNode = { ...canvas.nodes[nodeIndex], ...updates };

        if (updates.position && canvas.settings.snapToGrid) {
            updatedNode.position = this.snapToGrid(updatedNode.position, canvas.settings.gridSize);
        }

        canvas.nodes[nodeIndex] = updatedNode;
        canvas.updatedAt = new Date();

        this.emit('node:updated', { canvasId, node: updatedNode });
        return updatedNode;
    }

    deleteNode(canvasId: string, nodeId: string): boolean {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return false;

        this.saveState(canvasId);

        const nodeIndex = canvas.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return false;

        canvas.nodes.splice(nodeIndex, 1);

        // Remove associated connections
        canvas.connections = canvas.connections.filter(
            c => c.from !== nodeId && c.to !== nodeId
        );

        canvas.updatedAt = new Date();
        this.emit('node:deleted', { canvasId, nodeId });
        return true;
    }

    // ========================================================================
    // CONNECTION OPERATIONS
    // ========================================================================

    addConnection(canvasId: string, from: string, to: string, type: ConnectionType = 'arrow'): Connection | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return undefined;

        // Verify both nodes exist
        if (!canvas.nodes.find(n => n.id === from) || !canvas.nodes.find(n => n.id === to)) {
            return undefined;
        }

        this.saveState(canvasId);

        const connection: Connection = {
            id: `conn_${Date.now()}`,
            from,
            to,
            type,
            style: {
                color: '#00d9ff',
                width: 2,
                endArrow: true,
                startArrow: false,
                animated: type === 'dependency',
            },
        };

        canvas.connections.push(connection);
        canvas.updatedAt = new Date();

        this.emit('connection:added', { canvasId, connection });
        return connection;
    }

    deleteConnection(canvasId: string, connectionId: string): boolean {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return false;

        this.saveState(canvasId);

        const index = canvas.connections.findIndex(c => c.id === connectionId);
        if (index === -1) return false;

        canvas.connections.splice(index, 1);
        canvas.updatedAt = new Date();

        return true;
    }

    // ========================================================================
    // VIEWPORT OPERATIONS
    // ========================================================================

    pan(canvasId: string, deltaX: number, deltaY: number): Viewport | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return undefined;

        canvas.viewport.x += deltaX;
        canvas.viewport.y += deltaY;

        this.emit('viewport:panned', { canvasId, viewport: canvas.viewport });
        return canvas.viewport;
    }

    zoom(canvasId: string, factor: number, centerX?: number, centerY?: number): Viewport | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return undefined;

        const newZoom = Math.max(
            canvas.viewport.minZoom,
            Math.min(canvas.viewport.maxZoom, canvas.viewport.zoom * factor)
        );

        // Zoom towards center point if provided
        if (centerX !== undefined && centerY !== undefined) {
            const zoomRatio = newZoom / canvas.viewport.zoom;
            canvas.viewport.x = centerX - (centerX - canvas.viewport.x) * zoomRatio;
            canvas.viewport.y = centerY - (centerY - canvas.viewport.y) * zoomRatio;
        }

        canvas.viewport.zoom = newZoom;

        this.emit('viewport:zoomed', { canvasId, viewport: canvas.viewport });
        return canvas.viewport;
    }

    fitToContent(canvasId: string): Viewport | undefined {
        const canvas = this.canvases.get(canvasId);
        if (!canvas || canvas.nodes.length === 0) return undefined;

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const node of canvas.nodes) {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.size.width);
            maxY = Math.max(maxY, node.position.y + node.size.height);
        }

        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        // Calculate zoom to fit
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const viewportWidth = 1920; // Assumed viewport size
        const viewportHeight = 1080;

        const zoom = Math.min(
            viewportWidth / contentWidth,
            viewportHeight / contentHeight,
            canvas.viewport.maxZoom
        );

        canvas.viewport.x = -minX * zoom;
        canvas.viewport.y = -minY * zoom;
        canvas.viewport.zoom = zoom;

        this.emit('viewport:fitted', { canvasId, viewport: canvas.viewport });
        return canvas.viewport;
    }

    // ========================================================================
    // LAYOUT ALGORITHMS
    // ========================================================================

    applyLayout(canvasId: string, algorithm: 'grid' | 'tree' | 'force' | 'radial'): void {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return;

        this.saveState(canvasId);

        switch (algorithm) {
            case 'grid':
                this.applyGridLayout(canvas);
                break;
            case 'tree':
                this.applyTreeLayout(canvas);
                break;
            case 'force':
                this.applyForceLayout(canvas);
                break;
            case 'radial':
                this.applyRadialLayout(canvas);
                break;
        }

        canvas.updatedAt = new Date();
        this.emit('layout:applied', { canvasId, algorithm });
    }

    private applyGridLayout(canvas: Canvas): void {
        const cols = Math.ceil(Math.sqrt(canvas.nodes.length));
        const spacing = 200;

        canvas.nodes.forEach((node, index) => {
            node.position = {
                x: (index % cols) * spacing,
                y: Math.floor(index / cols) * spacing,
            };
        });
    }

    private applyTreeLayout(canvas: Canvas): void {
        // Simple hierarchical layout based on connections
        const roots = canvas.nodes.filter(n =>
            !canvas.connections.some(c => c.to === n.id)
        );

        let y = 0;
        const levelHeight = 150;
        const nodeWidth = 180;

        const positionNode = (nodeId: string, x: number, level: number) => {
            const node = canvas.nodes.find(n => n.id === nodeId);
            if (!node) return;

            node.position = { x, y: level * levelHeight };

            const children = canvas.connections
                .filter(c => c.from === nodeId)
                .map(c => c.to);

            children.forEach((childId, i) => {
                positionNode(childId, x + (i - children.length / 2) * nodeWidth, level + 1);
            });
        };

        roots.forEach((root, i) => {
            positionNode(root.id, i * 400, 0);
        });
    }

    private applyForceLayout(canvas: Canvas): void {
        // Simple force-directed simulation
        const iterations = 50;
        const repulsion = 5000;
        const attraction = 0.1;

        for (let iter = 0; iter < iterations; iter++) {
            // Apply repulsion between all nodes
            for (let i = 0; i < canvas.nodes.length; i++) {
                for (let j = i + 1; j < canvas.nodes.length; j++) {
                    const dx = canvas.nodes[j].position.x - canvas.nodes[i].position.x;
                    const dy = canvas.nodes[j].position.y - canvas.nodes[i].position.y;
                    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    const force = repulsion / (dist * dist);

                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    canvas.nodes[i].position.x -= fx;
                    canvas.nodes[i].position.y -= fy;
                    canvas.nodes[j].position.x += fx;
                    canvas.nodes[j].position.y += fy;
                }
            }

            // Apply attraction for connected nodes
            for (const conn of canvas.connections) {
                const from = canvas.nodes.find(n => n.id === conn.from);
                const to = canvas.nodes.find(n => n.id === conn.to);
                if (!from || !to) continue;

                const dx = to.position.x - from.position.x;
                const dy = to.position.y - from.position.y;

                from.position.x += dx * attraction;
                from.position.y += dy * attraction;
                to.position.x -= dx * attraction;
                to.position.y -= dy * attraction;
            }
        }
    }

    private applyRadialLayout(canvas: Canvas): void {
        const centerX = 500;
        const centerY = 500;
        const radius = 300;

        canvas.nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / canvas.nodes.length;
            node.position = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            };
        });
    }

    // ========================================================================
    // CLIPBOARD & UNDO/REDO
    // ========================================================================

    copyNodes(canvasId: string, nodeIds: string[]): void {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return;

        this.clipboard = canvas.nodes
            .filter(n => nodeIds.includes(n.id))
            .map(n => ({ ...n }));
    }

    paste(canvasId: string, offset: Position = { x: 20, y: 20 }): CanvasNode[] {
        if (this.clipboard.length === 0) return [];

        const canvas = this.canvases.get(canvasId);
        if (!canvas) return [];

        this.saveState(canvasId);

        const newNodes: CanvasNode[] = this.clipboard.map(node => ({
            ...node,
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            position: {
                x: node.position.x + offset.x,
                y: node.position.y + offset.y,
            },
        }));

        canvas.nodes.push(...newNodes);
        return newNodes;
    }

    private saveState(canvasId: string): void {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return;

        const stack = this.undoStack.get(canvasId) || [];
        stack.push(JSON.parse(JSON.stringify(canvas)));
        if (stack.length > 50) stack.shift(); // Limit history
        this.undoStack.set(canvasId, stack);
        this.redoStack.set(canvasId, []); // Clear redo on new action
    }

    undo(canvasId: string): boolean {
        const stack = this.undoStack.get(canvasId);
        if (!stack || stack.length === 0) return false;

        const currentCanvas = this.canvases.get(canvasId);
        if (currentCanvas) {
            const redoStack = this.redoStack.get(canvasId) || [];
            redoStack.push(JSON.parse(JSON.stringify(currentCanvas)));
            this.redoStack.set(canvasId, redoStack);
        }

        const previousState = stack.pop()!;
        this.canvases.set(canvasId, previousState);
        this.emit('canvas:undo', canvasId);
        return true;
    }

    redo(canvasId: string): boolean {
        const stack = this.redoStack.get(canvasId);
        if (!stack || stack.length === 0) return false;

        const currentCanvas = this.canvases.get(canvasId);
        if (currentCanvas) {
            const undoStack = this.undoStack.get(canvasId) || [];
            undoStack.push(JSON.parse(JSON.stringify(currentCanvas)));
            this.undoStack.set(canvasId, undoStack);
        }

        const nextState = stack.pop()!;
        this.canvases.set(canvasId, nextState);
        this.emit('canvas:redo', canvasId);
        return true;
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private snapToGrid(position: Position, gridSize: number): Position {
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize,
            z: position.z,
        };
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getAllCanvases(): Canvas[] {
        return Array.from(this.canvases.values());
    }

    getActiveCanvas(): Canvas | undefined {
        return this.activeCanvasId ? this.canvases.get(this.activeCanvasId) : undefined;
    }

    exportCanvas(canvasId: string): string {
        const canvas = this.canvases.get(canvasId);
        if (!canvas) return '';
        return JSON.stringify(canvas, null, 2);
    }

    importCanvas(json: string): Canvas | undefined {
        try {
            const canvas = JSON.parse(json) as Canvas;
            canvas.id = `canvas_${Date.now()}`; // New ID
            this.canvases.set(canvas.id, canvas);
            return canvas;
        } catch {
            return undefined;
        }
    }
}

export const infiniteCanvasWorkspace = InfiniteCanvasWorkspace.getInstance();
