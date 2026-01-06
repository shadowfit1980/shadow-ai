/**
 * Mystic Is Graph Bipartite
 */
import { EventEmitter } from 'events';
export class MysticIsGraphBipartite extends EventEmitter {
    private static instance: MysticIsGraphBipartite;
    private constructor() { super(); }
    static getInstance(): MysticIsGraphBipartite { if (!MysticIsGraphBipartite.instance) { MysticIsGraphBipartite.instance = new MysticIsGraphBipartite(); } return MysticIsGraphBipartite.instance; }
    isBipartite(graph: number[][]): boolean { const color = new Array(graph.length).fill(0); const dfs = (node: number, c: number): boolean => { color[node] = c; for (const neighbor of graph[node]) { if (color[neighbor] === c) return false; if (color[neighbor] === 0 && !dfs(neighbor, -c)) return false; } return true; }; for (let i = 0; i < graph.length; i++) if (color[i] === 0 && !dfs(i, 1)) return false; return true; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticIsGraphBipartite = MysticIsGraphBipartite.getInstance();
