/**
 * Quantum Lowest Common Ancestor
 */
import { EventEmitter } from 'events';
export class QuantumLCA extends EventEmitter {
    private parent: number[][];
    private depth: number[];
    private logn: number;
    private n: number;
    constructor(adj: number[][], root: number = 0) { super(); this.n = adj.length; this.logn = Math.ceil(Math.log2(this.n)) + 1; this.parent = Array.from({ length: this.logn }, () => new Array(this.n).fill(-1)); this.depth = new Array(this.n).fill(0); this.dfs(adj, root, -1, 0); for (let j = 1; j < this.logn; j++) for (let i = 0; i < this.n; i++) if (this.parent[j - 1][i] !== -1) this.parent[j][i] = this.parent[j - 1][this.parent[j - 1][i]]; }
    private dfs(adj: number[][], u: number, p: number, d: number): void { this.parent[0][u] = p; this.depth[u] = d; for (const v of adj[u]) if (v !== p) this.dfs(adj, v, u, d + 1); }
    lca(u: number, v: number): number { if (this.depth[u] < this.depth[v]) [u, v] = [v, u]; let diff = this.depth[u] - this.depth[v]; for (let j = 0; j < this.logn; j++) if ((diff >> j) & 1) u = this.parent[j][u]; if (u === v) return u; for (let j = this.logn - 1; j >= 0; j--) if (this.parent[j][u] !== this.parent[j][v]) { u = this.parent[j][u]; v = this.parent[j][v]; } return this.parent[0][u]; }
    distance(u: number, v: number): number { return this.depth[u] + this.depth[v] - 2 * this.depth[this.lca(u, v)]; }
}
export const createLCA = (adj: number[][], root?: number) => new QuantumLCA(adj, root);
