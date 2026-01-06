/**
 * Astral Graph Valid Tree
 */
import { EventEmitter } from 'events';
export class AstralGraphValidTree extends EventEmitter {
    private static instance: AstralGraphValidTree;
    private constructor() { super(); }
    static getInstance(): AstralGraphValidTree { if (!AstralGraphValidTree.instance) { AstralGraphValidTree.instance = new AstralGraphValidTree(); } return AstralGraphValidTree.instance; }
    validTree(n: number, edges: number[][]): boolean { if (edges.length !== n - 1) return false; const parent = Array.from({ length: n }, (_, i) => i); const find = (x: number): number => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }; for (const [u, v] of edges) { const pu = find(u), pv = find(v); if (pu === pv) return false; parent[pu] = pv; } return true; }
    countComponents(n: number, edges: number[][]): number { const parent = Array.from({ length: n }, (_, i) => i); const find = (x: number): number => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }; for (const [u, v] of edges) { const pu = find(u), pv = find(v); if (pu !== pv) parent[pu] = pv; } const roots = new Set<number>(); for (let i = 0; i < n; i++) roots.add(find(i)); return roots.size; }
}
export const astralGraphValidTree = AstralGraphValidTree.getInstance();
