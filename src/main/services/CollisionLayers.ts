/**
 * 🧱 Collision Layers
 * 
 * Physics layer management:
 * - Layer definitions
 * - Collision matrix
 * - Filtering
 */

import { EventEmitter } from 'events';

export interface CollisionLayer {
    id: number;
    name: string;
    collidesWithMask: number;
}

export class CollisionLayers extends EventEmitter {
    private static instance: CollisionLayers;
    private layers: Map<string, CollisionLayer> = new Map();

    private constructor() {
        super();
        this.initializeDefaultLayers();
    }

    static getInstance(): CollisionLayers {
        if (!CollisionLayers.instance) {
            CollisionLayers.instance = new CollisionLayers();
        }
        return CollisionLayers.instance;
    }

    private initializeDefaultLayers(): void {
        // Define standard layers
        const layerDefs = [
            { name: 'default', id: 1 },
            { name: 'player', id: 2 },
            { name: 'enemy', id: 4 },
            { name: 'playerBullet', id: 8 },
            { name: 'enemyBullet', id: 16 },
            { name: 'pickup', id: 32 },
            { name: 'platform', id: 64 },
            { name: 'trigger', id: 128 }
        ];

        layerDefs.forEach(def => {
            this.layers.set(def.name, {
                ...def,
                collidesWithMask: 0xFFFFFFFF // Collides with all by default
            });
        });

        // Set up typical collision matrix
        this.setCollision('player', 'enemy', true);
        this.setCollision('player', 'enemyBullet', true);
        this.setCollision('player', 'pickup', true);
        this.setCollision('player', 'platform', true);
        this.setCollision('enemy', 'playerBullet', true);
        this.setCollision('enemy', 'platform', true);

        // Prevent friendly fire
        this.setCollision('player', 'playerBullet', false);
        this.setCollision('enemy', 'enemyBullet', false);
    }

    getLayer(name: string): CollisionLayer | undefined {
        return this.layers.get(name);
    }

    setCollision(layer1: string, layer2: string, collides: boolean): void {
        const l1 = this.layers.get(layer1);
        const l2 = this.layers.get(layer2);
        if (!l1 || !l2) return;

        if (collides) {
            l1.collidesWithMask |= l2.id;
            l2.collidesWithMask |= l1.id;
        } else {
            l1.collidesWithMask &= ~l2.id;
            l2.collidesWithMask &= ~l1.id;
        }
    }

    generateCollisionCode(): string {
        return `
class CollisionSystem {
    constructor() {
        this.layers = new Map();
        this.nextId = 1;
        
        this.setupDefaultLayers();
    }

    setupDefaultLayers() {
        this.addLayer('default');
        this.addLayer('player');
        this.addLayer('enemy');
        this.addLayer('playerBullet');
        this.addLayer('enemyBullet');
        this.addLayer('pickup');
        this.addLayer('platform');
        this.addLayer('trigger');

        // Set up collision matrix
        this.setCollides('player', 'enemy', true);
        this.setCollides('player', 'enemyBullet', true);
        this.setCollides('player', 'pickup', true);
        this.setCollides('player', 'platform', true);
        this.setCollides('enemy', 'playerBullet', true);
        this.setCollides('enemy', 'platform', true);

        // No friendly fire
        this.setCollides('player', 'playerBullet', false);
        this.setCollides('enemy', 'enemyBullet', false);
    }

    addLayer(name) {
        const id = this.nextId;
        this.nextId <<= 1;
        this.layers.set(name, {
            id,
            name,
            mask: 0xFFFFFFFF // Collides with all by default
        });
        return id;
    }

    getLayerId(name) {
        return this.layers.get(name)?.id || 0;
    }

    setCollides(layer1, layer2, collides) {
        const l1 = this.layers.get(layer1);
        const l2 = this.layers.get(layer2);
        if (!l1 || !l2) return;

        if (collides) {
            l1.mask |= l2.id;
            l2.mask |= l1.id;
        } else {
            l1.mask &= ~l2.id;
            l2.mask &= ~l1.id;
        }
    }

    canCollide(layerName1, layerName2) {
        const l1 = this.layers.get(layerName1);
        const l2 = this.layers.get(layerName2);
        if (!l1 || !l2) return false;
        return (l1.mask & l2.id) !== 0;
    }

    canCollideById(id1, id2) {
        for (const layer of this.layers.values()) {
            if (layer.id === id1) {
                return (layer.mask & id2) !== 0;
            }
        }
        return false;
    }

    // Check collision between two entities
    checkCollision(entity1, entity2) {
        // Layer check first (fast rejection)
        if (!this.canCollide(entity1.layer, entity2.layer)) {
            return false;
        }

        // AABB collision
        return this.aabb(entity1, entity2);
    }

    aabb(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    // Check entity against all in a group
    checkAgainst(entity, group) {
        const collisions = [];
        
        for (const other of group) {
            if (entity === other) continue;
            if (this.checkCollision(entity, other)) {
                collisions.push(other);
            }
        }

        return collisions;
    }

    // Spatial partitioning for large entity counts
    createGrid(width, height, cellSize) {
        return new SpatialGrid(width, height, cellSize);
    }
}

class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
    }

    clear() {
        this.cells.forEach(cell => cell.length = 0);
    }

    insert(entity) {
        const minCol = Math.floor(entity.x / this.cellSize);
        const maxCol = Math.floor((entity.x + entity.width) / this.cellSize);
        const minRow = Math.floor(entity.y / this.cellSize);
        const maxRow = Math.floor((entity.y + entity.height) / this.cellSize);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    this.cells[row * this.cols + col].push(entity);
                }
            }
        }
    }

    query(x, y, width, height) {
        const results = new Set();
        const minCol = Math.floor(x / this.cellSize);
        const maxCol = Math.floor((x + width) / this.cellSize);
        const minRow = Math.floor(y / this.cellSize);
        const maxRow = Math.floor((y + height) / this.cellSize);

        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                    for (const entity of this.cells[row * this.cols + col]) {
                        results.add(entity);
                    }
                }
            }
        }

        return Array.from(results);
    }
}`;
    }

    getLayers(): CollisionLayer[] {
        return Array.from(this.layers.values());
    }
}

export const collisionLayers = CollisionLayers.getInstance();
