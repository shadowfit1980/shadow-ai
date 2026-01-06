/**
 * Quantum Range Sum Query
 */
import { EventEmitter } from 'events';
export class QuantumRangeSumQuery extends EventEmitter {
    private prefix: number[];
    constructor(nums: number[]) { super(); this.prefix = [0]; for (const num of nums) this.prefix.push(this.prefix[this.prefix.length - 1] + num); }
    sumRange(left: number, right: number): number { return this.prefix[right + 1] - this.prefix[left]; }
}
export class QuantumRangeSumQuery2D extends EventEmitter {
    private prefix: number[][];
    constructor(matrix: number[][]) { super(); const m = matrix.length, n = matrix[0]?.length || 0; this.prefix = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) this.prefix[i][j] = matrix[i - 1][j - 1] + this.prefix[i - 1][j] + this.prefix[i][j - 1] - this.prefix[i - 1][j - 1]; }
    sumRegion(row1: number, col1: number, row2: number, col2: number): number { return this.prefix[row2 + 1][col2 + 1] - this.prefix[row1][col2 + 1] - this.prefix[row2 + 1][col1] + this.prefix[row1][col1]; }
}
export const createRangeSumQuery = (nums: number[]) => new QuantumRangeSumQuery(nums);
export const createRangeSumQuery2D = (matrix: number[][]) => new QuantumRangeSumQuery2D(matrix);
