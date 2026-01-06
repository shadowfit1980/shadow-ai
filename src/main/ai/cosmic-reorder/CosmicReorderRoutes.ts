/**
 * Cosmic Reorder Routes
 */
import { EventEmitter } from 'events';
export class CosmicReorderRoutes extends EventEmitter {
    private static instance: CosmicReorderRoutes;
    private constructor() { super(); }
    static getInstance(): CosmicReorderRoutes { if (!CosmicReorderRoutes.instance) { CosmicReorderRoutes.instance = new CosmicReorderRoutes(); } return CosmicReorderRoutes.instance; }
    minReorder(n: number, connections: number[][]): number { const graph = new Map<number, [number, boolean][]>(); for (let i = 0; i < n; i++) graph.set(i, []); for (const [a, b] of connections) { graph.get(a)!.push([b, true]); graph.get(b)!.push([a, false]); } const visited = new Set([0]); const queue = [0]; let count = 0; while (queue.length) { const node = queue.shift()!; for (const [neighbor, needsReverse] of graph.get(node)!) if (!visited.has(neighbor)) { visited.add(neighbor); if (needsReverse) count++; queue.push(neighbor); } } return count; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const cosmicReorderRoutes = CosmicReorderRoutes.getInstance();
