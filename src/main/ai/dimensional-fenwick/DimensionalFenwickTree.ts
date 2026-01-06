/**
 * Dimensional Fenwick Tree
 */
import { EventEmitter } from 'events';
export class DimensionalFenwickTree extends EventEmitter {
    private static instance: DimensionalFenwickTree;
    private tree: number[] = [];
    private constructor() { super(); this.tree = new Array(1001).fill(0); }
    static getInstance(): DimensionalFenwickTree { if (!DimensionalFenwickTree.instance) { DimensionalFenwickTree.instance = new DimensionalFenwickTree(); } return DimensionalFenwickTree.instance; }
    update(i: number, delta: number): void { i++; while (i <= 1000) { this.tree[i] += delta; i += i & (-i); } }
    query(i: number): number { let sum = 0; i++; while (i > 0) { sum += this.tree[i]; i -= i & (-i); } return sum; }
    getStats(): { size: number } { return { size: 1000 }; }
}
export const dimensionalFenwickTree = DimensionalFenwickTree.getInstance();
