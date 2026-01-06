/**
 * Cosmic R-Tree
 */
import { EventEmitter } from 'events';
export interface BoundingBox { minX: number; minY: number; maxX: number; maxY: number; data: unknown; }
export class CosmicRTree extends EventEmitter {
    private static instance: CosmicRTree;
    private boxes: BoundingBox[] = [];
    private constructor() { super(); }
    static getInstance(): CosmicRTree { if (!CosmicRTree.instance) { CosmicRTree.instance = new CosmicRTree(); } return CosmicRTree.instance; }
    insert(box: BoundingBox): void { this.boxes.push(box); }
    search(x: number, y: number): BoundingBox[] { return this.boxes.filter(b => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY); }
    getStats(): { size: number } { return { size: this.boxes.length }; }
}
export const cosmicRTree = CosmicRTree.getInstance();
