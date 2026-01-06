/**
 * Dimensional Centroid Decomposition
 */
import { EventEmitter } from 'events';
export class DimensionalCentroidDecomp extends EventEmitter {
    private removed: boolean[];
    private subtreeSize: number[];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.removed = new Array(n).fill(false); this.subtreeSize = new Array(n).fill(0); }
    private getSubtreeSize(adj: number[][], v: number, p: number): number { this.subtreeSize[v] = 1; for (const u of adj[v]) if (u !== p && !this.removed[u]) this.subtreeSize[v] += this.getSubtreeSize(adj, u, v); return this.subtreeSize[v]; }
    private getCentroid(adj: number[][], v: number, p: number, treeSize: number): number { for (const u of adj[v]) if (u !== p && !this.removed[u] && this.subtreeSize[u] > treeSize / 2) return this.getCentroid(adj, u, v, treeSize); return v; }
    decompose(adj: number[][], v: number = 0): number[] { const centroids: number[] = []; const process = (node: number): void => { const treeSize = this.getSubtreeSize(adj, node, -1); const centroid = this.getCentroid(adj, node, -1, treeSize); centroids.push(centroid); this.removed[centroid] = true; for (const u of adj[centroid]) if (!this.removed[u]) process(u); }; process(v); return centroids; }
}
export const createCentroidDecomp = (n: number) => new DimensionalCentroidDecomp(n);
