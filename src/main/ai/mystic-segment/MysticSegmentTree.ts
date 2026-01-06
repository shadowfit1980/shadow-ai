/**
 * Mystic Segment Tree
 */
import { EventEmitter } from 'events';
export class MysticSegmentTree extends EventEmitter {
    private static instance: MysticSegmentTree;
    private tree: number[] = [];
    private n: number = 0;
    private constructor() { super(); }
    static getInstance(): MysticSegmentTree { if (!MysticSegmentTree.instance) { MysticSegmentTree.instance = new MysticSegmentTree(); } return MysticSegmentTree.instance; }
    build(arr: number[]): void { this.n = arr.length; this.tree = new Array(this.n * 2).fill(0); for (let i = 0; i < this.n; i++) this.tree[this.n + i] = arr[i]; for (let i = this.n - 1; i > 0; i--) this.tree[i] = this.tree[i * 2] + this.tree[i * 2 + 1]; }
    query(l: number, r: number): number { let res = 0; l += this.n; r += this.n; while (l < r) { if (l & 1) res += this.tree[l++]; if (r & 1) res += this.tree[--r]; l >>= 1; r >>= 1; } return res; }
    getStats(): { size: number } { return { size: this.n }; }
}
export const mysticSegmentTree = MysticSegmentTree.getInstance();
