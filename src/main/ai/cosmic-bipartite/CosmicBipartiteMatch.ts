/**
 * Cosmic Bipartite Matching (Hopcroft-Karp)
 */
import { EventEmitter } from 'events';
export class CosmicBipartiteMatch extends EventEmitter {
    private adj: number[][] = [];
    private match: number[] = [];
    private dist: number[] = [];
    private n: number;
    private m: number;
    constructor(n: number, m: number) { super(); this.n = n; this.m = m; this.adj = Array.from({ length: n }, () => []); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); }
    private bfs(): boolean { const queue: number[] = []; this.dist = new Array(this.n + 1).fill(-1); for (let u = 0; u < this.n; u++) if (this.match[u] === -1) { this.dist[u] = 0; queue.push(u); } let found = false; while (queue.length) { const u = queue.shift()!; for (const v of this.adj[u]) { const next = this.match[this.n + v]; if (next === -1) found = true; else if (this.dist[next] === -1) { this.dist[next] = this.dist[u] + 1; queue.push(next); } } } return found; }
    private dfs(u: number): boolean { for (const v of this.adj[u]) { const next = this.match[this.n + v]; if (next === -1 || (this.dist[next] === this.dist[u] + 1 && this.dfs(next))) { this.match[u] = v; this.match[this.n + v] = u; return true; } } this.dist[u] = -1; return false; }
    maxMatching(): number { this.match = new Array(this.n + this.m).fill(-1); let matching = 0; while (this.bfs()) for (let u = 0; u < this.n; u++) if (this.match[u] === -1 && this.dfs(u)) matching++; return matching; }
    getMatching(): [number, number][] { const pairs: [number, number][] = []; for (let u = 0; u < this.n; u++) if (this.match[u] !== -1) pairs.push([u, this.match[u]]); return pairs; }
}
export const createBipartiteMatch = (n: number, m: number) => new CosmicBipartiteMatch(n, m);
