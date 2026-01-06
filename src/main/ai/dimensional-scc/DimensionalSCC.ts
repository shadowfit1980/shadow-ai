/**
 * Dimensional SCC (Kosaraju's Algorithm)
 */
import { EventEmitter } from 'events';
export class DimensionalSCC extends EventEmitter {
    private adj: number[][] = [];
    private radj: number[][] = [];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => []); this.radj = Array.from({ length: n }, () => []); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); this.radj[v].push(u); }
    findSCCs(): number[][] { const visited = new Array(this.n).fill(false); const order: number[] = []; const dfs1 = (u: number): void => { visited[u] = true; for (const v of this.adj[u]) if (!visited[v]) dfs1(v); order.push(u); }; for (let i = 0; i < this.n; i++) if (!visited[i]) dfs1(i); visited.fill(false); const sccs: number[][] = []; const dfs2 = (u: number, scc: number[]): void => { visited[u] = true; scc.push(u); for (const v of this.radj[u]) if (!visited[v]) dfs2(v, scc); }; while (order.length) { const u = order.pop()!; if (!visited[u]) { const scc: number[] = []; dfs2(u, scc); sccs.push(scc); } } return sccs; }
}
export const createSCC = (n: number) => new DimensionalSCC(n);
