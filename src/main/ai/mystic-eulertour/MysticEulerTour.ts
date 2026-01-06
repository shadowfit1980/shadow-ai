/**
 * Mystic Euler Tour
 */
import { EventEmitter } from 'events';
export class MysticEulerTour extends EventEmitter {
    private tour: number[] = [];
    private first: number[] = [];
    private last: number[] = [];
    private n: number;
    constructor(adj: number[][], root: number = 0) { super(); this.n = adj.length; this.first = new Array(this.n).fill(-1); this.last = new Array(this.n).fill(-1); this.dfs(adj, root, -1); }
    private dfs(adj: number[][], v: number, p: number): void { this.first[v] = this.tour.length; this.tour.push(v); for (const u of adj[v]) if (u !== p) this.dfs(adj, u, v); this.last[v] = this.tour.length; this.tour.push(v); }
    getTour(): number[] { return this.tour; }
    getFirst(v: number): number { return this.first[v]; }
    getLast(v: number): number { return this.last[v]; }
    isAncestor(u: number, v: number): boolean { return this.first[u] <= this.first[v] && this.last[v] <= this.last[u]; }
}
export const createEulerTour = (adj: number[][], root?: number) => new MysticEulerTour(adj, root);
