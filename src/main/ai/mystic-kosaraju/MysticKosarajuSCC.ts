/**
 * Mystic Kosaraju SCC
 */
import { EventEmitter } from 'events';
export class MysticKosarajuSCC extends EventEmitter {
    private static instance: MysticKosarajuSCC;
    private constructor() { super(); }
    static getInstance(): MysticKosarajuSCC { if (!MysticKosarajuSCC.instance) { MysticKosarajuSCC.instance = new MysticKosarajuSCC(); } return MysticKosarajuSCC.instance; }
    findSCCs(graph: Map<string, string[]>): string[][] { const visited = new Set<string>(); const result: string[][] = []; for (const node of graph.keys()) if (!visited.has(node)) { const component: string[] = []; const stack = [node]; while (stack.length) { const n = stack.pop()!; if (visited.has(n)) continue; visited.add(n); component.push(n); for (const neighbor of graph.get(n) || []) stack.push(neighbor); } result.push(component); } return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const mysticKosarajuSCC = MysticKosarajuSCC.getInstance();
