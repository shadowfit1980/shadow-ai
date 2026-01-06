/**
 * Astral Gomory Hu Tree
 */
import { EventEmitter } from 'events';
export class AstralGomoryHuTree extends EventEmitter {
    private n: number;
    private parent: number[];
    private parentWeight: number[];
    constructor(n: number) { super(); this.n = n; this.parent = new Array(n).fill(0); this.parentWeight = new Array(n).fill(Infinity); }
    private maxFlowFF(graph: number[][], s: number, t: number): number { const n = graph.length; const residual = graph.map(row => [...row]); const bfs = (): number[] | null => { const parent = new Array(n).fill(-1); parent[s] = s; const queue = [s]; while (queue.length) { const u = queue.shift()!; for (let v = 0; v < n; v++) { if (parent[v] === -1 && residual[u][v] > 0) { parent[v] = u; if (v === t) return parent; queue.push(v); } } } return null; }; let maxFlow = 0; let parent: number[] | null; while ((parent = bfs())) { let pathFlow = Infinity; for (let v = t; v !== s; v = parent[v]) pathFlow = Math.min(pathFlow, residual[parent[v]][v]); for (let v = t; v !== s; v = parent[v]) { residual[parent[v]][v] -= pathFlow; residual[v][parent[v]] += pathFlow; } maxFlow += pathFlow; } return maxFlow; }
    build(graph: number[][]): void { for (let i = 1; i < this.n; i++) { const flow = this.maxFlowFF(graph.map(r => [...r]), i, this.parent[i]); this.parentWeight[i] = flow; for (let j = i + 1; j < this.n; j++) { if (this.parent[j] === this.parent[i] && this.maxFlowFF(graph.map(r => [...r]), i, j) <= flow) { this.parent[j] = i; } } } }
    minCut(u: number, v: number): number { let minCut = Infinity; while (u !== v) { if (this.parentWeight[u] < this.parentWeight[v]) { minCut = Math.min(minCut, this.parentWeight[u]); u = this.parent[u]; } else { minCut = Math.min(minCut, this.parentWeight[v]); v = this.parent[v]; } } return minCut; }
}
export const createGomoryHuTree = (n: number) => new AstralGomoryHuTree(n);
