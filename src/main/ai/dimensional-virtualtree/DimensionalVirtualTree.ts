/**
 * Dimensional Virtual Tree
 */
import { EventEmitter } from 'events';
export class DimensionalVirtualTree extends EventEmitter {
    private n: number;
    private adj: number[][] = [];
    private parent: number[][] = [];
    private depth: number[] = [];
    private tin: number[] = [];
    private tout: number[] = [];
    private timer: number = 0;
    private log: number;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => []); this.log = Math.ceil(Math.log2(n)) + 1; this.parent = Array.from({ length: this.log }, () => new Array(n).fill(-1)); this.depth = new Array(n).fill(0); this.tin = new Array(n).fill(0); this.tout = new Array(n).fill(0); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); this.adj[v].push(u); }
    build(root: number = 0): void { this.dfs(root, -1); for (let j = 1; j < this.log; j++) for (let i = 0; i < this.n; i++) if (this.parent[j - 1][i] !== -1) this.parent[j][i] = this.parent[j - 1][this.parent[j - 1][i]]; }
    private dfs(u: number, p: number): void { this.tin[u] = this.timer++; this.parent[0][u] = p; for (const v of this.adj[u]) { if (v !== p) { this.depth[v] = this.depth[u] + 1; this.dfs(v, u); } } this.tout[u] = this.timer++; }
    private isAncestor(u: number, v: number): boolean { return this.tin[u] <= this.tin[v] && this.tout[v] <= this.tout[u]; }
    lca(u: number, v: number): number { if (this.isAncestor(u, v)) return u; if (this.isAncestor(v, u)) return v; for (let j = this.log - 1; j >= 0; j--) if (this.parent[j][u] !== -1 && !this.isAncestor(this.parent[j][u], v)) u = this.parent[j][u]; return this.parent[0][u]; }
    buildVirtualTree(nodes: number[]): Map<number, number[]> { const sorted = [...nodes].sort((a, b) => this.tin[a] - this.tin[b]); const stack: number[] = []; const virtualAdj: Map<number, number[]> = new Map(); for (const v of sorted) { if (stack.length === 0) { stack.push(v); continue; } const l = this.lca(v, stack[stack.length - 1]); if (l !== stack[stack.length - 1]) { while (stack.length >= 2 && this.depth[stack[stack.length - 2]] >= this.depth[l]) { const top = stack.pop()!; if (!virtualAdj.has(stack[stack.length - 1])) virtualAdj.set(stack[stack.length - 1], []); virtualAdj.get(stack[stack.length - 1])!.push(top); } if (stack[stack.length - 1] !== l) { if (!virtualAdj.has(l)) virtualAdj.set(l, []); virtualAdj.get(l)!.push(stack.pop()!); stack.push(l); } } stack.push(v); } while (stack.length >= 2) { const top = stack.pop()!; if (!virtualAdj.has(stack[stack.length - 1])) virtualAdj.set(stack[stack.length - 1], []); virtualAdj.get(stack[stack.length - 1])!.push(top); } return virtualAdj; }
}
export const createVirtualTree = (n: number) => new DimensionalVirtualTree(n);
