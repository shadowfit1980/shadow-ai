/**
 * Holographic File Visualization
 * 3D holographic representation of file system and code
 * Grok Recommendation: Holographic File Viz
 */
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface HolographicNode {
    id: string;
    name: string;
    type: 'file' | 'directory' | 'module' | 'component' | 'function' | 'class';
    path: string;
    position: Vector3D;
    rotation: Vector3D;
    scale: Vector3D;
    color: string;
    glow: number;
    connections: string[];
    metadata: Record<string, unknown>;
    children: string[];
    parent?: string;
    selected: boolean;
    hovered: boolean;
    expanded: boolean;
}

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

interface HolographicScene {
    id: string;
    name: string;
    nodes: Map<string, HolographicNode>;
    camera: CameraState;
    lighting: LightingConfig;
    effects: VisualEffects;
    layout: LayoutMode;
    theme: HolographicTheme;
}

interface CameraState {
    position: Vector3D;
    target: Vector3D;
    fov: number;
    zoom: number;
    rotation: Vector3D;
}

interface LightingConfig {
    ambient: { color: string; intensity: number };
    directional: { color: string; intensity: number; position: Vector3D }[];
    point: { color: string; intensity: number; position: Vector3D; range: number }[];
}

interface VisualEffects {
    bloom: { enabled: boolean; intensity: number; threshold: number };
    glow: { enabled: boolean; color: string; intensity: number };
    particles: { enabled: boolean; count: number; color: string };
    fog: { enabled: boolean; color: string; density: number };
    scanlines: { enabled: boolean; intensity: number };
    hologramFlicker: { enabled: boolean; frequency: number };
}

interface LayoutMode {
    type: 'sphere' | 'helix' | 'tree' | 'galaxy' | 'grid' | 'neural' | 'organic';
    parameters: Record<string, number>;
}

interface HolographicTheme {
    name: string;
    backgroundColor: string;
    nodeColors: Record<HolographicNode['type'], string>;
    connectionColor: string;
    glowColor: string;
    textColor: string;
    accentColor: string;
}

interface NavigationEvent {
    type: 'pan' | 'rotate' | 'zoom' | 'focus' | 'reset';
    data: Record<string, number>;
}

const HOLOGRAPHIC_THEMES: HolographicTheme[] = [
    {
        name: 'Cyberpunk',
        backgroundColor: '#0a0a1a',
        nodeColors: { file: '#00ffff', directory: '#ff00ff', module: '#ffff00', component: '#00ff00', function: '#ff6600', class: '#ff0066' },
        connectionColor: '#00ffff40',
        glowColor: '#00ffff',
        textColor: '#ffffff',
        accentColor: '#ff00ff'
    },
    {
        name: 'Matrix',
        backgroundColor: '#000000',
        nodeColors: { file: '#00ff00', directory: '#00cc00', module: '#009900', component: '#00ff66', function: '#66ff00', class: '#00ff99' },
        connectionColor: '#00ff0040',
        glowColor: '#00ff00',
        textColor: '#00ff00',
        accentColor: '#ffffff'
    },
    {
        name: 'Tron',
        backgroundColor: '#000011',
        nodeColors: { file: '#0088ff', directory: '#00aaff', module: '#00ccff', component: '#ff8800', function: '#ffaa00', class: '#00ffff' },
        connectionColor: '#0088ff40',
        glowColor: '#00ccff',
        textColor: '#ffffff',
        accentColor: '#ff8800'
    },
    {
        name: 'Nebula',
        backgroundColor: '#0a0020',
        nodeColors: { file: '#ff6b9d', directory: '#c44dff', module: '#7b5fff', component: '#5dabff', function: '#5dffce', class: '#ffdd5d' },
        connectionColor: '#c44dff40',
        glowColor: '#c44dff',
        textColor: '#ffffff',
        accentColor: '#ff6b9d'
    }
];

