/**
 * Astral Random Pick
 */
import { EventEmitter } from 'events';
export class AstralRandomPick extends EventEmitter {
    private prefixSum: number[] = [];
    private total: number = 0;
    constructor(w: number[]) { super(); for (const weight of w) { this.total += weight; this.prefixSum.push(this.total); } }
    pickIndex(): number { const target = Math.random() * this.total; let left = 0, right = this.prefixSum.length - 1; while (left < right) { const mid = Math.floor((left + right) / 2); if (this.prefixSum[mid] <= target) left = mid + 1; else right = mid; } return left; }
}
export class RandomizedSet extends EventEmitter {
    private map: Map<number, number> = new Map();
    private list: number[] = [];
    constructor() { super(); }
    insert(val: number): boolean { if (this.map.has(val)) return false; this.map.set(val, this.list.length); this.list.push(val); return true; }
    remove(val: number): boolean { if (!this.map.has(val)) return false; const idx = this.map.get(val)!; const last = this.list[this.list.length - 1]; this.list[idx] = last; this.map.set(last, idx); this.list.pop(); this.map.delete(val); return true; }
    getRandom(): number { return this.list[Math.floor(Math.random() * this.list.length)]; }
}
export const createRandomPick = (w: number[]) => new AstralRandomPick(w);
export const createRandomizedSet = () => new RandomizedSet();
