/**
 * Astral Wavelet Tree
 */
import { EventEmitter } from 'events';
class WaveletNode { left: WaveletNode | null = null; right: WaveletNode | null = null; count: number[] = []; }
export class AstralWaveletTree extends EventEmitter {
    private root: WaveletNode;
    private lo: number;
    private hi: number;
    constructor(arr: number[]) { super(); this.lo = Math.min(...arr); this.hi = Math.max(...arr); this.root = this.build(arr, this.lo, this.hi); }
    private build(arr: number[], lo: number, hi: number): WaveletNode { const node = new WaveletNode(); if (lo === hi) return node; const mid = Math.floor((lo + hi) / 2); const left: number[] = [], right: number[] = []; node.count.push(0); for (const x of arr) { if (x <= mid) { left.push(x); node.count.push(node.count[node.count.length - 1] + 1); } else { right.push(x); node.count.push(node.count[node.count.length - 1]); } } if (left.length) node.left = this.build(left, lo, mid); if (right.length) node.right = this.build(right, mid + 1, hi); return node; }
    kth(l: number, r: number, k: number): number { return this.kthRecursive(this.root, this.lo, this.hi, l, r, k); }
    private kthRecursive(node: WaveletNode, lo: number, hi: number, l: number, r: number, k: number): number { if (lo === hi) return lo; const mid = Math.floor((lo + hi) / 2); const leftCount = node.count[r + 1] - node.count[l]; if (k <= leftCount) return this.kthRecursive(node.left!, lo, mid, node.count[l], node.count[r + 1] - 1, k); return this.kthRecursive(node.right!, mid + 1, hi, l - node.count[l], r - node.count[r + 1], k - leftCount); }
}
export const createWaveletTree = (arr: number[]) => new AstralWaveletTree(arr);
