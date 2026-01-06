/**
 * Dimensional Tarjan SCC
 */
import { EventEmitter } from 'events';
export class DimensionalTarjanSCC extends EventEmitter {
    private static instance: DimensionalTarjanSCC;
    private constructor() { super(); }
    static getInstance(): DimensionalTarjanSCC { if (!DimensionalTarjanSCC.instance) { DimensionalTarjanSCC.instance = new DimensionalTarjanSCC(); } return DimensionalTarjanSCC.instance; }
    findSCCs(graph: Map<string, string[]>): string[][] { const sccs: string[][] = []; const visited = new Set<string>(); for (const node of graph.keys()) { if (!visited.has(node)) { const scc: string[] = []; const stack = [node]; while (stack.length > 0) { const n = stack.pop()!; if (visited.has(n)) continue; visited.add(n); scc.push(n); for (const neighbor of graph.get(n) || []) stack.push(neighbor); } sccs.push(scc); } } return sccs; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const dimensionalTarjanSCC = DimensionalTarjanSCC.getInstance();
