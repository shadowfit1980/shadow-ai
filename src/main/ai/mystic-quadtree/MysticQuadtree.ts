/**
 * Mystic Quadtree
 */
import { EventEmitter } from 'events';
export interface Point { x: number; y: number; }
export interface Bounds { x: number; y: number; width: number; height: number; }
export class MysticQuadtree<T extends Point> extends EventEmitter {
    private bounds: Bounds;
    private capacity: number;
    private points: T[] = [];
    private divided = false;
    private nw: MysticQuadtree<T> | null = null;
    private ne: MysticQuadtree<T> | null = null;
    private sw: MysticQuadtree<T> | null = null;
    private se: MysticQuadtree<T> | null = null;
    constructor(bounds: Bounds, capacity: number = 4) { super(); this.bounds = bounds; this.capacity = capacity; }
    private contains(point: Point): boolean { return point.x >= this.bounds.x && point.x < this.bounds.x + this.bounds.width && point.y >= this.bounds.y && point.y < this.bounds.y + this.bounds.height; }
    private subdivide(): void { const { x, y, width, height } = this.bounds; const hw = width / 2, hh = height / 2; this.nw = new MysticQuadtree<T>({ x, y, width: hw, height: hh }, this.capacity); this.ne = new MysticQuadtree<T>({ x: x + hw, y, width: hw, height: hh }, this.capacity); this.sw = new MysticQuadtree<T>({ x, y: y + hh, width: hw, height: hh }, this.capacity); this.se = new MysticQuadtree<T>({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity); this.divided = true; }
    insert(point: T): boolean { if (!this.contains(point)) return false; if (this.points.length < this.capacity) { this.points.push(point); return true; } if (!this.divided) this.subdivide(); return this.nw!.insert(point) || this.ne!.insert(point) || this.sw!.insert(point) || this.se!.insert(point); }
    query(range: Bounds): T[] { const found: T[] = []; if (!this.intersects(range)) return found; for (const p of this.points) if (this.pointInRange(p, range)) found.push(p); if (this.divided) { found.push(...this.nw!.query(range), ...this.ne!.query(range), ...this.sw!.query(range), ...this.se!.query(range)); } return found; }
    private intersects(range: Bounds): boolean { return !(range.x > this.bounds.x + this.bounds.width || range.x + range.width < this.bounds.x || range.y > this.bounds.y + this.bounds.height || range.y + range.height < this.bounds.y); }
    private pointInRange(p: Point, range: Bounds): boolean { return p.x >= range.x && p.x < range.x + range.width && p.y >= range.y && p.y < range.y + range.height; }
}
export const createQuadtree = <T extends Point>(bounds: Bounds, capacity?: number) => new MysticQuadtree<T>(bounds, capacity);
