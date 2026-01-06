/**
 * Astral T-Digest
 */
import { EventEmitter } from 'events';
interface Centroid { mean: number; count: number; }
export class AstralTDigest extends EventEmitter {
    private centroids: Centroid[] = [];
    private delta: number;
    private n: number = 0;
    constructor(delta: number = 100) { super(); this.delta = delta; }
    add(value: number, count: number = 1): void { this.centroids.push({ mean: value, count }); this.n += count; if (this.centroids.length > this.delta * 10) this.compress(); }
    private compress(): void { this.centroids.sort((a, b) => a.mean - b.mean); const merged: Centroid[] = []; let cumCount = 0; for (const c of this.centroids) { if (merged.length === 0) { merged.push({ ...c }); cumCount = c.count; } else { const last = merged[merged.length - 1]; const q0 = (cumCount - last.count / 2) / this.n; const q1 = (cumCount + c.count / 2) / this.n; const maxCount = 4 * this.n * Math.min(q0 * (1 - q0), q1 * (1 - q1)) / this.delta; if (last.count + c.count <= maxCount) { last.mean = (last.mean * last.count + c.mean * c.count) / (last.count + c.count); last.count += c.count; } else { merged.push({ ...c }); } cumCount += c.count; } } this.centroids = merged; }
    quantile(q: number): number { this.compress(); if (this.centroids.length === 0) return NaN; const target = q * this.n; let cumCount = 0; for (const c of this.centroids) { if (cumCount + c.count >= target) return c.mean; cumCount += c.count; } return this.centroids[this.centroids.length - 1].mean; }
    median(): number { return this.quantile(0.5); }
    percentile(p: number): number { return this.quantile(p / 100); }
}
export const createTDigest = (delta?: number) => new AstralTDigest(delta);
