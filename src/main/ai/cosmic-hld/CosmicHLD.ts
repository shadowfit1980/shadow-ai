/**
 * Cosmic Heavy Light Decomposition
 */
import { EventEmitter } from 'events';
export class CosmicHLD extends EventEmitter {
    private parent: number[];
    private depth: number[];
    private heavy: number[];
    private head: number[];
    private pos: number[];
    private curpos: number = 0;
    private n: number;
    constructor(adj: number[][], root: number = 0) { super(); this.n = adj.length; this.parent = new Array(this.n).fill(-1); this.depth = new Array(this.n).fill(0); this.heavy = new Array(this.n).fill(-1); this.head = new Array(this.n); this.pos = new Array(this.n); this.dfs(adj, root); this.decompose(adj, root, root); }
    private dfs(adj: number[][], v: number): number { let size = 1, maxChildSize = 0; for (const u of adj[v]) { if (u !== this.parent[v]) { this.parent[u] = v; this.depth[u] = this.depth[v] + 1; const childSize = this.dfs(adj, u); size += childSize; if (childSize > maxChildSize) { maxChildSize = childSize; this.heavy[v] = u; } } } return size; }
    private decompose(adj: number[][], v: number, h: number): void { this.head[v] = h; this.pos[v] = this.curpos++; if (this.heavy[v] !== -1) this.decompose(adj, this.heavy[v], h); for (const u of adj[v]) if (u !== this.parent[v] && u !== this.heavy[v]) this.decompose(adj, u, u); }
    pathQuery(u: number, v: number): [number, number][] { const paths: [number, number][] = []; while (this.head[u] !== this.head[v]) { if (this.depth[this.head[u]] < this.depth[this.head[v]]) [u, v] = [v, u]; paths.push([this.pos[this.head[u]], this.pos[u]]); u = this.parent[this.head[u]]; } if (this.depth[u] > this.depth[v]) [u, v] = [v, u]; paths.push([this.pos[u], this.pos[v]]); return paths; }
}
export const createHLD = (adj: number[][], root?: number) => new CosmicHLD(adj, root);
