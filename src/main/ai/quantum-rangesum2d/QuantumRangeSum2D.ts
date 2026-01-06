/**
 * Quantum Range Sum Query 2D
 */
import { EventEmitter } from 'events';
export class QuantumRangeSum2D extends EventEmitter {
    private prefix: number[][];
    constructor(matrix: number[][]) { super(); const m = matrix.length, n = matrix[0]?.length || 0; this.prefix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) this.prefix[i][j] = matrix[i - 1][j - 1] + this.prefix[i - 1][j] + this.prefix[i][j - 1] - this.prefix[i - 1][j - 1]; }
    sumRegion(row1: number, col1: number, row2: number, col2: number): number { return this.prefix[row2 + 1][col2 + 1] - this.prefix[row1][col2 + 1] - this.prefix[row2 + 1][col1] + this.prefix[row1][col1]; }
}
export class RangeSumMutable {
    private tree: number[];
    private nums: number[];
    private n: number;
    constructor(nums: number[]) { this.n = nums.length; this.nums = [...nums]; this.tree = new Array(this.n + 1).fill(0); for (let i = 0; i < this.n; i++) this.updateTree(i, nums[i]); }
    private updateTree(i: number, delta: number): void { i++; while (i <= this.n) { this.tree[i] += delta; i += i & -i; } }
    update(i: number, val: number): void { this.updateTree(i, val - this.nums[i]); this.nums[i] = val; }
    private query(i: number): number { let sum = 0; i++; while (i > 0) { sum += this.tree[i]; i -= i & -i; } return sum; }
    sumRange(i: number, j: number): number { return this.query(j) - (i > 0 ? this.query(i - 1) : 0); }
}
export const createRangeSum2D = (matrix: number[][]) => new QuantumRangeSum2D(matrix);
export const createRangeSumMutable = (nums: number[]) => new RangeSumMutable(nums);
