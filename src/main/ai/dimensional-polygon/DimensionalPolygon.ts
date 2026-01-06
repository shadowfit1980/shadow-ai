/**
 * Dimensional Polygon
 */
import { EventEmitter } from 'events';
export interface Point { x: number; y: number; }
export class DimensionalPolygon extends EventEmitter {
    private static instance: DimensionalPolygon;
    private constructor() { super(); }
    static getInstance(): DimensionalPolygon { if (!DimensionalPolygon.instance) { DimensionalPolygon.instance = new DimensionalPolygon(); } return DimensionalPolygon.instance; }
    area(points: Point[]): number { let area = 0; for (let i = 0; i < points.length; i++) { const j = (i + 1) % points.length; area += points[i].x * points[j].y - points[j].x * points[i].y; } return Math.abs(area) / 2; }
    perimeter(points: Point[]): number { let perimeter = 0; for (let i = 0; i < points.length; i++) { const j = (i + 1) % points.length; perimeter += Math.sqrt((points[j].x - points[i].x) ** 2 + (points[j].y - points[i].y) ** 2); } return perimeter; }
    centroid(points: Point[]): Point { const n = points.length; const x = points.reduce((sum, p) => sum + p.x, 0) / n; const y = points.reduce((sum, p) => sum + p.y, 0) / n; return { x, y }; }
    getStats(): { calculated: number } { return { calculated: 0 }; }
}
export const dimensionalPolygon = DimensionalPolygon.getInstance();
