/**
 * Holographic Code Environment
 * 
 * Creates immersive 3D/AR/VR code visualization and manipulation
 * environments for spatial programming and debugging.
 */

import { EventEmitter } from 'events';

export interface HolographicEnvironment {
    id: string;
    name: string;
    type: EnvironmentType;
    objects: HolographicObject[];
    layers: EnvironmentLayer[];
    camera: CameraState;
    interactions: Interaction[];
    settings: EnvironmentSettings;
    createdAt: Date;
}

export type EnvironmentType = 'ar' | 'vr' | '3d-desktop' | 'spatial';

export interface HolographicObject {
    id: string;
    type: ObjectType;
    position: Vector3D;
    rotation: Vector3D;
    scale: Vector3D;
    content: ObjectContent;
    connections: Connection[];
    glow?: GlowEffect;
    animation?: ObjectAnimation;
}

export type ObjectType =
    | 'code-block'
    | 'function-sphere'
    | 'class-cube'
    | 'data-stream'
    | 'dependency-arc'
    | 'variable-orb'
    | 'error-warning'
    | 'execution-trace';

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface ObjectContent {
    code?: string;
    label: string;
    metadata: Record<string, any>;
    color: string;
    opacity: number;
}

export interface Connection {
    targetId: string;
    type: 'calls' | 'imports' | 'extends' | 'data-flow';
    strength: number;
    animated: boolean;
}

export interface GlowEffect {
    color: string;
    intensity: number;
    pulse: boolean;
}

export interface ObjectAnimation {
    type: 'rotate' | 'float' | 'pulse' | 'orbit';
    speed: number;
    amplitude: number;
}

export interface EnvironmentLayer {
    id: string;
    name: string;
    type: 'architecture' | 'execution' | 'debug' | 'collaboration';
    visible: boolean;
    opacity: number;
    objects: string[]; // Object IDs
}

export interface CameraState {
    position: Vector3D;
    target: Vector3D;
    fov: number;
    mode: 'orbit' | 'fly' | 'first-person' | 'follow';
}

export interface Interaction {
    id: string;
    type: InteractionType;
    objectId: string;
    timestamp: Date;
    data?: any;
}

export type InteractionType =
    | 'select'
    | 'hover'
    | 'grab'
    | 'throw'
    | 'pinch-zoom'
    | 'voice-command'
    | 'gesture';

export interface EnvironmentSettings {
    skybox: string;
    ambientLight: number;
    gridVisible: boolean;
    gravityEnabled: boolean;
    snapToGrid: boolean;
    gestureControls: boolean;
    voiceCommands: boolean;
}

export interface SpatialQuery {
    type: 'radius' | 'box' | 'ray';
    origin: Vector3D;
    params: any;
}

export class HolographicCodeEnvironment extends EventEmitter {
    private static instance: HolographicCodeEnvironment;
    private environments: Map<string, HolographicEnvironment> = new Map();

    private constructor() {
        super();
    }

    static getInstance(): HolographicCodeEnvironment {
        if (!HolographicCodeEnvironment.instance) {
            HolographicCodeEnvironment.instance = new HolographicCodeEnvironment();
        }
        return HolographicCodeEnvironment.instance;
    }

    // ========================================================================
    // ENVIRONMENT CREATION
    // ========================================================================

    createEnvironment(name: string, type: EnvironmentType = '3d-desktop'): HolographicEnvironment {
        const env: HolographicEnvironment = {
            id: `holo_${Date.now()}`,
            name,
            type,
            objects: [],
            layers: [
                { id: 'arch', name: 'Architecture', type: 'architecture', visible: true, opacity: 1, objects: [] },
                { id: 'exec', name: 'Execution', type: 'execution', visible: false, opacity: 0.8, objects: [] },
                { id: 'debug', name: 'Debug', type: 'debug', visible: false, opacity: 0.6, objects: [] },
            ],
            camera: {
                position: { x: 0, y: 10, z: 20 },
                target: { x: 0, y: 0, z: 0 },
                fov: 60,
                mode: 'orbit',
            },
            interactions: [],
            settings: {
                skybox: 'nebula',
                ambientLight: 0.5,
                gridVisible: true,
                gravityEnabled: false,
                snapToGrid: true,
                gestureControls: type === 'ar' || type === 'vr',
                voiceCommands: true,
            },
            createdAt: new Date(),
        };

        this.environments.set(env.id, env);
        this.emit('environment:created', env);
        return env;
    }

    // ========================================================================
    // OBJECT MANAGEMENT
    // ========================================================================

    createCodeBlock(envId: string, code: string, position: Vector3D): HolographicObject | undefined {
        const env = this.environments.get(envId);
        if (!env) return undefined;

        const obj: HolographicObject = {
            id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'code-block',
            position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            content: {
                code,
                label: this.extractLabel(code),
                metadata: { lines: code.split('\n').length },
                color: '#00ff88',
                opacity: 1,
            },
            connections: [],
        };

        env.objects.push(obj);
        env.layers[0].objects.push(obj.id);
        this.emit('object:created', { env, obj });
        return obj;
    }

