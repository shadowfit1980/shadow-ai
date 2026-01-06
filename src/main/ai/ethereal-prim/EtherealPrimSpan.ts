/**
 * Ethereal Prim Span
 */
import { EventEmitter } from 'events';
export class EtherealPrimSpan extends EventEmitter {
    private static instance: EtherealPrimSpan;
    private constructor() { super(); }
    static getInstance(): EtherealPrimSpan { if (!EtherealPrimSpan.instance) { EtherealPrimSpan.instance = new EtherealPrimSpan(); } return EtherealPrimSpan.instance; }
    mst(graph: Map<string, { to: string; weight: number }[]>): { from: string; to: string; weight: number }[] { const edges: { from: string; to: string; weight: number }[] = []; const visited = new Set<string>(); const first = graph.keys().next().value; if (!first) return edges; visited.add(first); while (visited.size < graph.size) { let best: { from: string; to: string; weight: number } | null = null; for (const v of visited) for (const e of graph.get(v) || []) if (!visited.has(e.to) && (!best || e.weight < best.weight)) best = { from: v, to: e.to, weight: e.weight }; if (!best) break; edges.push(best); visited.add(best.to); } return edges; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const etherealPrimSpan = EtherealPrimSpan.getInstance();
