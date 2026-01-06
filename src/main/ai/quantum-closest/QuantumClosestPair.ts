/**
 * Quantum Closest Pair
 */
import { EventEmitter } from 'events';
export interface PointXY { x: number; y: number; }
export class QuantumClosestPair extends EventEmitter {
    private static instance: QuantumClosestPair;
    private constructor() { super(); }
    static getInstance(): QuantumClosestPair { if (!QuantumClosestPair.instance) { QuantumClosestPair.instance = new QuantumClosestPair(); } return QuantumClosestPair.instance; }
    private dist(p1: PointXY, p2: PointXY): number { return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2); }
    bruteForce(points: PointXY[]): { p1: PointXY; p2: PointXY; distance: number } { let minDist = Infinity; let p1: PointXY = points[0], p2: PointXY = points[1]; for (let i = 0; i < points.length; i++) { for (let j = i + 1; j < points.length; j++) { const d = this.dist(points[i], points[j]); if (d < minDist) { minDist = d; p1 = points[i]; p2 = points[j]; } } } return { p1, p2, distance: minDist }; }
    divideAndConquer(points: PointXY[]): { p1: PointXY; p2: PointXY; distance: number } { const px = [...points].sort((a, b) => a.x - b.x); const py = [...points].sort((a, b) => a.y - b.y); return this.closestUtil(px, py); }
    private closestUtil(px: PointXY[], py: PointXY[]): { p1: PointXY; p2: PointXY; distance: number } { const n = px.length; if (n <= 3) return this.bruteForce(px); const mid = Math.floor(n / 2); const midPoint = px[mid]; const pyl = py.filter(p => p.x <= midPoint.x); const pyr = py.filter(p => p.x > midPoint.x); const dl = this.closestUtil(px.slice(0, mid), pyl); const dr = this.closestUtil(px.slice(mid), pyr); let best = dl.distance < dr.distance ? dl : dr; const strip = py.filter(p => Math.abs(p.x - midPoint.x) < best.distance); for (let i = 0; i < strip.length; i++) { for (let j = i + 1; j < strip.length && strip[j].y - strip[i].y < best.distance; j++) { const d = this.dist(strip[i], strip[j]); if (d < best.distance) best = { p1: strip[i], p2: strip[j], distance: d }; } } return best; }
}
export const quantumClosestPair = QuantumClosestPair.getInstance();
