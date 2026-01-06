/**
 * Cosmic Dominator Tree
 */
import { EventEmitter } from 'events';
export class CosmicDominatorTree extends EventEmitter {
    private n: number;
    private adj: number[][] = [];
    private radj: number[][] = [];
    private idom: number[] = [];
    private sdom: number[] = [];
    private parent: number[] = [];
    private vertex: number[] = [];
    private bucket: Set<number>[] = [];
    private dsu: number[] = [];
    private label: number[] = [];
    private timer: number = 0;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => []); this.radj = Array.from({ length: n }, () => []); this.idom = new Array(n).fill(-1); this.sdom = Array.from({ length: n }, (_, i) => i); this.parent = new Array(n).fill(-1); this.vertex = new Array(n).fill(-1); this.bucket = Array.from({ length: n }, () => new Set()); this.dsu = Array.from({ length: n }, (_, i) => i); this.label = Array.from({ length: n }, (_, i) => i); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); this.radj[v].push(u); }
    private dfs(u: number): void { this.sdom[u] = this.timer; this.vertex[this.timer++] = u; for (const v of this.adj[u]) { if (this.sdom[v] === v) { this.parent[v] = u; this.dfs(v); } } }
    private find(v: number): number { if (this.dsu[v] === v) return v; const root = this.find(this.dsu[v]); if (this.sdom[this.label[this.dsu[v]]] < this.sdom[this.label[v]]) this.label[v] = this.label[this.dsu[v]]; this.dsu[v] = root; return root; }
    private unite(u: number, v: number): void { this.dsu[v] = u; }
    build(root: number = 0): void { this.dfs(root); for (let i = this.timer - 1; i >= 1; i--) { const w = this.vertex[i]; for (const v of this.radj[w]) { if (this.sdom[v] === v) continue; this.find(v); this.sdom[w] = Math.min(this.sdom[w], this.sdom[this.label[v]]); } this.bucket[this.vertex[this.sdom[w]]].add(w); this.unite(this.parent[w], w); for (const v of this.bucket[this.parent[w]]) { this.find(v); this.idom[v] = this.sdom[this.label[v]] < this.sdom[v] ? this.label[v] : this.parent[w]; } this.bucket[this.parent[w]].clear(); } for (let i = 1; i < this.timer; i++) { const w = this.vertex[i]; if (this.idom[w] !== this.vertex[this.sdom[w]]) this.idom[w] = this.idom[this.idom[w]]; } }
    getDominators(): number[] { return this.idom; }
    dominates(u: number, v: number): boolean { while (v !== -1 && v !== u) v = this.idom[v]; return v === u; }
}
export const createDominatorTree = (n: number) => new CosmicDominatorTree(n);
