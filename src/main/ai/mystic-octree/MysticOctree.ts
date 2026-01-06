/**
 * Mystic Octree
 */
import { EventEmitter } from 'events';
export interface Point3D { x: number; y: number; z: number; }
export interface Bounds3D { x: number; y: number; z: number; width: number; height: number; depth: number; }
export class MysticOctree<T extends Point3D> extends EventEmitter {
    private bounds: Bounds3D;
    private capacity: number;
    private points: T[] = [];
    private divided = false;
    private children: MysticOctree<T>[] = [];
    constructor(bounds: Bounds3D, capacity: number = 8) { super(); this.bounds = bounds; this.capacity = capacity; }
    private contains(point: Point3D): boolean { return point.x >= this.bounds.x && point.x < this.bounds.x + this.bounds.width && point.y >= this.bounds.y && point.y < this.bounds.y + this.bounds.height && point.z >= this.bounds.z && point.z < this.bounds.z + this.bounds.depth; }
    private subdivide(): void { const { x, y, z, width, height, depth } = this.bounds; const hw = width / 2, hh = height / 2, hd = depth / 2; for (let i = 0; i < 8; i++) { const nx = x + (i & 1 ? hw : 0), ny = y + (i & 2 ? hh : 0), nz = z + (i & 4 ? hd : 0); this.children.push(new MysticOctree<T>({ x: nx, y: ny, z: nz, width: hw, height: hh, depth: hd }, this.capacity)); } this.divided = true; }
    insert(point: T): boolean { if (!this.contains(point)) return false; if (this.points.length < this.capacity) { this.points.push(point); return true; } if (!this.divided) this.subdivide(); for (const child of this.children) if (child.insert(point)) return true; return false; }
}
export const createOctree = <T extends Point3D>(bounds: Bounds3D, capacity?: number) => new MysticOctree<T>(bounds, capacity);
