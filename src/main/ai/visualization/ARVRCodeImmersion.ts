/**
 * AR/VR Code Immersion
 * Walk through code as a 3D architecture
 * Grok Recommendation: AR/VR Code Immersion / Holographic Visualization
 */
import { EventEmitter } from 'events';

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

interface CodeNode {
    id: string;
    type: 'file' | 'class' | 'function' | 'variable' | 'import' | 'module' | 'package';
    name: string;
    position: Vector3D;
    size: Vector3D;
    color: string;
    connections: string[];
    metadata: Record<string, unknown>;
    children: CodeNode[];
}

interface VirtualSpace {
    id: string;
    name: string;
    nodes: CodeNode[];
    camera: CameraState;
    lighting: LightingConfig;
    theme: VisualizationTheme;
}

interface CameraState {
    position: Vector3D;
    target: Vector3D;
    fov: number;
    near: number;
    far: number;
}

interface LightingConfig {
    ambient: { color: string; intensity: number };
    directional: { color: string; intensity: number; position: Vector3D };
    fog: { color: string; near: number; far: number };
}

interface VisualizationTheme {
    name: string;
    background: string;
    nodeColors: Record<CodeNode['type'], string>;
    connectionColor: string;
    selectionColor: string;
    textColor: string;
}

interface NavigationEvent {
    type: 'move' | 'rotate' | 'zoom' | 'teleport' | 'select';
    target?: string;
    position?: Vector3D;
    rotation?: Vector3D;
}

interface InteractionResult {
    selectedNode: CodeNode | null;
    hoveredNodes: CodeNode[];
    path: CodeNode[];
}

export class ARVRCodeImmersion extends EventEmitter {
    private static instance: ARVRCodeImmersion;
    private currentSpace: VirtualSpace;
    private themes: Map<string, VisualizationTheme> = new Map();
    private selectedNode: CodeNode | null = null;
    private navigationHistory: Vector3D[] = [];

    private constructor() {
        super();
        this.initializeThemes();
        this.currentSpace = this.createDefaultSpace();
    }

    static getInstance(): ARVRCodeImmersion {
        if (!ARVRCodeImmersion.instance) {
            ARVRCodeImmersion.instance = new ARVRCodeImmersion();
        }
        return ARVRCodeImmersion.instance;
    }

    private initializeThemes(): void {
        const cyberpunk: VisualizationTheme = {
            name: 'Cyberpunk',
            background: '#0a0a0a',
            nodeColors: {
                file: '#00ff9f',
                class: '#ff00ff',
                function: '#00d4ff',
                variable: '#ffff00',
                import: '#ff6b6b',
                module: '#9b59b6',
                package: '#e67e22'
            },
            connectionColor: '#00ff9f33',
            selectionColor: '#ffffff',
            textColor: '#ffffff'
        };

        const matrix: VisualizationTheme = {
            name: 'Matrix',
            background: '#000000',
            nodeColors: {
                file: '#00ff00',
                class: '#00cc00',
                function: '#00ff00',
                variable: '#00aa00',
                import: '#008800',
                module: '#00dd00',
                package: '#00ee00'
            },
            connectionColor: '#00ff0033',
            selectionColor: '#ffffff',
            textColor: '#00ff00'
        };

        const ocean: VisualizationTheme = {
            name: 'Ocean',
            background: '#0c2461',
            nodeColors: {
                file: '#00d2d3',
                class: '#54a0ff',
                function: '#5f27cd',
                variable: '#00cec9',
                import: '#6c5ce7',
                module: '#0984e3',
                package: '#74b9ff'
            },
            connectionColor: '#54a0ff33',
            selectionColor: '#ffffff',
            textColor: '#dfe6e9'
        };

        this.themes.set('cyberpunk', cyberpunk);
        this.themes.set('matrix', matrix);
        this.themes.set('ocean', ocean);
    }

