/**
 * Dimensional Graph Valid Tree
 */
import { EventEmitter } from 'events';
export class DimensionalGraphValidTree extends EventEmitter {
    private static instance: DimensionalGraphValidTree;
    private constructor() { super(); }
    static getInstance(): DimensionalGraphValidTree { if (!DimensionalGraphValidTree.instance) { DimensionalGraphValidTree.instance = new DimensionalGraphValidTree(); } return DimensionalGraphValidTree.instance; }
    validTree(n: number, edges: number[][]): boolean { if (edges.length !== n - 1) return false; const parent = new Array(n).fill(0).map((_, i) => i); const find = (x: number): number => parent[x] === x ? x : (parent[x] = find(parent[x])); for (const [u, v] of edges) { const pu = find(u), pv = find(v); if (pu === pv) return false; parent[pu] = pv; } return true; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalGraphValidTree = DimensionalGraphValidTree.getInstance();
