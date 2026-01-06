/**
 * Cosmic N-Queens
 */
import { EventEmitter } from 'events';
export class CosmicNQueens extends EventEmitter {
    private static instance: CosmicNQueens;
    private constructor() { super(); }
    static getInstance(): CosmicNQueens { if (!CosmicNQueens.instance) { CosmicNQueens.instance = new CosmicNQueens(); } return CosmicNQueens.instance; }
    solveNQueens(n: number): string[][] { const result: string[][] = []; const board = Array.from({ length: n }, () => '.'.repeat(n)); const cols = new Set<number>(); const diag1 = new Set<number>(); const diag2 = new Set<number>(); const backtrack = (row: number): void => { if (row === n) { result.push([...board]); return; } for (let col = 0; col < n; col++) { if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue; cols.add(col); diag1.add(row - col); diag2.add(row + col); board[row] = '.'.repeat(col) + 'Q' + '.'.repeat(n - col - 1); backtrack(row + 1); cols.delete(col); diag1.delete(row - col); diag2.delete(row + col); } }; backtrack(0); return result; }
    totalNQueens(n: number): number { let count = 0; const cols = new Set<number>(); const diag1 = new Set<number>(); const diag2 = new Set<number>(); const backtrack = (row: number): void => { if (row === n) { count++; return; } for (let col = 0; col < n; col++) { if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue; cols.add(col); diag1.add(row - col); diag2.add(row + col); backtrack(row + 1); cols.delete(col); diag1.delete(row - col); diag2.delete(row + col); } }; backtrack(0); return count; }
}
export const cosmicNQueens = CosmicNQueens.getInstance();
