/**
 * 🎨 Visual Game Designer
 * 
 * Visual editor data structures and operations:
 * - Entity placement
 * - Properties editing
 * - Layer management
 * - Export to code
 */

import { EventEmitter } from 'events';

export interface Vector2 { x: number; y: number; }
export interface Size { width: number; height: number; }
export interface Color { r: number; g: number; b: number; a: number; }

export interface DesignerEntity {
    id: string;
    type: 'sprite' | 'collider' | 'trigger' | 'spawner' | 'text' | 'path';
    name: string;
    position: Vector2;
    size: Size;
    rotation: number;
    layer: number;
    properties: Record<string, any>;
    children?: string[];
}

export interface DesignerLayer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    order: number;
}

export interface DesignerScene {
    id: string;
    name: string;
    size: Size;
    backgroundColor: string;
    layers: DesignerLayer[];
    entities: DesignerEntity[];
    grid: { enabled: boolean; size: number };
}

export interface DesignerProject {
    name: string;
    scenes: DesignerScene[];
    assets: { id: string; path: string; type: string }[];
    settings: Record<string, any>;
}

export class VisualGameDesigner extends EventEmitter {
    private static instance: VisualGameDesigner;
    private project: DesignerProject | null = null;
    private currentScene: string | null = null;
    private selectedEntities: Set<string> = new Set();
    private clipboard: DesignerEntity[] = [];
    private history: { scenes: DesignerScene[]; index: number } = { scenes: [], index: -1 };

    private constructor() { super(); }

    static getInstance(): VisualGameDesigner {
        if (!VisualGameDesigner.instance) {
            VisualGameDesigner.instance = new VisualGameDesigner();
        }
        return VisualGameDesigner.instance;
    }

    // ========================================================================
    // PROJECT MANAGEMENT
    // ========================================================================

    createProject(name: string): DesignerProject {
        this.project = {
            name,
            scenes: [],
            assets: [],
            settings: {}
        };
        this.createScene('Main');
        this.emit('projectCreated', this.project);
        return this.project;
    }

    getProject(): DesignerProject | null {
        return this.project;
    }

    // ========================================================================
    // SCENE MANAGEMENT
    // ========================================================================

    createScene(name: string): DesignerScene {
        const scene: DesignerScene = {
            id: `scene_${Date.now()}`,
            name,
            size: { width: 800, height: 600 },
            backgroundColor: '#1a1a2e',
            layers: [
                { id: 'layer_bg', name: 'Background', visible: true, locked: false, order: 0 },
                { id: 'layer_main', name: 'Main', visible: true, locked: false, order: 1 },
                { id: 'layer_fg', name: 'Foreground', visible: true, locked: false, order: 2 }
            ],
            entities: [],
            grid: { enabled: true, size: 32 }
        };

        this.project?.scenes.push(scene);
        this.currentScene = scene.id;
        this.saveHistory();
        this.emit('sceneCreated', scene);
        return scene;
    }

    getCurrentScene(): DesignerScene | undefined {
        return this.project?.scenes.find(s => s.id === this.currentScene);
    }

    // ========================================================================
    // ENTITY OPERATIONS
    // ========================================================================

    addEntity(entity: Partial<DesignerEntity>): DesignerEntity {
        const scene = this.getCurrentScene();
        if (!scene) throw new Error('No scene selected');

        const newEntity: DesignerEntity = {
            id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: entity.type || 'sprite',
            name: entity.name || `${entity.type || 'Entity'}`,
            position: entity.position || { x: 0, y: 0 },
            size: entity.size || { width: 32, height: 32 },
            rotation: entity.rotation || 0,
            layer: entity.layer || 1,
            properties: entity.properties || {},
            ...entity
        };

        scene.entities.push(newEntity);
        this.saveHistory();
        this.emit('entityAdded', newEntity);
        return newEntity;
    }

    updateEntity(id: string, updates: Partial<DesignerEntity>): void {
        const scene = this.getCurrentScene();
        const entity = scene?.entities.find(e => e.id === id);
        if (entity) {
            Object.assign(entity, updates);
            this.saveHistory();
            this.emit('entityUpdated', entity);
        }
    }

    deleteEntity(id: string): void {
        const scene = this.getCurrentScene();
        if (scene) {
            scene.entities = scene.entities.filter(e => e.id !== id);
            this.selectedEntities.delete(id);
            this.saveHistory();
            this.emit('entityDeleted', id);
        }
    }

    moveEntity(id: string, dx: number, dy: number, snap: boolean = false): void {
        const scene = this.getCurrentScene();
        const entity = scene?.entities.find(e => e.id === id);
        if (entity) {
            entity.position.x += dx;
            entity.position.y += dy;

            if (snap && scene?.grid.enabled) {
                const gridSize = scene.grid.size;
                entity.position.x = Math.round(entity.position.x / gridSize) * gridSize;
                entity.position.y = Math.round(entity.position.y / gridSize) * gridSize;
            }

            this.emit('entityMoved', entity);
        }
    }

