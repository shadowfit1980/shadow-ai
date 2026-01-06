/**
 * Ethereal BFS Traverser
 */
import { EventEmitter } from 'events';
export class EtherealBFSTraverser extends EventEmitter {
    private static instance: EtherealBFSTraverser;
    private constructor() { super(); }
    static getInstance(): EtherealBFSTraverser { if (!EtherealBFSTraverser.instance) { EtherealBFSTraverser.instance = new EtherealBFSTraverser(); } return EtherealBFSTraverser.instance; }
    traverse(graph: Map<string, string[]>, start: string): string[] { const visited = new Set<string>(); const result: string[] = []; const queue = [start]; while (queue.length > 0) { const node = queue.shift()!; if (visited.has(node)) continue; visited.add(node); result.push(node); for (const neighbor of graph.get(node) || []) queue.push(neighbor); } return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const etherealBFSTraverser = EtherealBFSTraverser.getInstance();
