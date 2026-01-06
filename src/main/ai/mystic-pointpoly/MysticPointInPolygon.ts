/**
 * Mystic Point in Polygon
 */
import { EventEmitter } from 'events';
export interface Point { x: number; y: number; }
export class MysticPointInPolygon extends EventEmitter {
    private static instance: MysticPointInPolygon;
    private constructor() { super(); }
    static getInstance(): MysticPointInPolygon { if (!MysticPointInPolygon.instance) { MysticPointInPolygon.instance = new MysticPointInPolygon(); } return MysticPointInPolygon.instance; }
    isInside(point: Point, polygon: Point[]): boolean { const n = polygon.length; let inside = false; for (let i = 0, j = n - 1; i < n; j = i++) { const xi = polygon[i].x, yi = polygon[i].y; const xj = polygon[j].x, yj = polygon[j].y; if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) inside = !inside; } return inside; }
    windingNumber(point: Point, polygon: Point[]): number { let winding = 0; const n = polygon.length; for (let i = 0; i < n; i++) { const p1 = polygon[i]; const p2 = polygon[(i + 1) % n]; if (p1.y <= point.y) { if (p2.y > point.y && this.isLeft(p1, p2, point) > 0) winding++; } else { if (p2.y <= point.y && this.isLeft(p1, p2, point) < 0) winding--; } } return winding; }
    private isLeft(p0: Point, p1: Point, p2: Point): number { return (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y); }
    isOnBoundary(point: Point, polygon: Point[], epsilon: number = 1e-9): boolean { const n = polygon.length; for (let i = 0; i < n; i++) { const p1 = polygon[i]; const p2 = polygon[(i + 1) % n]; if (this.onSegment(p1, p2, point, epsilon)) return true; } return false; }
    private onSegment(p1: Point, p2: Point, q: Point, eps: number): boolean { const cross = Math.abs((q.y - p1.y) * (p2.x - p1.x) - (q.x - p1.x) * (p2.y - p1.y)); const dot = (q.x - p1.x) * (p2.x - p1.x) + (q.y - p1.y) * (p2.y - p1.y); const lenSq = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2; return cross < eps && dot >= 0 && dot <= lenSq; }
}
export const mysticPointInPolygon = MysticPointInPolygon.getInstance();
