/**
 * Quantum Kruskal MST
 */
import { EventEmitter } from 'events';
export interface MSTEdge { from: string; to: string; weight: number; }
export class QuantumKruskalMST extends EventEmitter {
    private static instance: QuantumKruskalMST;
    private constructor() { super(); }
    static getInstance(): QuantumKruskalMST { if (!QuantumKruskalMST.instance) { QuantumKruskalMST.instance = new QuantumKruskalMST(); } return QuantumKruskalMST.instance; }
    mst(nodes: string[], edges: MSTEdge[]): MSTEdge[] { const parent = new Map<string, string>(); for (const n of nodes) parent.set(n, n); const find = (x: string): string => { if (parent.get(x) === x) return x; const r = find(parent.get(x)!); parent.set(x, r); return r; }; const result: MSTEdge[] = []; edges.sort((a, b) => a.weight - b.weight); for (const e of edges) { const px = find(e.from), py = find(e.to); if (px !== py) { result.push(e); parent.set(px, py); } } return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const quantumKruskalMST = QuantumKruskalMST.getInstance();
