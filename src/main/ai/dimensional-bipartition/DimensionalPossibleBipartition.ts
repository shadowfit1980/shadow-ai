/**
 * Dimensional Possible Bipartition
 */
import { EventEmitter } from 'events';
export class DimensionalPossibleBipartition extends EventEmitter {
    private static instance: DimensionalPossibleBipartition;
    private constructor() { super(); }
    static getInstance(): DimensionalPossibleBipartition { if (!DimensionalPossibleBipartition.instance) { DimensionalPossibleBipartition.instance = new DimensionalPossibleBipartition(); } return DimensionalPossibleBipartition.instance; }
    possibleBipartition(n: number, dislikes: number[][]): boolean { const graph = new Map<number, number[]>(); for (const [a, b] of dislikes) { if (!graph.has(a)) graph.set(a, []); if (!graph.has(b)) graph.set(b, []); graph.get(a)!.push(b); graph.get(b)!.push(a); } const color = new Array(n + 1).fill(0); const dfs = (node: number, c: number): boolean => { color[node] = c; for (const neighbor of graph.get(node) || []) { if (color[neighbor] === c) return false; if (color[neighbor] === 0 && !dfs(neighbor, -c)) return false; } return true; }; for (let i = 1; i <= n; i++) if (color[i] === 0 && !dfs(i, 1)) return false; return true; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalPossibleBipartition = DimensionalPossibleBipartition.getInstance();
