/**
 * Astral Two SAT
 */
import { EventEmitter } from 'events';
export class AstralTwoSAT extends EventEmitter {
    private adj: number[][] = [];
    private radj: number[][] = [];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: 2 * n }, () => []); this.radj = Array.from({ length: 2 * n }, () => []); }
    private neg(x: number): number { return x < this.n ? x + this.n : x - this.n; }
    addClause(x: number, xNeg: boolean, y: number, yNeg: boolean): void { const a = xNeg ? this.neg(x) : x; const b = yNeg ? this.neg(y) : y; this.adj[this.neg(a)].push(b); this.adj[this.neg(b)].push(a); this.radj[b].push(this.neg(a)); this.radj[a].push(this.neg(b)); }
    solve(): boolean[] | null { const visited = new Array(2 * this.n).fill(false); const order: number[] = []; const comp = new Array(2 * this.n).fill(-1); const dfs1 = (v: number): void => { visited[v] = true; for (const u of this.adj[v]) if (!visited[u]) dfs1(u); order.push(v); }; const dfs2 = (v: number, c: number): void => { comp[v] = c; for (const u of this.radj[v]) if (comp[u] === -1) dfs2(u, c); }; for (let i = 0; i < 2 * this.n; i++) if (!visited[i]) dfs1(i); let c = 0; while (order.length) { const v = order.pop()!; if (comp[v] === -1) dfs2(v, c++); } const result = new Array(this.n); for (let i = 0; i < this.n; i++) { if (comp[i] === comp[this.neg(i)]) return null; result[i] = comp[i] > comp[this.neg(i)]; } return result; }
}
export const createTwoSAT = (n: number) => new AstralTwoSAT(n);
