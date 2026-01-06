/**
 * Cosmic Vertex Cover
 */
import { EventEmitter } from 'events';
export class CosmicVertexCover extends EventEmitter {
    private n: number;
    private edges: [number, number][] = [];
    private adj: Set<number>[] = [];
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => new Set()); }
    addEdge(u: number, v: number): void { this.edges.push([u, v]); this.adj[u].add(v); this.adj[v].add(u); }
    greedyApprox(): number[] { const cover = new Set<number>(); const edgesCopy = [...this.edges]; for (const [u, v] of edgesCopy) { if (!cover.has(u) && !cover.has(v)) { cover.add(u); cover.add(v); } } return [...cover]; }
    greedyMaxDegree(): number[] { const cover = new Set<number>(); const degrees = Array.from({ length: this.n }, (_, i) => this.adj[i].size); const remaining = new Set(this.edges.map((_, i) => i)); while (remaining.size > 0) { let maxDeg = -1, maxNode = -1; for (let i = 0; i < this.n; i++) { if (!cover.has(i) && degrees[i] > maxDeg) { maxDeg = degrees[i]; maxNode = i; } } if (maxNode === -1) break; cover.add(maxNode); for (let i = 0; i < this.edges.length; i++) { if (remaining.has(i)) { const [u, v] = this.edges[i]; if (u === maxNode || v === maxNode) { remaining.delete(i); degrees[u]--; degrees[v]--; } } } } return [...cover]; }
    exactBruteForce(): number[] { let minCover: number[] = Array.from({ length: this.n }, (_, i) => i); for (let mask = 0; mask < (1 << this.n); mask++) { const cover: number[] = []; for (let i = 0; i < this.n; i++) if (mask & (1 << i)) cover.push(i); if (cover.length >= minCover.length) continue; let valid = true; for (const [u, v] of this.edges) { if (!cover.includes(u) && !cover.includes(v)) { valid = false; break; } } if (valid) minCover = cover; } return minCover; }
}
export const createVertexCover = (n: number) => new CosmicVertexCover(n);
