/**
 * Quantum Fenwick Tree (Binary Indexed Tree)
 */
import { EventEmitter } from 'events';
export class QuantumFenwickTree extends EventEmitter {
    private tree: number[];
    private n: number;
    constructor(n: number) { super(); this.n = n; this.tree = new Array(n + 1).fill(0); }
    static fromArray(arr: number[]): QuantumFenwickTree { const ft = new QuantumFenwickTree(arr.length); for (let i = 0; i < arr.length; i++) ft.update(i, arr[i]); return ft; }
    update(i: number, delta: number): void { i++; while (i <= this.n) { this.tree[i] += delta; i += i & (-i); } }
    prefixSum(i: number): number { i++; let sum = 0; while (i > 0) { sum += this.tree[i]; i -= i & (-i); } return sum; }
    rangeSum(l: number, r: number): number { return this.prefixSum(r) - (l > 0 ? this.prefixSum(l - 1) : 0); }
    pointQuery(i: number): number { return this.rangeSum(i, i); }
}
export const createFenwickTree = (n: number) => new QuantumFenwickTree(n);
