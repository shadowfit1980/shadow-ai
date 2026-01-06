/**
 * Cosmic Serialize Graph
 */
import { EventEmitter } from 'events';
export class CosmicSerializeGraph extends EventEmitter {
    private static instance: CosmicSerializeGraph;
    private constructor() { super(); }
    static getInstance(): CosmicSerializeGraph { if (!CosmicSerializeGraph.instance) { CosmicSerializeGraph.instance = new CosmicSerializeGraph(); } return CosmicSerializeGraph.instance; }
    serialize(adj: number[][]): string { return JSON.stringify(adj); }
    deserialize(data: string): number[][] { return JSON.parse(data); }
    serializeEdgeList(edges: [number, number][]): string { return edges.map(([u, v]) => `${u}-${v}`).join(','); }
    deserializeEdgeList(data: string): [number, number][] { if (!data) return []; return data.split(',').map(e => { const [u, v] = e.split('-').map(Number); return [u, v]; }); }
    toAdjacencyMatrix(n: number, edges: [number, number][], directed: boolean = false): number[][] { const matrix = Array.from({ length: n }, () => new Array(n).fill(0)); for (const [u, v] of edges) { matrix[u][v] = 1; if (!directed) matrix[v][u] = 1; } return matrix; }
    toAdjacencyList(n: number, edges: [number, number][], directed: boolean = false): number[][] { const adj: number[][] = Array.from({ length: n }, () => []); for (const [u, v] of edges) { adj[u].push(v); if (!directed) adj[v].push(u); } return adj; }
}
export const cosmicSerializeGraph = CosmicSerializeGraph.getInstance();
