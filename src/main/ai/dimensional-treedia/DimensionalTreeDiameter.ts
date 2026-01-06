/**
 * Dimensional Tree Diameter
 */
import { EventEmitter } from 'events';
export class DimensionalTreeDiameter extends EventEmitter {
    private static instance: DimensionalTreeDiameter;
    private constructor() { super(); }
    static getInstance(): DimensionalTreeDiameter { if (!DimensionalTreeDiameter.instance) { DimensionalTreeDiameter.instance = new DimensionalTreeDiameter(); } return DimensionalTreeDiameter.instance; }
    treeDiameter(edges: number[][]): number { if (edges.length === 0) return 0; const n = edges.length + 1; const adj: number[][] = Array.from({ length: n }, () => []); for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); } const bfs = (start: number): [number, number] => { const dist = new Array(n).fill(-1); dist[start] = 0; const queue = [start]; let farthest = start; while (queue.length) { const u = queue.shift()!; for (const v of adj[u]) { if (dist[v] === -1) { dist[v] = dist[u] + 1; queue.push(v); if (dist[v] > dist[farthest]) farthest = v; } } } return [farthest, dist[farthest]]; }; const [farthest1] = bfs(0); const [, diameter] = bfs(farthest1); return diameter; }
    diameterOfBinaryTree(root: { val: number; left?: unknown; right?: unknown } | null): number { let diameter = 0; const depth = (node: unknown): number => { if (!node) return 0; const n = node as { left?: unknown; right?: unknown }; const left = depth(n.left); const right = depth(n.right); diameter = Math.max(diameter, left + right); return Math.max(left, right) + 1; }; depth(root); return diameter; }
}
export const dimensionalTreeDiameter = DimensionalTreeDiameter.getInstance();