    createFunctionSphere(envId: string, name: string, code: string, position: Vector3D): HolographicObject | undefined {
        const env = this.environments.get(envId);
        if (!env) return undefined;

        const complexity = this.calculateComplexity(code);
        const size = 0.5 + complexity * 0.5;

        const obj: HolographicObject = {
            id: `func_${Date.now()}`,
            type: 'function-sphere',
            position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: size, y: size, z: size },
            content: {
                code,
                label: name,
                metadata: { complexity, params: this.extractParams(code) },
                color: this.getColorByComplexity(complexity),
                opacity: 0.8,
            },
            connections: [],
            glow: {
                color: this.getColorByComplexity(complexity),
                intensity: complexity,
                pulse: complexity > 0.7,
            },
            animation: {
                type: 'float',
                speed: 0.5,
                amplitude: 0.1,
            },
        };

        env.objects.push(obj);
        this.emit('object:created', { env, obj });
        return obj;
    }

    createDataStream(envId: string, sourceId: string, targetId: string, data: string[]): HolographicObject | undefined {
        const env = this.environments.get(envId);
        if (!env) return undefined;

        const source = env.objects.find(o => o.id === sourceId);
        const target = env.objects.find(o => o.id === targetId);
        if (!source || !target) return undefined;

        const midpoint: Vector3D = {
            x: (source.position.x + target.position.x) / 2,
            y: (source.position.y + target.position.y) / 2 + 2,
            z: (source.position.z + target.position.z) / 2,
        };

        const obj: HolographicObject = {
            id: `stream_${Date.now()}`,
            type: 'data-stream',
            position: midpoint,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            content: {
                label: `Data: ${data.length} items`,
                metadata: { data, source: sourceId, target: targetId },
                color: '#00ffff',
                opacity: 0.6,
            },
            connections: [
                { targetId: sourceId, type: 'data-flow', strength: 1, animated: true },
                { targetId, type: 'data-flow', strength: 1, animated: true },
            ],
            animation: {
                type: 'pulse',
                speed: 2,
                amplitude: 0.5,
            },
        };

        env.objects.push(obj);
        this.emit('object:created', { env, obj });
        return obj;
    }

    createErrorMarker(envId: string, position: Vector3D, error: { message: string; severity: string }): HolographicObject | undefined {
        const env = this.environments.get(envId);
        if (!env) return undefined;

        const obj: HolographicObject = {
            id: `error_${Date.now()}`,
            type: 'error-warning',
            position,
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            content: {
                label: error.message,
                metadata: error,
                color: error.severity === 'error' ? '#ff0000' : '#ffaa00',
                opacity: 1,
            },
            connections: [],
            glow: {
                color: '#ff0000',
                intensity: 1,
                pulse: true,
            },
            animation: {
                type: 'rotate',
                speed: 1,
                amplitude: 360,
            },
        };

        env.objects.push(obj);
        env.layers.find(l => l.type === 'debug')?.objects.push(obj.id);
        this.emit('object:created', { env, obj });
        return obj;
    }

    // ========================================================================
    // OBJECT MANIPULATION
    // ========================================================================

    moveObject(envId: string, objectId: string, newPosition: Vector3D): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const obj = env.objects.find(o => o.id === objectId);
        if (obj) {
            if (env.settings.snapToGrid) {
                newPosition.x = Math.round(newPosition.x);
                newPosition.y = Math.round(newPosition.y);
                newPosition.z = Math.round(newPosition.z);
            }
            obj.position = newPosition;
            this.emit('object:moved', { env, obj });
        }
    }

    rotateObject(envId: string, objectId: string, rotation: Vector3D): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const obj = env.objects.find(o => o.id === objectId);
        if (obj) {
            obj.rotation = rotation;
            this.emit('object:rotated', { env, obj });
        }
    }

    scaleObject(envId: string, objectId: string, scale: Vector3D): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const obj = env.objects.find(o => o.id === objectId);
        if (obj) {
            obj.scale = scale;
            this.emit('object:scaled', { env, obj });
        }
    }

    connectObjects(envId: string, sourceId: string, targetId: string, connectionType: Connection['type']): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const source = env.objects.find(o => o.id === sourceId);
        if (source) {
            source.connections.push({
                targetId,
                type: connectionType,
                strength: 1,
                animated: connectionType === 'data-flow',
            });
            this.emit('objects:connected', { env, source, targetId, type: connectionType });
        }
    }

    // ========================================================================
    // CAMERA & VIEW
    // ========================================================================

    moveCamera(envId: string, position: Vector3D, target?: Vector3D): void {
        const env = this.environments.get(envId);
        if (!env) return;

        env.camera.position = position;
        if (target) env.camera.target = target;
        this.emit('camera:moved', { env, camera: env.camera });
    }

    focusOnObject(envId: string, objectId: string): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const obj = env.objects.find(o => o.id === objectId);
        if (obj) {
            env.camera.target = obj.position;
            env.camera.position = {
                x: obj.position.x + 5,
                y: obj.position.y + 3,
                z: obj.position.z + 5,
            };
            this.emit('camera:focused', { env, object: obj });
        }
    }

    setCameraMode(envId: string, mode: CameraState['mode']): void {
        const env = this.environments.get(envId);
        if (env) {
            env.camera.mode = mode;
            this.emit('camera:modeChanged', { env, mode });
        }
    }

    // ========================================================================
    // LAYERS
    // ========================================================================

    toggleLayer(envId: string, layerId: string): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const layer = env.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.emit('layer:toggled', { env, layer });
        }
    }

    setLayerOpacity(envId: string, layerId: string, opacity: number): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const layer = env.layers.find(l => l.id === layerId);
        if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            this.emit('layer:opacityChanged', { env, layer });
        }
    }

    // ========================================================================
    // INTERACTIONS
    // ========================================================================

    recordInteraction(envId: string, type: InteractionType, objectId: string, data?: any): void {
        const env = this.environments.get(envId);
        if (!env) return;

        const interaction: Interaction = {
            id: `int_${Date.now()}`,
            type,
            objectId,
            timestamp: new Date(),
            data,
        };

        env.interactions.push(interaction);
        this.emit('interaction:recorded', { env, interaction });
    }

    processVoiceCommand(envId: string, command: string): void {
        const env = this.environments.get(envId);
        if (!env || !env.settings.voiceCommands) return;

        const lower = command.toLowerCase();

        if (lower.includes('zoom in')) {
            this.moveCamera(envId, {
                x: env.camera.position.x * 0.8,
                y: env.camera.position.y * 0.8,
                z: env.camera.position.z * 0.8,
            });
        } else if (lower.includes('zoom out')) {
            this.moveCamera(envId, {
                x: env.camera.position.x * 1.2,
                y: env.camera.position.y * 1.2,
                z: env.camera.position.z * 1.2,
            });
        } else if (lower.includes('show debug')) {
            this.toggleLayer(envId, 'debug');
        } else if (lower.includes('reset view')) {
            env.camera = {
                position: { x: 0, y: 10, z: 20 },
                target: { x: 0, y: 0, z: 0 },
                fov: 60,
                mode: 'orbit',
            };
        }

        this.emit('voice:processed', { env, command });
    }

    // ========================================================================
    // SPATIAL QUERIES
    // ========================================================================

    querySpace(envId: string, query: SpatialQuery): HolographicObject[] {
        const env = this.environments.get(envId);
        if (!env) return [];

        const results: HolographicObject[] = [];

        for (const obj of env.objects) {
            if (query.type === 'radius') {
                const dist = this.distance(obj.position, query.origin);
                if (dist <= query.params.radius) {
                    results.push(obj);
                }
            } else if (query.type === 'box') {
                const { min, max } = query.params;
                if (
                    obj.position.x >= min.x && obj.position.x <= max.x &&
                    obj.position.y >= min.y && obj.position.y <= max.y &&
                    obj.position.z >= min.z && obj.position.z <= max.z
                ) {
                    results.push(obj);
                }
            }
        }

        return results;
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private extractLabel(code: string): string {
        const funcMatch = code.match(/function\s+(\w+)/);
        const classMatch = code.match(/class\s+(\w+)/);
        const constMatch = code.match(/const\s+(\w+)/);
        return funcMatch?.[1] || classMatch?.[1] || constMatch?.[1] || 'Code Block';
    }

    private extractParams(code: string): string[] {
        const match = code.match(/\(([^)]*)\)/);
        if (!match) return [];
        return match[1].split(',').map(p => p.trim()).filter(Boolean);
    }

    private calculateComplexity(code: string): number {
        const lines = code.split('\n').length;
        const branches = (code.match(/if|else|switch|for|while|\?/g) || []).length;
        return Math.min(1, (lines / 50 + branches / 10) / 2);
    }

    private getColorByComplexity(complexity: number): string {
        if (complexity < 0.3) return '#00ff88';
        if (complexity < 0.5) return '#88ff00';
        if (complexity < 0.7) return '#ffaa00';
        return '#ff4444';
    }

    private distance(a: Vector3D, b: Vector3D): number {
        return Math.sqrt(
            Math.pow(a.x - b.x, 2) +
            Math.pow(a.y - b.y, 2) +
            Math.pow(a.z - b.z, 2)
        );
    }

    // ========================================================================
    // QUERIES
    // ========================================================================

    getEnvironment(id: string): HolographicEnvironment | undefined {
        return this.environments.get(id);
    }

    getAllEnvironments(): HolographicEnvironment[] {
        return Array.from(this.environments.values());
    }

    getStats(envId: string): {
        objects: number;
        connections: number;
        interactions: number;
        visibleLayers: number;
    } | undefined {
        const env = this.environments.get(envId);
        if (!env) return undefined;

        return {
            objects: env.objects.length,
            connections: env.objects.reduce((s, o) => s + o.connections.length, 0),
            interactions: env.interactions.length,
            visibleLayers: env.layers.filter(l => l.visible).length,
        };
    }
}

export const holographicCodeEnvironment = HolographicCodeEnvironment.getInstance();
