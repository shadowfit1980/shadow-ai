/**
 * Astral Max Flow (Dinic's Algorithm)
 */
import { EventEmitter } from 'events';
export class AstralMaxFlow extends EventEmitter {
    private graph: Map<number, Map<number, number>> = new Map();
    private n: number;
    constructor(n: number) { super(); this.n = n; for (let i = 0; i < n; i++) this.graph.set(i, new Map()); }
    addEdge(u: number, v: number, capacity: number): void { this.graph.get(u)!.set(v, (this.graph.get(u)!.get(v) || 0) + capacity); if (!this.graph.get(v)!.has(u)) this.graph.get(v)!.set(u, 0); }
    private bfs(source: number, sink: number, level: number[]): boolean { level.fill(-1); level[source] = 0; const queue = [source]; while (queue.length) { const u = queue.shift()!; for (const [v, cap] of this.graph.get(u)!) if (cap > 0 && level[v] === -1) { level[v] = level[u] + 1; queue.push(v); } } return level[sink] !== -1; }
    private dfs(u: number, sink: number, pushed: number, level: number[], iter: number[]): number { if (u === sink || pushed === 0) return pushed; for (; iter[u] < this.n; iter[u]++) { const v = iter[u]; const cap = this.graph.get(u)!.get(v) || 0; if (cap > 0 && level[v] === level[u] + 1) { const d = this.dfs(v, sink, Math.min(pushed, cap), level, iter); if (d > 0) { this.graph.get(u)!.set(v, cap - d); this.graph.get(v)!.set(u, (this.graph.get(v)!.get(u) || 0) + d); return d; } } } return 0; }
    maxFlow(source: number, sink: number): number { let flow = 0; const level = new Array(this.n); while (this.bfs(source, sink, level)) { const iter = new Array(this.n).fill(0); let pushed; while ((pushed = this.dfs(source, sink, Infinity, level, iter)) > 0) flow += pushed; } return flow; }
}
export const createMaxFlow = (n: number) => new AstralMaxFlow(n);
