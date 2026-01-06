/**
 * Cosmic Euler Tour Tree
 */
import { EventEmitter } from 'events';
export class CosmicEulerTourTree extends EventEmitter {
    private tour: number[] = [];
    private first: number[] = [];
    private last: number[] = [];
    private depth: number[] = [];
    private n: number;
    constructor(adj: number[][], root: number = 0) { super(); this.n = adj.length; this.first = new Array(this.n).fill(-1); this.last = new Array(this.n).fill(-1); this.buildTour(adj, root, -1, 0); }
    private buildTour(adj: number[][], u: number, parent: number, d: number): void { this.first[u] = this.tour.length; this.tour.push(u); this.depth.push(d); for (const v of adj[u]) { if (v !== parent) { this.buildTour(adj, v, u, d + 1); this.tour.push(u); this.depth.push(d); } } this.last[u] = this.tour.length - 1; }
    getTour(): number[] { return this.tour; }
    getFirst(u: number): number { return this.first[u]; }
    getLast(u: number): number { return this.last[u]; }
    isAncestor(u: number, v: number): boolean { return this.first[u] <= this.first[v] && this.last[v] <= this.last[u]; }
    subtreeSize(u: number): number { return Math.floor((this.last[u] - this.first[u]) / 2) + 1; }
    lca(u: number, v: number): number { let l = Math.min(this.first[u], this.first[v]); let r = Math.max(this.first[u], this.first[v]); let minDepth = Infinity; let lcaNode = u; for (let i = l; i <= r; i++) { if (this.depth[i] < minDepth) { minDepth = this.depth[i]; lcaNode = this.tour[i]; } } return lcaNode; }
}
export const createEulerTourTree = (adj: number[][], root?: number) => new CosmicEulerTourTree(adj, root);
