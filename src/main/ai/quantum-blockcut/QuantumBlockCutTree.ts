/**
 * Quantum Block Cut Tree
 */
import { EventEmitter } from 'events';
export class QuantumBlockCutTree extends EventEmitter {
    private n: number;
    private adj: number[][] = [];
    private disc: number[] = [];
    private low: number[] = [];
    private parent: number[] = [];
    private ap: Set<number> = new Set();
    private blocks: number[][] = [];
    private timer: number = 0;
    constructor(n: number) { super(); this.n = n; this.adj = Array.from({ length: n }, () => []); this.disc = new Array(n).fill(-1); this.low = new Array(n).fill(-1); this.parent = new Array(n).fill(-1); }
    addEdge(u: number, v: number): void { this.adj[u].push(v); this.adj[v].push(u); }
    build(): void { const stack: [number, number][] = []; for (let i = 0; i < this.n; i++) { if (this.disc[i] === -1) this.dfs(i, stack); } }
    private dfs(u: number, stack: [number, number][]): void { this.disc[u] = this.low[u] = this.timer++; let children = 0; for (const v of this.adj[u]) { if (this.disc[v] === -1) { children++; this.parent[v] = u; stack.push([u, v]); this.dfs(v, stack); this.low[u] = Math.min(this.low[u], this.low[v]); if ((this.parent[u] === -1 && children > 1) || (this.parent[u] !== -1 && this.low[v] >= this.disc[u])) { this.ap.add(u); const block: number[] = []; while (stack.length) { const [a, b] = stack.pop()!; block.push(a, b); if (a === u && b === v) break; } this.blocks.push([...new Set(block)]); } } else if (v !== this.parent[u]) { this.low[u] = Math.min(this.low[u], this.disc[v]); if (this.disc[v] < this.disc[u]) stack.push([u, v]); } } }
    getArticulationPoints(): number[] { return [...this.ap]; }
    getBlocks(): number[][] { return this.blocks; }
}
export const createBlockCutTree = (n: number) => new QuantumBlockCutTree(n);
