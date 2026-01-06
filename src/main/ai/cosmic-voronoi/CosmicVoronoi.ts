/**
 * Cosmic Voronoi
 */
import { EventEmitter } from 'events';
export interface VoronoiPoint { x: number; y: number; }
export interface VoronoiEdge { p1: VoronoiPoint; p2: VoronoiPoint; }
export class CosmicVoronoi extends EventEmitter {
    private static instance: CosmicVoronoi;
    private constructor() { super(); }
    static getInstance(): CosmicVoronoi { if (!CosmicVoronoi.instance) { CosmicVoronoi.instance = new CosmicVoronoi(); } return CosmicVoronoi.instance; }
    nearestNeighbor(query: VoronoiPoint, points: VoronoiPoint[]): VoronoiPoint { let minDist = Infinity; let nearest = points[0]; for (const p of points) { const d = Math.sqrt((query.x - p.x) ** 2 + (query.y - p.y) ** 2); if (d < minDist) { minDist = d; nearest = p; } } return nearest; }
    circumcenter(p1: VoronoiPoint, p2: VoronoiPoint, p3: VoronoiPoint): VoronoiPoint | null { const ax = p1.x, ay = p1.y; const bx = p2.x, by = p2.y; const cx = p3.x, cy = p3.y; const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)); if (Math.abs(d) < 1e-9) return null; const x = ((ax ** 2 + ay ** 2) * (by - cy) + (bx ** 2 + by ** 2) * (cy - ay) + (cx ** 2 + cy ** 2) * (ay - by)) / d; const y = ((ax ** 2 + ay ** 2) * (cx - bx) + (bx ** 2 + by ** 2) * (ax - cx) + (cx ** 2 + cy ** 2) * (bx - ax)) / d; return { x, y }; }
    perpBisector(p1: VoronoiPoint, p2: VoronoiPoint): { midpoint: VoronoiPoint; direction: VoronoiPoint } { const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; const direction = { x: -(p2.y - p1.y), y: p2.x - p1.x }; return { midpoint, direction }; }
    delaunayTriangles(points: VoronoiPoint[]): [number, number, number][] { const n = points.length; if (n < 3) return []; const triangles: [number, number, number][] = []; for (let i = 0; i < n - 2; i++) { for (let j = i + 1; j < n - 1; j++) { for (let k = j + 1; k < n; k++) { if (this.isDelaunay(points, i, j, k)) triangles.push([i, j, k]); } } } return triangles; }
    private isDelaunay(points: VoronoiPoint[], i: number, j: number, k: number): boolean { const cc = this.circumcenter(points[i], points[j], points[k]); if (!cc) return false; const r = Math.sqrt((points[i].x - cc.x) ** 2 + (points[i].y - cc.y) ** 2); for (let l = 0; l < points.length; l++) { if (l === i || l === j || l === k) continue; const d = Math.sqrt((points[l].x - cc.x) ** 2 + (points[l].y - cc.y) ** 2); if (d < r - 1e-9) return false; } return true; }
}
export const cosmicVoronoi = CosmicVoronoi.getInstance();
