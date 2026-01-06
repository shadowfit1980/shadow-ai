/**
 * Quantum Min Cost Max Flow
 */
import { EventEmitter } from 'events';
interface Edge { to: number; cap: number; cost: number; flow: number; }
export class QuantumMinCostFlow extends EventEmitter {
    private edges: Edge[] = [];
    private graph: number[][] = [];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.graph = Array.from({ length: n }, () => []); }
    addEdge(from: number, to: number, cap: number, cost: number): void { this.graph[from].push(this.edges.length); this.edges.push({ to, cap, cost, flow: 0 }); this.graph[to].push(this.edges.length); this.edges.push({ to: from, cap: 0, cost: -cost, flow: 0 }); }
    minCostFlow(source: number, sink: number, maxFlow: number = Infinity): { flow: number; cost: number } { let flow = 0, cost = 0; while (flow < maxFlow) { const dist = new Array(this.n).fill(Infinity); const parent = new Array(this.n).fill(-1); const parentEdge = new Array(this.n).fill(-1); const inQueue = new Array(this.n).fill(false); dist[source] = 0; const queue = [source]; inQueue[source] = true; while (queue.length) { const u = queue.shift()!; inQueue[u] = false; for (const idx of this.graph[u]) { const e = this.edges[idx]; if (e.cap > e.flow && dist[u] + e.cost < dist[e.to]) { dist[e.to] = dist[u] + e.cost; parent[e.to] = u; parentEdge[e.to] = idx; if (!inQueue[e.to]) { queue.push(e.to); inQueue[e.to] = true; } } } } if (dist[sink] === Infinity) break; let pushFlow = maxFlow - flow; for (let v = sink; v !== source; v = parent[v]) pushFlow = Math.min(pushFlow, this.edges[parentEdge[v]].cap - this.edges[parentEdge[v]].flow); for (let v = sink; v !== source; v = parent[v]) { this.edges[parentEdge[v]].flow += pushFlow; this.edges[parentEdge[v] ^ 1].flow -= pushFlow; } flow += pushFlow; cost += pushFlow * dist[sink]; } return { flow, cost }; }
}
export const createMinCostFlow = (n: number) => new QuantumMinCostFlow(n);