    // ========================================================================
    // SELECTION
    // ========================================================================

    select(id: string, addToSelection: boolean = false): void {
        if (!addToSelection) {
            this.selectedEntities.clear();
        }
        this.selectedEntities.add(id);
        this.emit('selectionChanged', Array.from(this.selectedEntities));
    }

    deselect(id: string): void {
        this.selectedEntities.delete(id);
        this.emit('selectionChanged', Array.from(this.selectedEntities));
    }

    selectAll(): void {
        const scene = this.getCurrentScene();
        scene?.entities.forEach(e => this.selectedEntities.add(e.id));
        this.emit('selectionChanged', Array.from(this.selectedEntities));
    }

    getSelectedEntities(): DesignerEntity[] {
        const scene = this.getCurrentScene();
        return scene?.entities.filter(e => this.selectedEntities.has(e.id)) || [];
    }

    // ========================================================================
    // CLIPBOARD
    // ========================================================================

    copy(): void {
        this.clipboard = this.getSelectedEntities().map(e => ({ ...e }));
        this.emit('copied', this.clipboard.length);
    }

    paste(offset: Vector2 = { x: 20, y: 20 }): DesignerEntity[] {
        const pasted: DesignerEntity[] = [];
        this.clipboard.forEach(e => {
            pasted.push(this.addEntity({
                ...e,
                id: undefined,
                position: { x: e.position.x + offset.x, y: e.position.y + offset.y }
            }));
        });
        return pasted;
    }

    // ========================================================================
    // HISTORY (UNDO/REDO)
    // ========================================================================

    private saveHistory(): void {
        const scene = this.getCurrentScene();
        if (scene) {
            // Truncate future history
            this.history.scenes = this.history.scenes.slice(0, this.history.index + 1);
            this.history.scenes.push(JSON.parse(JSON.stringify(scene)));
            this.history.index++;

            // Limit history size
            if (this.history.scenes.length > 50) {
                this.history.scenes.shift();
                this.history.index--;
            }
        }
    }

    undo(): void {
        if (this.history.index > 0) {
            this.history.index--;
            this.restoreFromHistory();
        }
    }

    redo(): void {
        if (this.history.index < this.history.scenes.length - 1) {
            this.history.index++;
            this.restoreFromHistory();
        }
    }

    private restoreFromHistory(): void {
        const scene = this.history.scenes[this.history.index];
        if (scene && this.project) {
            const idx = this.project.scenes.findIndex(s => s.id === scene.id);
            if (idx !== -1) {
                this.project.scenes[idx] = JSON.parse(JSON.stringify(scene));
                this.emit('sceneRestored', scene);
            }
        }
    }

    // ========================================================================
    // EXPORT TO CODE
    // ========================================================================

    exportToPhaser(): string {
        const scene = this.getCurrentScene();
        if (!scene) return '';

        const sprites = scene.entities.filter(e => e.type === 'sprite');
        const colliders = scene.entities.filter(e => e.type === 'collider');
        const triggers = scene.entities.filter(e => e.type === 'trigger');

        return `
import Phaser from 'phaser';

export class ${scene.name.replace(/\s/g, '')}Scene extends Phaser.Scene {
    constructor() {
        super('${scene.name}');
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor('${scene.backgroundColor}');

${sprites.map(s => `
        // ${s.name}
        this.add.sprite(${s.position.x}, ${s.position.y}, '${s.properties.texture || 'default'}')
            .setDisplaySize(${s.size.width}, ${s.size.height})
            .setAngle(${s.rotation});`).join('\n')}

${colliders.map(c => `
        // ${c.name} (Collider)
        const ${c.name.replace(/\s/g, '_')} = this.add.rectangle(${c.position.x}, ${c.position.y}, ${c.size.width}, ${c.size.height}, 0x000000, 0);
        this.physics.add.existing(${c.name.replace(/\s/g, '_')}, true);`).join('\n')}

${triggers.map(t => `
        // ${t.name} (Trigger Zone)
        const ${t.name.replace(/\s/g, '_')} = this.add.zone(${t.position.x}, ${t.position.y}, ${t.size.width}, ${t.size.height});
        this.physics.add.existing(${t.name.replace(/\s/g, '_')});`).join('\n')}
    }
}
`.trim();
    }

    exportToJSON(): string {
        const scene = this.getCurrentScene();
        return JSON.stringify(scene, null, 2);
    }
}

export const visualGameDesigner = VisualGameDesigner.getInstance();
