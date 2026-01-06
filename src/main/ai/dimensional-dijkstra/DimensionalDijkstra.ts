/**
 * Dimensional Dijkstra
 */
import { EventEmitter } from 'events';
export class DimensionalDijkstra extends EventEmitter {
    private static instance: DimensionalDijkstra;
    private constructor() { super(); }
    static getInstance(): DimensionalDijkstra { if (!DimensionalDijkstra.instance) { DimensionalDijkstra.instance = new DimensionalDijkstra(); } return DimensionalDijkstra.instance; }
    shortestPath(graph: Map<string, { to: string; weight: number }[]>, start: string): Map<string, number> { const dist = new Map<string, number>(); dist.set(start, 0); const visited = new Set<string>(); while (visited.size < graph.size) { let u = ''; let minD = Infinity; for (const [k, v] of dist) if (!visited.has(k) && v < minD) { minD = v; u = k; } if (!u) break; visited.add(u); for (const edge of graph.get(u) || []) { const alt = minD + edge.weight; if (!dist.has(edge.to) || alt < dist.get(edge.to)!) dist.set(edge.to, alt); } } return dist; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const dimensionalDijkstra = DimensionalDijkstra.getInstance();
