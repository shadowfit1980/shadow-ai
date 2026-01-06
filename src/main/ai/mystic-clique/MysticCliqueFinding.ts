/**
 * Mystic Clique Finding
 */
import { EventEmitter } from 'events';
export class MysticCliqueFinding extends EventEmitter {
    private n: number;
    private adj: boolean[][];
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => new Array(n).fill(false)); }
    addEdge(u: number, v: number): void { this.adj[u][v] = true; this.adj[v][u] = true; }
    bronKerbosch(): number[][] { const cliques: number[][] = []; const bk = (r: Set<number>, p: Set<number>, x: Set<number>): void => { if (p.size === 0 && x.size === 0) { cliques.push([...r]); return; } const pivot = [...p, ...x][0]; for (const v of p) { if (this.adj[pivot]?.[v]) continue; const newR = new Set(r); newR.add(v); const newP = new Set<number>(); const newX = new Set<number>(); for (let u = 0; u < this.n; u++) { if (this.adj[v][u]) { if (p.has(u)) newP.add(u); if (x.has(u)) newX.add(u); } } bk(newR, newP, newX); p.delete(v); x.add(v); } }; bk(new Set(), new Set(Array.from({ length: this.n }, (_, i) => i)), new Set()); return cliques; }
    maxClique(): number[] { const cliques = this.bronKerbosch(); return cliques.reduce((max, c) => c.length > max.length ? c : max, []); }
    isClique(vertices: number[]): boolean { for (let i = 0; i < vertices.length; i++) { for (let j = i + 1; j < vertices.length; j++) { if (!this.adj[vertices[i]][vertices[j]]) return false; } } return true; }
    cliqueNumber(): number { return this.maxClique().length; }
}
export const createCliqueFinding = (n: number) => new MysticCliqueFinding(n);
