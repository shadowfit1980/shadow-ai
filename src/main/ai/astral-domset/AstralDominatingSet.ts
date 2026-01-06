/**
 * Astral Dominating Set
 */
import { EventEmitter } from 'events';
export class AstralDominatingSet extends EventEmitter {
    private n: number;
    private adj: Set<number>[] = [];
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => new Set()); }
    addEdge(u: number, v: number): void { this.adj[u].add(v); this.adj[v].add(u); }
    greedyDomSet(): number[] { const dominated = new Set<number>(); const domSet: number[] = []; while (dominated.size < this.n) { let bestNode = -1, bestCover = 0; for (let i = 0; i < this.n; i++) { if (dominated.has(i)) continue; let cover = dominated.has(i) ? 0 : 1; for (const v of this.adj[i]) if (!dominated.has(v)) cover++; if (cover > bestCover) { bestCover = cover; bestNode = i; } } if (bestNode === -1) break; domSet.push(bestNode); dominated.add(bestNode); for (const v of this.adj[bestNode]) dominated.add(v); } return domSet; }
    isDominating(set: number[]): boolean { const dominated = new Set<number>(); for (const v of set) { dominated.add(v); for (const u of this.adj[v]) dominated.add(u); } return dominated.size === this.n; }
    exactBruteForce(): number[] { for (let k = 1; k <= this.n; k++) { const result = this.findDomSetOfSize(k); if (result) return result; } return Array.from({ length: this.n }, (_, i) => i); }
    private findDomSetOfSize(k: number): number[] | null { const comb = (start: number, current: number[]): number[] | null => { if (current.length === k) return this.isDominating(current) ? current : null; for (let i = start; i < this.n; i++) { current.push(i); const result = comb(i + 1, current); if (result) return result; current.pop(); } return null; }; return comb(0, []); }
}
export const createDominatingSet = (n: number) => new AstralDominatingSet(n);
