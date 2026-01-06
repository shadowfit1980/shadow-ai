/**
 * Astral Line Intersection
 */
import { EventEmitter } from 'events';
export interface Point2 { x: number; y: number; }
export interface Line { p1: Point2; p2: Point2; }
export class AstralLineIntersection extends EventEmitter {
    private static instance: AstralLineIntersection;
    private constructor() { super(); }
    static getInstance(): AstralLineIntersection { if (!AstralLineIntersection.instance) { AstralLineIntersection.instance = new AstralLineIntersection(); } return AstralLineIntersection.instance; }
    lineIntersection(l1: Line, l2: Line): Point2 | null { const a1 = l1.p2.y - l1.p1.y; const b1 = l1.p1.x - l1.p2.x; const c1 = a1 * l1.p1.x + b1 * l1.p1.y; const a2 = l2.p2.y - l2.p1.y; const b2 = l2.p1.x - l2.p2.x; const c2 = a2 * l2.p1.x + b2 * l2.p1.y; const det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-9) return null; const x = (b2 * c1 - b1 * c2) / det; const y = (a1 * c2 - a2 * c1) / det; return { x, y }; }
    segmentIntersection(l1: Line, l2: Line): Point2 | null { const intersection = this.lineIntersection(l1, l2); if (!intersection) return null; if (this.onSegment(l1, intersection) && this.onSegment(l2, intersection)) return intersection; return null; }
    private onSegment(line: Line, point: Point2): boolean { const minX = Math.min(line.p1.x, line.p2.x); const maxX = Math.max(line.p1.x, line.p2.x); const minY = Math.min(line.p1.y, line.p2.y); const maxY = Math.max(line.p1.y, line.p2.y); return point.x >= minX - 1e-9 && point.x <= maxX + 1e-9 && point.y >= minY - 1e-9 && point.y <= maxY + 1e-9; }
    segmentsIntersect(l1: Line, l2: Line): boolean { const d1 = this.direction(l2.p1, l2.p2, l1.p1); const d2 = this.direction(l2.p1, l2.p2, l1.p2); const d3 = this.direction(l1.p1, l1.p2, l2.p1); const d4 = this.direction(l1.p1, l1.p2, l2.p2); if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true; if (d1 === 0 && this.onBoundingBox(l2, l1.p1)) return true; if (d2 === 0 && this.onBoundingBox(l2, l1.p2)) return true; if (d3 === 0 && this.onBoundingBox(l1, l2.p1)) return true; if (d4 === 0 && this.onBoundingBox(l1, l2.p2)) return true; return false; }
    private direction(p1: Point2, p2: Point2, p3: Point2): number { return (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y); }
    private onBoundingBox(line: Line, point: Point2): boolean { return point.x >= Math.min(line.p1.x, line.p2.x) && point.x <= Math.max(line.p1.x, line.p2.x) && point.y >= Math.min(line.p1.y, line.p2.y) && point.y <= Math.max(line.p1.y, line.p2.y); }
}
export const astralLineIntersection = AstralLineIntersection.getInstance();
