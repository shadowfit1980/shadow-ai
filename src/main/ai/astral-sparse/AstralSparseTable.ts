/**
 * Astral Sparse Table
 */
import { EventEmitter } from 'events';
export class AstralSparseTable extends EventEmitter {
    private static instance: AstralSparseTable;
    private table: number[][] = [];
    private log: number[] = [];
    private constructor() { super(); }
    static getInstance(): AstralSparseTable { if (!AstralSparseTable.instance) { AstralSparseTable.instance = new AstralSparseTable(); } return AstralSparseTable.instance; }
    build(arr: number[]): void { const n = arr.length; const k = Math.floor(Math.log2(n)) + 1; this.table = Array.from({ length: n }, (_, i) => [arr[i]] as number[]); for (let j = 1; j <= k; j++) for (let i = 0; i + (1 << j) <= n; i++) this.table[i][j] = Math.min(this.table[i][j - 1], this.table[i + (1 << (j - 1))][j - 1]); this.log = new Array(n + 1).fill(0); for (let i = 2; i <= n; i++) this.log[i] = this.log[i >> 1] + 1; }
    query(l: number, r: number): number { const j = this.log[r - l + 1]; return Math.min(this.table[l][j], this.table[r - (1 << j) + 1][j]); }
    getStats(): { size: number } { return { size: this.table.length }; }
}
export const astralSparseTable = AstralSparseTable.getInstance();
