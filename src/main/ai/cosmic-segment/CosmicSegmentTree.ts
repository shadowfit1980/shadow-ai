/**
 * Cosmic Segment Tree
 */
import { EventEmitter } from 'events';
export class CosmicSegmentTree extends EventEmitter {
    private tree: number[];
    private n: number;
    private merge: (a: number, b: number) => number;
    constructor(arr: number[], merge: (a: number, b: number) => number = (a, b) => a + b, identity: number = 0) { super(); this.n = arr.length; this.merge = merge; this.tree = new Array(2 * this.n).fill(identity); for (let i = 0; i < this.n; i++) this.tree[this.n + i] = arr[i]; for (let i = this.n - 1; i > 0; i--) this.tree[i] = this.merge(this.tree[2 * i], this.tree[2 * i + 1]); }
    update(i: number, value: number): void { i += this.n; this.tree[i] = value; while (i > 1) { i = Math.floor(i / 2); this.tree[i] = this.merge(this.tree[2 * i], this.tree[2 * i + 1]); } }
    query(l: number, r: number): number { l += this.n; r += this.n + 1; let result = 0; while (l < r) { if (l & 1) result = this.merge(result, this.tree[l++]); if (r & 1) result = this.merge(result, this.tree[--r]); l >>= 1; r >>= 1; } return result; }
}
export const createSegmentTree = (arr: number[], merge?: (a: number, b: number) => number) => new CosmicSegmentTree(arr, merge);
