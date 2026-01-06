/**
 * Quantum Minimum Spanning Tree
 */
import { EventEmitter } from 'events';
export class QuantumMinSpanTree extends EventEmitter {
    private static instance: QuantumMinSpanTree;
    private constructor() { super(); }
    static getInstance(): QuantumMinSpanTree { if (!QuantumMinSpanTree.instance) { QuantumMinSpanTree.instance = new QuantumMinSpanTree(); } return QuantumMinSpanTree.instance; }
    minCostConnectPoints(points: number[][]): number { const n = points.length; const dist = (i: number, j: number) => Math.abs(points[i][0] - points[j][0]) + Math.abs(points[i][1] - points[j][1]); const minDist = new Array(n).fill(Infinity); minDist[0] = 0; const visited = new Array(n).fill(false); let total = 0; for (let i = 0; i < n; i++) { let u = -1; for (let j = 0; j < n; j++) if (!visited[j] && (u === -1 || minDist[j] < minDist[u])) u = j; visited[u] = true; total += minDist[u]; for (let v = 0; v < n; v++) if (!visited[v]) minDist[v] = Math.min(minDist[v], dist(u, v)); } return total; }
    minCostToSupplyWater(n: number, wells: number[], pipes: number[][]): number { const edges: [number, number, number][] = []; for (let i = 0; i < n; i++) edges.push([0, i + 1, wells[i]]); for (const [h1, h2, cost] of pipes) edges.push([h1, h2, cost]); edges.sort((a, b) => a[2] - b[2]); const parent = Array.from({ length: n + 1 }, (_, i) => i); const find = (x: number): number => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; }; let total = 0; for (const [u, v, cost] of edges) { const pu = find(u), pv = find(v); if (pu !== pv) { parent[pu] = pv; total += cost; } } return total; }
}
export const quantumMinSpanTree = QuantumMinSpanTree.getInstance();
