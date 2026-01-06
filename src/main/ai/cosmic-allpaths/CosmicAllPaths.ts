/**
 * Cosmic All Paths from Source to Target
 */
import { EventEmitter } from 'events';
export class CosmicAllPaths extends EventEmitter {
    private static instance: CosmicAllPaths;
    private constructor() { super(); }
    static getInstance(): CosmicAllPaths { if (!CosmicAllPaths.instance) { CosmicAllPaths.instance = new CosmicAllPaths(); } return CosmicAllPaths.instance; }
    allPathsSourceTarget(graph: number[][]): number[][] { const result: number[][] = []; const dfs = (node: number, path: number[]) => { if (node === graph.length - 1) { result.push([...path]); return; } for (const next of graph[node]) { path.push(next); dfs(next, path); path.pop(); } }; dfs(0, [0]); return result; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const cosmicAllPaths = CosmicAllPaths.getInstance();