export class HolographicFileViz extends EventEmitter {
    private static instance: HolographicFileViz;
    private scenes: Map<string, HolographicScene> = new Map();
    private activeScene: string | null = null;
    private themes: Map<string, HolographicTheme> = new Map();

    private constructor() {
        super();
        HOLOGRAPHIC_THEMES.forEach(t => this.themes.set(t.name, t));
    }

    static getInstance(): HolographicFileViz {
        if (!HolographicFileViz.instance) {
            HolographicFileViz.instance = new HolographicFileViz();
        }
        return HolographicFileViz.instance;
    }

    createScene(name: string, themeName: string = 'Cyberpunk'): HolographicScene {
        const theme = this.themes.get(themeName) || HOLOGRAPHIC_THEMES[0];

        const scene: HolographicScene = {
            id: crypto.randomUUID(),
            name,
            nodes: new Map(),
            camera: {
                position: { x: 0, y: 0, z: 500 },
                target: { x: 0, y: 0, z: 0 },
                fov: 60,
                zoom: 1,
                rotation: { x: 0, y: 0, z: 0 }
            },
            lighting: {
                ambient: { color: theme.glowColor, intensity: 0.3 },
                directional: [
                    { color: '#ffffff', intensity: 0.8, position: { x: 100, y: 100, z: 100 } }
                ],
                point: [
                    { color: theme.accentColor, intensity: 0.5, position: { x: 0, y: 0, z: 0 }, range: 200 }
                ]
            },
            effects: {
                bloom: { enabled: true, intensity: 0.8, threshold: 0.5 },
                glow: { enabled: true, color: theme.glowColor, intensity: 1.0 },
                particles: { enabled: true, count: 1000, color: theme.glowColor },
                fog: { enabled: true, color: theme.backgroundColor, density: 0.002 },
                scanlines: { enabled: true, intensity: 0.1 },
                hologramFlicker: { enabled: true, frequency: 0.05 }
            },
            layout: { type: 'galaxy', parameters: { radius: 300, spiralArms: 3 } },
            theme
        };

        this.scenes.set(scene.id, scene);
        this.activeScene = scene.id;
        this.emit('sceneCreated', scene);
        return scene;
    }

    addNode(sceneId: string, config: {
        name: string;
        type: HolographicNode['type'];
        path: string;
        parentId?: string;
        metadata?: Record<string, unknown>;
    }): HolographicNode | null {
        const scene = this.scenes.get(sceneId);
        if (!scene) return null;

        const position = this.calculateNodePosition(scene, config.parentId);
        const theme = scene.theme;

        const node: HolographicNode = {
            id: crypto.randomUUID(),
            name: config.name,
            type: config.type,
            path: config.path,
            position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: theme.nodeColors[config.type],
            glow: 0.5,
            connections: [],
            metadata: config.metadata || {},
            children: [],
            parent: config.parentId,
            selected: false,
            hovered: false,
            expanded: true
        };

        if (config.parentId) {
            const parent = scene.nodes.get(config.parentId);
            if (parent) {
                parent.children.push(node.id);
                parent.connections.push(node.id);
            }
        }

        scene.nodes.set(node.id, node);
        this.emit('nodeAdded', { sceneId, node });
        return node;
    }

