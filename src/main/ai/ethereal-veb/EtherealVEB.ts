/**
 * Ethereal Van Emde Boas
 */
import { EventEmitter } from 'events';
export class EtherealVEB extends EventEmitter {
    private u: number;
    private min: number | null = null;
    private max: number | null = null;
    private summary: EtherealVEB | null = null;
    private cluster: Map<number, EtherealVEB> = new Map();
    constructor(u: number) { super(); this.u = u; }
    private high(x: number): number { return Math.floor(x / Math.sqrt(this.u)); }
    private low(x: number): number { return x % Math.floor(Math.sqrt(this.u)); }
    private index(i: number, j: number): number { return i * Math.floor(Math.sqrt(this.u)) + j; }
    insert(x: number): void { if (this.min === null) { this.min = this.max = x; return; } if (x < this.min) [x, this.min] = [this.min, x]; if (this.u > 2) { const h = this.high(x), l = this.low(x); if (!this.cluster.has(h)) this.cluster.set(h, new EtherealVEB(Math.ceil(Math.sqrt(this.u)))); if (this.cluster.get(h)!.min === null) { if (!this.summary) this.summary = new EtherealVEB(Math.ceil(Math.sqrt(this.u))); this.summary.insert(h); } this.cluster.get(h)!.insert(l); } if (x > this.max!) this.max = x; }
    member(x: number): boolean { if (x === this.min || x === this.max) return true; if (this.u <= 2) return false; const h = this.high(x); return this.cluster.has(h) && this.cluster.get(h)!.member(this.low(x)); }
    getMin(): number | null { return this.min; }
    getMax(): number | null { return this.max; }
}
export const createVEB = (u: number) => new EtherealVEB(u);
