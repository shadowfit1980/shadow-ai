/**
 * Mystic Redundant Connection
 */
import { EventEmitter } from 'events';
export class MysticRedundantConn extends EventEmitter {
    private static instance: MysticRedundantConn;
    private constructor() { super(); }
    static getInstance(): MysticRedundantConn { if (!MysticRedundantConn.instance) { MysticRedundantConn.instance = new MysticRedundantConn(); } return MysticRedundantConn.instance; }
    findRedundantConnection(edges: number[][]): number[] { const n = edges.length; const parent = Array.from({ length: n + 1 }, (_, i) => i); const rank = new Array(n + 1).fill(0); const find = (x: number): number => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }; const union = (x: number, y: number): boolean => { const px = find(x), py = find(y); if (px === py) return false; if (rank[px] < rank[py]) parent[px] = py; else if (rank[px] > rank[py]) parent[py] = px; else { parent[py] = px; rank[px]++; } return true; }; for (const [u, v] of edges) if (!union(u, v)) return [u, v]; return []; }
    findRedundantDirectedConnection(edges: number[][]): number[] { const n = edges.length; let candidate1 = [-1, -1], candidate2 = [-1, -1]; const parent: Map<number, number> = new Map(); for (const [u, v] of edges) { if (parent.has(v)) { candidate1 = [parent.get(v)!, v]; candidate2 = [u, v]; break; } parent.set(v, u); } const uf = Array.from({ length: n + 1 }, (_, i) => i); const find = (x: number): number => { if (uf[x] !== x) uf[x] = find(uf[x]); return uf[x]; }; for (const [u, v] of edges) { if (candidate2[0] === u && candidate2[1] === v) continue; const pu = find(u), pv = find(v); if (pu === pv) return candidate1[0] === -1 ? [u, v] : candidate1; uf[pv] = pu; } return candidate2; }
}
export const mysticRedundantConn = MysticRedundantConn.getInstance();