    private calculateNodePosition(scene: HolographicScene, parentId?: string): Vector3D {
        const layout = scene.layout;
        const nodeCount = scene.nodes.size;

        switch (layout.type) {
            case 'sphere': {
                const phi = Math.acos(-1 + (2 * nodeCount) / (nodeCount + 1));
                const theta = Math.sqrt((nodeCount + 1) * Math.PI) * phi;
                const radius = layout.parameters['radius'] || 200;
                return {
                    x: radius * Math.cos(theta) * Math.sin(phi),
                    y: radius * Math.sin(theta) * Math.sin(phi),
                    z: radius * Math.cos(phi)
                };
            }
            case 'helix': {
                const angle = nodeCount * 0.5;
                const height = nodeCount * 10;
                const radius = layout.parameters['radius'] || 150;
                return {
                    x: radius * Math.cos(angle),
                    y: height - 200,
                    z: radius * Math.sin(angle)
                };
            }
            case 'galaxy': {
                const arm = nodeCount % (layout.parameters['spiralArms'] || 3);
                const armAngle = (arm * 2 * Math.PI) / (layout.parameters['spiralArms'] || 3);
                const distance = 50 + nodeCount * 5;
                const spiralAngle = distance * 0.02;
                const radius = Math.min(distance, layout.parameters['radius'] || 300);
                return {
                    x: radius * Math.cos(armAngle + spiralAngle),
                    y: (Math.random() - 0.5) * 50,
                    z: radius * Math.sin(armAngle + spiralAngle)
                };
            }
            case 'tree': {
                if (parentId) {
                    const parent = scene.nodes.get(parentId);
                    if (parent) {
                        const childIndex = parent.children.length;
                        const spread = 100;
                        return {
                            x: parent.position.x + (childIndex - parent.children.length / 2) * spread,
                            y: parent.position.y - 80,
                            z: parent.position.z + (Math.random() - 0.5) * 20
                        };
                    }
                }
                return { x: 0, y: 200, z: 0 };
            }
            case 'neural': {
                const layer = Math.floor(Math.sqrt(nodeCount));
                const inLayer = nodeCount - layer * layer;
                const radius = layer * 80;
                const angle = (inLayer * 2 * Math.PI) / (layer * 2 + 1);
                return {
                    x: radius * Math.cos(angle),
                    y: (Math.random() - 0.5) * 100,
                    z: radius * Math.sin(angle)
                };
            }
            default:
                return {
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    z: (Math.random() - 0.5) * 400
                };
        }
    }

    loadFileSystem(sceneId: string, files: { path: string; type: 'file' | 'directory'; size?: number }[]): number {
        const scene = this.scenes.get(sceneId);
        if (!scene) return 0;

        const pathToId = new Map<string, string>();
        let nodesAdded = 0;

        // Sort by path depth
        files.sort((a, b) => a.path.split('/').length - b.path.split('/').length);

        for (const file of files) {
            const parts = file.path.split('/').filter(Boolean);
            const name = parts[parts.length - 1];
            const parentPath = parts.slice(0, -1).join('/');
            const parentId = parentPath ? pathToId.get(parentPath) : undefined;

            const node = this.addNode(sceneId, {
                name,
                type: file.type,
                path: file.path,
                parentId,
                metadata: { size: file.size }
            });

            if (node) {
                pathToId.set(file.path, node.id);
                nodesAdded++;
            }
        }

        this.applyLayout(sceneId);
        return nodesAdded;
    }

    applyLayout(sceneId: string): void {
        const scene = this.scenes.get(sceneId);
        if (!scene) return;

        let index = 0;
        for (const node of scene.nodes.values()) {
            node.position = this.calculateNodePosition(scene, node.parent);
            index++;
        }

        this.emit('layoutApplied', { sceneId, layout: scene.layout });
    }

    setLayout(sceneId: string, layout: LayoutMode): void {
        const scene = this.scenes.get(sceneId);
        if (!scene) return;

        scene.layout = layout;
        this.applyLayout(sceneId);
    }

    navigate(sceneId: string, event: NavigationEvent): void {
        const scene = this.scenes.get(sceneId);
        if (!scene) return;

        switch (event.type) {
            case 'pan':
                scene.camera.position.x += event.data['deltaX'] || 0;
                scene.camera.position.y += event.data['deltaY'] || 0;
                break;
            case 'rotate':
                scene.camera.rotation.x += event.data['deltaX'] || 0;
                scene.camera.rotation.y += event.data['deltaY'] || 0;
                break;
            case 'zoom':
                scene.camera.zoom *= 1 + (event.data['delta'] || 0) * 0.1;
                scene.camera.zoom = Math.max(0.1, Math.min(10, scene.camera.zoom));
                break;
            case 'focus':
                const nodeId = String(event.data['nodeId'] || '');
                const node = scene.nodes.get(nodeId);
                if (node) {
                    scene.camera.target = { ...node.position };
                }
                break;
            case 'reset':
                scene.camera = {
                    position: { x: 0, y: 0, z: 500 },
                    target: { x: 0, y: 0, z: 0 },
                    fov: 60,
                    zoom: 1,
                    rotation: { x: 0, y: 0, z: 0 }
                };
                break;
        }

        this.emit('cameraUpdated', { sceneId, camera: scene.camera });
    }

