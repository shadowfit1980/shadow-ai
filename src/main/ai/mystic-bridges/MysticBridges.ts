/**
 * Mystic Bridges (Tarjan's Bridge Finding)
 */
import { EventEmitter } from 'events';
export class MysticBridges extends EventEmitter {
    private adj: number[][] = [];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => []); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); this.adj[v].push(u); }
    findBridges(): [number, number][] { const visited = new Array(this.n).fill(false); const disc = new Array(this.n).fill(0); const low = new Array(this.n).fill(0); const parent = new Array(this.n).fill(-1); const bridges: [number, number][] = []; let timer = 0; const dfs = (u: number): void => { visited[u] = true; disc[u] = low[u] = timer++; for (const v of this.adj[u]) { if (!visited[v]) { parent[v] = u; dfs(v); low[u] = Math.min(low[u], low[v]); if (low[v] > disc[u]) bridges.push([u, v]); } else if (v !== parent[u]) { low[u] = Math.min(low[u], disc[v]); } } }; for (let i = 0; i < this.n; i++) if (!visited[i]) dfs(i); return bridges; }
    findArticulationPoints(): number[] { const visited = new Array(this.n).fill(false); const disc = new Array(this.n).fill(0); const low = new Array(this.n).fill(0); const parent = new Array(this.n).fill(-1); const ap = new Set<number>(); let timer = 0; const dfs = (u: number): void => { visited[u] = true; disc[u] = low[u] = timer++; let children = 0; for (const v of this.adj[u]) { if (!visited[v]) { children++; parent[v] = u; dfs(v); low[u] = Math.min(low[u], low[v]); if (parent[u] === -1 && children > 1) ap.add(u); if (parent[u] !== -1 && low[v] >= disc[u]) ap.add(u); } else if (v !== parent[u]) { low[u] = Math.min(low[u], disc[v]); } } }; for (let i = 0; i < this.n; i++) if (!visited[i]) dfs(i); return [...ap]; }
}
export const createBridges = (n: number) => new MysticBridges(n);
