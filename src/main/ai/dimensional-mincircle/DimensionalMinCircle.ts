/**
 * Dimensional Min Enclosing Circle
 */
import { EventEmitter } from 'events';
export interface CirclePoint { x: number; y: number; }
export interface Circle { center: CirclePoint; radius: number; }
export class DimensionalMinCircle extends EventEmitter {
    private static instance: DimensionalMinCircle;
    private constructor() { super(); }
    static getInstance(): DimensionalMinCircle { if (!DimensionalMinCircle.instance) { DimensionalMinCircle.instance = new DimensionalMinCircle(); } return DimensionalMinCircle.instance; }
    private dist(p1: CirclePoint, p2: CirclePoint): number { return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2); }
    private isInside(c: Circle, p: CirclePoint): boolean { return this.dist(c.center, p) <= c.radius + 1e-9; }
    private circleFrom2(p1: CirclePoint, p2: CirclePoint): Circle { const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; return { center, radius: this.dist(p1, p2) / 2 }; }
    private circleFrom3(p1: CirclePoint, p2: CirclePoint, p3: CirclePoint): Circle { const ax = p2.x - p1.x, ay = p2.y - p1.y; const bx = p3.x - p1.x, by = p3.y - p1.y; const d = 2 * (ax * by - ay * bx); if (Math.abs(d) < 1e-9) return { center: p1, radius: Infinity }; const ux = (by * (ax ** 2 + ay ** 2) - ay * (bx ** 2 + by ** 2)) / d; const uy = (ax * (bx ** 2 + by ** 2) - bx * (ax ** 2 + ay ** 2)) / d; const center = { x: p1.x + ux, y: p1.y + uy }; return { center, radius: Math.sqrt(ux ** 2 + uy ** 2) }; }
    private minCircleTrivial(boundary: CirclePoint[]): Circle { if (boundary.length === 0) return { center: { x: 0, y: 0 }, radius: 0 }; if (boundary.length === 1) return { center: boundary[0], radius: 0 }; if (boundary.length === 2) return this.circleFrom2(boundary[0], boundary[1]); return this.circleFrom3(boundary[0], boundary[1], boundary[2]); }
    welzl(points: CirclePoint[]): Circle { const shuffled = [...points].sort(() => Math.random() - 0.5); const minCircle = (p: CirclePoint[], boundary: CirclePoint[]): Circle => { if (p.length === 0 || boundary.length === 3) return this.minCircleTrivial(boundary); const point = p[p.length - 1]; const rest = p.slice(0, -1); const circle = minCircle(rest, boundary); if (this.isInside(circle, point)) return circle; return minCircle(rest, [...boundary, point]); }; return minCircle(shuffled, []); }
}
export const dimensionalMinCircle = DimensionalMinCircle.getInstance();
