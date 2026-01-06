/**
 * Dimensional Van Emde Boas Tree
 */
import { EventEmitter } from 'events';
export class DimensionalVanEmdeBoas extends EventEmitter {
    private universe: number;
    private min: number | null = null;
    private max: number | null = null;
    private summary: DimensionalVanEmdeBoas | null = null;
    private clusters: Map<number, DimensionalVanEmdeBoas> = new Map();
    constructor(universe: number) { super(); this.universe = universe; }
    private high(x: number): number { return Math.floor(x / Math.sqrt(this.universe)); }
    private low(x: number): number { return x % Math.ceil(Math.sqrt(this.universe)); }
    private index(h: number, l: number): number { return h * Math.ceil(Math.sqrt(this.universe)) + l; }
    private sqrtSize(): number { return Math.ceil(Math.sqrt(this.universe)); }
    insert(x: number): void { if (this.min === null) { this.min = this.max = x; return; } if (x < this.min) { const temp = this.min; this.min = x; x = temp; } if (this.universe > 2) { const h = this.high(x); if (!this.clusters.has(h)) this.clusters.set(h, new DimensionalVanEmdeBoas(this.sqrtSize())); if (this.clusters.get(h)!.min === null) { if (!this.summary) this.summary = new DimensionalVanEmdeBoas(this.sqrtSize()); this.summary.insert(h); } this.clusters.get(h)!.insert(this.low(x)); } if (x > this.max!) this.max = x; }
    member(x: number): boolean { if (x === this.min || x === this.max) return true; if (this.universe <= 2) return false; const h = this.high(x); if (!this.clusters.has(h)) return false; return this.clusters.get(h)!.member(this.low(x)); }
    successor(x: number): number | null { if (this.universe <= 2) { if (x === 0 && this.max === 1) return 1; return null; } if (this.min !== null && x < this.min) return this.min; const h = this.high(x); const cluster = this.clusters.get(h); const maxInCluster = cluster?.max; if (maxInCluster !== null && maxInCluster !== undefined && this.low(x) < maxInCluster) { const offset = cluster!.successor(this.low(x)); return offset !== null ? this.index(h, offset) : null; } if (this.summary) { const succCluster = this.summary.successor(h); if (succCluster !== null) { const succ = this.clusters.get(succCluster)!.min; return succ !== null ? this.index(succCluster, succ) : null; } } return null; }
    getMin(): number | null { return this.min; }
    getMax(): number | null { return this.max; }
}
export const createVanEmdeBoas = (u: number) => new DimensionalVanEmdeBoas(u);
