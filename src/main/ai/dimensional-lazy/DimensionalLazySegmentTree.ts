/**
 * Dimensional Lazy Segment Tree
 */
import { EventEmitter } from 'events';
export class DimensionalLazySegmentTree extends EventEmitter {
    private tree: number[];
    private lazy: number[];
    private n: number;
    constructor(arr: number[]) { super(); this.n = arr.length; this.tree = new Array(4 * this.n).fill(0); this.lazy = new Array(4 * this.n).fill(0); this.build(arr, 0, 0, this.n - 1); }
    private build(arr: number[], node: number, start: number, end: number): void { if (start === end) { this.tree[node] = arr[start]; return; } const mid = Math.floor((start + end) / 2); this.build(arr, 2 * node + 1, start, mid); this.build(arr, 2 * node + 2, mid + 1, end); this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2]; }
    private pushDown(node: number, start: number, end: number): void { if (this.lazy[node] !== 0) { const mid = Math.floor((start + end) / 2); this.tree[2 * node + 1] += this.lazy[node] * (mid - start + 1); this.tree[2 * node + 2] += this.lazy[node] * (end - mid); this.lazy[2 * node + 1] += this.lazy[node]; this.lazy[2 * node + 2] += this.lazy[node]; this.lazy[node] = 0; } }
    updateRange(l: number, r: number, val: number, node: number = 0, start: number = 0, end: number = this.n - 1): void { if (r < start || end < l) return; if (l <= start && end <= r) { this.tree[node] += val * (end - start + 1); this.lazy[node] += val; return; } this.pushDown(node, start, end); const mid = Math.floor((start + end) / 2); this.updateRange(l, r, val, 2 * node + 1, start, mid); this.updateRange(l, r, val, 2 * node + 2, mid + 1, end); this.tree[node] = this.tree[2 * node + 1] + this.tree[2 * node + 2]; }
    query(l: number, r: number, node: number = 0, start: number = 0, end: number = this.n - 1): number { if (r < start || end < l) return 0; if (l <= start && end <= r) return this.tree[node]; this.pushDown(node, start, end); const mid = Math.floor((start + end) / 2); return this.query(l, r, 2 * node + 1, start, mid) + this.query(l, r, 2 * node + 2, mid + 1, end); }
}
export const createLazySegmentTree = (arr: number[]) => new DimensionalLazySegmentTree(arr);