    selectNode(sceneId: string, nodeId: string): void {
        const scene = this.scenes.get(sceneId);
        if (!scene) return;

        for (const node of scene.nodes.values()) {
            node.selected = node.id === nodeId;
            if (node.selected) {
                node.glow = 1.0;
                node.scale = { x: 1.2, y: 1.2, z: 1.2 };
            } else {
                node.glow = 0.5;
                node.scale = { x: 1, y: 1, z: 1 };
            }
        }

        this.emit('nodeSelected', { sceneId, nodeId });
    }

    setTheme(sceneId: string, themeName: string): boolean {
        const scene = this.scenes.get(sceneId);
        const theme = this.themes.get(themeName);
        if (!scene || !theme) return false;

        scene.theme = theme;
        scene.effects.glow.color = theme.glowColor;
        scene.lighting.ambient.color = theme.glowColor;

        for (const node of scene.nodes.values()) {
            node.color = theme.nodeColors[node.type];
        }

        this.emit('themeChanged', { sceneId, theme });
        return true;
    }

    updateEffects(sceneId: string, effects: Partial<VisualEffects>): void {
        const scene = this.scenes.get(sceneId);
        if (!scene) return;

        scene.effects = { ...scene.effects, ...effects };
        this.emit('effectsUpdated', { sceneId, effects: scene.effects });
    }

    generateWebGLCode(sceneId: string): string {
        const scene = this.scenes.get(sceneId);
        if (!scene) return '';

        const nodes = Array.from(scene.nodes.values());

        return `
// Three.js Holographic Visualization
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const scene = new THREE.Scene();
scene.background = new THREE.Color('${scene.theme.backgroundColor}');

const camera = new THREE.PerspectiveCamera(${scene.camera.fov}, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(${scene.camera.position.x}, ${scene.camera.position.y}, ${scene.camera.position.z});

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Nodes
${nodes.map(n => `
const node_${n.id.replace(/-/g, '_')} = new THREE.Mesh(
  new THREE.SphereGeometry(10, 32, 32),
  new THREE.MeshPhongMaterial({ 
    color: '${n.color}', 
    emissive: '${n.color}',
    emissiveIntensity: ${n.glow}
  })
);
node_${n.id.replace(/-/g, '_')}.position.set(${n.position.x}, ${n.position.y}, ${n.position.z});
scene.add(node_${n.id.replace(/-/g, '_')});
`).join('')}

// Bloom effect
const composer = new EffectComposer(renderer);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  ${scene.effects.bloom.intensity},
  0.4,
  ${scene.effects.bloom.threshold}
);
composer.addPass(bloomPass);

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();
`;
    }

    getScene(id: string): HolographicScene | undefined {
        return this.scenes.get(id);
    }

    getActiveScene(): HolographicScene | undefined {
        return this.activeScene ? this.scenes.get(this.activeScene) : undefined;
    }

    getThemes(): HolographicTheme[] {
        return Array.from(this.themes.values());
    }

    getLayoutTypes(): LayoutMode['type'][] {
        return ['sphere', 'helix', 'tree', 'galaxy', 'grid', 'neural', 'organic'];
    }

    deleteScene(id: string): boolean {
        if (this.activeScene === id) {
            this.activeScene = null;
        }
        return this.scenes.delete(id);
    }
}

export const holographicFileViz = HolographicFileViz.getInstance();