    private createDefaultSpace(): VirtualSpace {
        return {
            id: `space_${Date.now()}`,
            name: 'Code Universe',
            nodes: [],
            camera: {
                position: { x: 0, y: 5, z: 10 },
                target: { x: 0, y: 0, z: 0 },
                fov: 75,
                near: 0.1,
                far: 1000
            },
            lighting: {
                ambient: { color: '#404040', intensity: 0.5 },
                directional: { color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 10 } },
                fog: { color: '#0a0a0a', near: 10, far: 100 }
            },
            theme: this.themes.get('cyberpunk')!
        };
    }

    parseCodebase(files: { path: string; content: string; type: string }[]): VirtualSpace {
        const nodes: CodeNode[] = [];
        const levelSpacing = 5;
        const nodeSpacing = 3;

        // Create nodes for each file
        files.forEach((file, index) => {
            const angle = (index / files.length) * Math.PI * 2;
            const radius = 10;

            const fileNode = this.createNode({
                type: 'file',
                name: file.path.split('/').pop() || file.path,
                position: {
                    x: Math.cos(angle) * radius,
                    y: 0,
                    z: Math.sin(angle) * radius
                },
                metadata: { path: file.path, fileType: file.type }
            });

            // Parse and add child nodes (classes, functions)
            const childNodes = this.parseFileContent(file.content, fileNode.position);
            fileNode.children = childNodes;
            childNodes.forEach(child => fileNode.connections.push(child.id));

            nodes.push(fileNode);
            nodes.push(...childNodes);
        });

        // Create connections between related nodes
        this.createNodeConnections(nodes);

        this.currentSpace.nodes = nodes;
        this.emit('spaceUpdated', this.currentSpace);
        return this.currentSpace;
    }

    private createNode(config: Partial<CodeNode> & Pick<CodeNode, 'type' | 'name'>): CodeNode {
        const sizeByType: Record<CodeNode['type'], Vector3D> = {
            package: { x: 4, y: 4, z: 4 },
            module: { x: 3, y: 3, z: 3 },
            file: { x: 2, y: 2, z: 2 },
            class: { x: 1.5, y: 1.5, z: 1.5 },
            function: { x: 1, y: 1, z: 1 },
            variable: { x: 0.5, y: 0.5, z: 0.5 },
            import: { x: 0.5, y: 0.5, z: 0.5 }
        };

        return {
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: config.type,
            name: config.name,
            position: config.position || { x: 0, y: 0, z: 0 },
            size: config.size || sizeByType[config.type],
            color: config.color || this.currentSpace.theme.nodeColors[config.type],
            connections: config.connections || [],
            metadata: config.metadata || {},
            children: config.children || []
        };
    }

    private parseFileContent(content: string, parentPosition: Vector3D): CodeNode[] {
        const nodes: CodeNode[] = [];

        // Simple regex-based parsing (would use AST in production)
        const classMatches = content.matchAll(/class\s+(\w+)/g);
        const functionMatches = content.matchAll(/(?:function\s+(\w+)|(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g);
        const importMatches = content.matchAll(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);

        let yOffset = 1;

        for (const match of classMatches) {
            nodes.push(this.createNode({
                type: 'class',
                name: match[1],
                position: {
                    x: parentPosition.x + (Math.random() - 0.5) * 2,
                    y: parentPosition.y + yOffset,
                    z: parentPosition.z + (Math.random() - 0.5) * 2
                }
            }));
            yOffset += 0.5;
        }

        for (const match of functionMatches) {
            const name = match[1] || match[2];
            if (name) {
                nodes.push(this.createNode({
                    type: 'function',
                    name,
                    position: {
                        x: parentPosition.x + (Math.random() - 0.5) * 3,
                        y: parentPosition.y + yOffset,
                        z: parentPosition.z + (Math.random() - 0.5) * 3
                    }
                }));
                yOffset += 0.3;
            }
        }

        for (const match of importMatches) {
            nodes.push(this.createNode({
                type: 'import',
                name: match[1],
                position: {
                    x: parentPosition.x + (Math.random() - 0.5) * 4,
                    y: parentPosition.y - 1,
                    z: parentPosition.z + (Math.random() - 0.5) * 4
                }
            }));
        }

        return nodes;
    }

    private createNodeConnections(nodes: CodeNode[]): void {
        // Connect imports to their source files
        const imports = nodes.filter(n => n.type === 'import');
        const files = nodes.filter(n => n.type === 'file');

        for (const imp of imports) {
            const targetFile = files.find(f => f.name.includes(imp.name) || imp.name.includes(f.name.replace(/\.[^.]+$/, '')));
            if (targetFile) {
                imp.connections.push(targetFile.id);
            }
        }
    }

    navigate(event: NavigationEvent): void {
        const camera = this.currentSpace.camera;

        switch (event.type) {
            case 'move':
                if (event.position) {
                    this.navigationHistory.push({ ...camera.position });
                    camera.position = event.position;
                }
                break;
            case 'rotate':
                if (event.rotation) {
                    camera.target = {
                        x: camera.position.x + Math.cos(event.rotation.y) * 10,
                        y: camera.position.y,
                        z: camera.position.z + Math.sin(event.rotation.y) * 10
                    };
                }
                break;
            case 'zoom':
                if (event.position) {
                    const direction = this.normalize(this.subtract(camera.target, camera.position));
                    const distance = event.position.z > 0 ? 2 : -2;
                    camera.position = this.add(camera.position, this.scale(direction, distance));
                }
                break;
            case 'teleport':
                if (event.target) {
                    const node = this.currentSpace.nodes.find(n => n.id === event.target);
                    if (node) {
                        this.navigationHistory.push({ ...camera.position });
                        camera.position = this.add(node.position, { x: 0, y: 2, z: 5 });
                        camera.target = node.position;
                    }
                }
                break;
            case 'select':
                if (event.target) {
                    this.selectedNode = this.currentSpace.nodes.find(n => n.id === event.target) || null;
                }
                break;
        }

        this.emit('navigationUpdated', { camera, event });
    }

    private add(a: Vector3D, b: Vector3D): Vector3D {
        return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    }

    private subtract(a: Vector3D, b: Vector3D): Vector3D {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }

    private scale(v: Vector3D, s: number): Vector3D {
        return { x: v.x * s, y: v.y * s, z: v.z * s };
    }

    private normalize(v: Vector3D): Vector3D {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return len > 0 ? { x: v.x / len, y: v.y / len, z: v.z / len } : { x: 0, y: 0, z: 0 };
    }

    goBack(): boolean {
        if (this.navigationHistory.length === 0) return false;

        const previousPosition = this.navigationHistory.pop()!;
        this.currentSpace.camera.position = previousPosition;
        this.emit('navigationUpdated', { camera: this.currentSpace.camera });
        return true;
    }

    setTheme(themeName: string): boolean {
        const theme = this.themes.get(themeName);
        if (!theme) return false;

        this.currentSpace.theme = theme;

        // Update node colors
        for (const node of this.currentSpace.nodes) {
            node.color = theme.nodeColors[node.type];
        }

        this.emit('themeChanged', theme);
        return true;
    }

    getThemes(): string[] {
        return Array.from(this.themes.keys());
    }

    selectNode(nodeId: string): CodeNode | null {
        this.selectedNode = this.currentSpace.nodes.find(n => n.id === nodeId) || null;
        this.emit('nodeSelected', this.selectedNode);
        return this.selectedNode;
    }

    getNodePath(nodeId: string): CodeNode[] {
        const path: CodeNode[] = [];
        const node = this.currentSpace.nodes.find(n => n.id === nodeId);
        if (!node) return path;

        // Build path from file to node
        const findPath = (current: CodeNode, target: string, currentPath: CodeNode[]): boolean => {
            currentPath.push(current);
            if (current.id === target) return true;

            for (const childId of current.connections) {
                const child = this.currentSpace.nodes.find(n => n.id === childId);
                if (child && findPath(child, target, currentPath)) return true;
            }

            currentPath.pop();
            return false;
        };

        const files = this.currentSpace.nodes.filter(n => n.type === 'file');
        for (const file of files) {
            if (findPath(file, nodeId, path)) break;
        }

        return path;
    }

    searchNodes(query: string): CodeNode[] {
        const lowerQuery = query.toLowerCase();
        return this.currentSpace.nodes.filter(n =>
            n.name.toLowerCase().includes(lowerQuery) ||
            n.type.includes(lowerQuery)
        );
    }

    focusOnNode(nodeId: string): void {
        this.navigate({ type: 'teleport', target: nodeId });
        this.selectNode(nodeId);
    }

    getSpace(): VirtualSpace {
        return this.currentSpace;
    }

    getNodes(): CodeNode[] {
        return this.currentSpace.nodes;
    }

    getSelectedNode(): CodeNode | null {
        return this.selectedNode;
    }

    exportScene(): string {
        return JSON.stringify(this.currentSpace, null, 2);
    }

    generateThreeJSScene(): string {
        const theme = this.currentSpace.theme;

        return `
// Auto-generated Three.js scene
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('${theme.background}');
scene.fog = new THREE.Fog('${this.currentSpace.lighting.fog.color}', ${this.currentSpace.lighting.fog.near}, ${this.currentSpace.lighting.fog.far});

const camera = new THREE.PerspectiveCamera(
    ${this.currentSpace.camera.fov},
    window.innerWidth / window.innerHeight,
    ${this.currentSpace.camera.near},
    ${this.currentSpace.camera.far}
);
camera.position.set(${this.currentSpace.camera.position.x}, ${this.currentSpace.camera.position.y}, ${this.currentSpace.camera.position.z});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambient = new THREE.AmbientLight('${this.currentSpace.lighting.ambient.color}', ${this.currentSpace.lighting.ambient.intensity});
scene.add(ambient);

// Nodes
${this.currentSpace.nodes.map(node => `
// ${node.name}
const node_${node.id.replace(/-/g, '_')} = new THREE.Mesh(
    new THREE.BoxGeometry(${node.size.x}, ${node.size.y}, ${node.size.z}),
    new THREE.MeshPhongMaterial({ color: '${node.color}', transparent: true, opacity: 0.8 })
);
node_${node.id.replace(/-/g, '_')}.position.set(${node.position.x}, ${node.position.y}, ${node.position.z});
scene.add(node_${node.id.replace(/-/g, '_')});
`).join('')}

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
`;
    }
}

export const arvrCodeImmersion = ARVRCodeImmersion.getInstance();
