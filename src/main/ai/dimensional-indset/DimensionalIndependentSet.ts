/**
 * Dimensional Independent Set
 */
import { EventEmitter } from 'events';
export class DimensionalIndependentSet extends EventEmitter {
    private n: number;
    private adj: boolean[][];
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => new Array(n).fill(false)); }
    addEdge(u: number, v: number): void { this.adj[u][v] = true; this.adj[v][u] = true; }
    greedyMIS(): number[] { const result: number[] = []; const excluded = new Set<number>(); const degrees = Array.from({ length: this.n }, (_, i) => ({ node: i, degree: this.adj[i].filter(x => x).length })); degrees.sort((a, b) => a.degree - b.degree); for (const { node } of degrees) { if (excluded.has(node)) continue; result.push(node); excluded.add(node); for (let v = 0; v < this.n; v++) if (this.adj[node][v]) excluded.add(v); } return result; }
    exactBruteForce(): number[] { let maxSet: number[] = []; for (let mask = 0; mask < (1 << this.n); mask++) { const set: number[] = []; for (let i = 0; i < this.n; i++) if (mask & (1 << i)) set.push(i); let independent = true; for (let i = 0; i < set.length && independent; i++) { for (let j = i + 1; j < set.length && independent; j++) { if (this.adj[set[i]][set[j]]) independent = false; } } if (independent && set.length > maxSet.length) maxSet = set; } return maxSet; }
    isIndependent(set: number[]): boolean { for (let i = 0; i < set.length; i++) { for (let j = i + 1; j < set.length; j++) { if (this.adj[set[i]][set[j]]) return false; } } return true; }
}
export const createIndependentSet = (n: number) => new DimensionalIndependentSet(n);
