/**
 * Mystic Sparse Table
 */
import { EventEmitter } from 'events';
export class MysticSparseTable extends EventEmitter {
    private table: number[][] = [];
    private log: number[];
    private n: number;
    private op: (a: number, b: number) => number;
    constructor(arr: number[], op: (a: number, b: number) => number = Math.min) { super(); this.n = arr.length; this.op = op; const k = Math.floor(Math.log2(this.n)) + 1; this.table = Array.from({ length: k }, () => new Array(this.n)); this.log = new Array(this.n + 1); this.log[1] = 0; for (let i = 2; i <= this.n; i++) this.log[i] = this.log[Math.floor(i / 2)] + 1; for (let i = 0; i < this.n; i++) this.table[0][i] = arr[i]; for (let j = 1; j < k; j++) for (let i = 0; i + (1 << j) <= this.n; i++) this.table[j][i] = this.op(this.table[j - 1][i], this.table[j - 1][i + (1 << (j - 1))]); }
    query(l: number, r: number): number { const j = this.log[r - l + 1]; return this.op(this.table[j][l], this.table[j][r - (1 << j) + 1]); }
}
export const createSparseTable = (arr: number[], op?: (a: number, b: number) => number) => new MysticSparseTable(arr, op);
