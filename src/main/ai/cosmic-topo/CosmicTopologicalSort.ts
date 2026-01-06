/**
 * Cosmic Topological Sort
 */
import { EventEmitter } from 'events';
export class CosmicTopologicalSort extends EventEmitter {
    private static instance: CosmicTopologicalSort;
    private constructor() { super(); }
    static getInstance(): CosmicTopologicalSort { if (!CosmicTopologicalSort.instance) { CosmicTopologicalSort.instance = new CosmicTopologicalSort(); } return CosmicTopologicalSort.instance; }
    sort(graph: Map<string, string[]>): string[] { const visited = new Set<string>(); const result: string[] = []; const visit = (node: string) => { if (visited.has(node)) return; visited.add(node); for (const n of graph.get(node) || []) visit(n); result.unshift(node); }; for (const node of graph.keys()) visit(node); return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const cosmicTopologicalSort = CosmicTopologicalSort.getInstance();
