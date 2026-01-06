/**
 * Mystic Rotating Calipers
 */
import { EventEmitter } from 'events';
export interface CaliperPoint { x: number; y: number; }
export class MysticRotatingCalipers extends EventEmitter {
    private static instance: MysticRotatingCalipers;
    private constructor() { super(); }
    static getInstance(): MysticRotatingCalipers { if (!MysticRotatingCalipers.instance) { MysticRotatingCalipers.instance = new MysticRotatingCalipers(); } return MysticRotatingCalipers.instance; }
    private cross(o: CaliperPoint, a: CaliperPoint, b: CaliperPoint): number { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    private dist(a: CaliperPoint, b: CaliperPoint): number { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
    convexHull(points: CaliperPoint[]): CaliperPoint[] { if (points.length < 3) return points; const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y); const lower: CaliperPoint[] = []; for (const p of sorted) { while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); } const upper: CaliperPoint[] = []; for (let i = sorted.length - 1; i >= 0; i--) { const p = sorted[i]; while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); } lower.pop(); upper.pop(); return lower.concat(upper); }
    diameter(hull: CaliperPoint[]): { p1: CaliperPoint; p2: CaliperPoint; distance: number } { if (hull.length < 2) return { p1: hull[0], p2: hull[0], distance: 0 }; const n = hull.length; let maxDist = 0; let best = { p1: hull[0], p2: hull[1], distance: 0 }; let j = 1; for (let i = 0; i < n; i++) { const nextI = (i + 1) % n; while (true) { const nextJ = (j + 1) % n; const area1 = Math.abs(this.cross(hull[i], hull[nextI], hull[j])); const area2 = Math.abs(this.cross(hull[i], hull[nextI], hull[nextJ])); if (area2 > area1) j = nextJ; else break; } const d = this.dist(hull[i], hull[j]); if (d > maxDist) { maxDist = d; best = { p1: hull[i], p2: hull[j], distance: d }; } } return best; }
    minWidth(hull: CaliperPoint[]): number { if (hull.length < 3) return 0; const n = hull.length; let minWidth = Infinity; let j = 1; for (let i = 0; i < n; i++) { const nextI = (i + 1) % n; while (true) { const nextJ = (j + 1) % n; const area1 = Math.abs(this.cross(hull[i], hull[nextI], hull[j])); const area2 = Math.abs(this.cross(hull[i], hull[nextI], hull[nextJ])); if (area2 > area1) j = nextJ; else break; } const baseLen = this.dist(hull[i], hull[nextI]); const height = Math.abs(this.cross(hull[i], hull[nextI], hull[j])) / baseLen; minWidth = Math.min(minWidth, height); } return minWidth; }
}
export const mysticRotatingCalipers = MysticRotatingCalipers.getInstance();
