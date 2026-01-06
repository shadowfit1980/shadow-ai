/**
 * Dimensional Sudoku Solver
 */
import { EventEmitter } from 'events';
export class DimensionalSudokuSolver extends EventEmitter {
    private static instance: DimensionalSudokuSolver;
    private constructor() { super(); }
    static getInstance(): DimensionalSudokuSolver { if (!DimensionalSudokuSolver.instance) { DimensionalSudokuSolver.instance = new DimensionalSudokuSolver(); } return DimensionalSudokuSolver.instance; }
    solveSudoku(board: string[][]): boolean { return this.solve(board); }
    private solve(board: string[][]): boolean { for (let i = 0; i < 9; i++) { for (let j = 0; j < 9; j++) { if (board[i][j] === '.') { for (let c = 1; c <= 9; c++) { const char = String(c); if (this.isValid(board, i, j, char)) { board[i][j] = char; if (this.solve(board)) return true; board[i][j] = '.'; } } return false; } } } return true; }
    private isValid(board: string[][], row: number, col: number, c: string): boolean { for (let i = 0; i < 9; i++) { if (board[row][i] === c) return false; if (board[i][col] === c) return false; const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3); const boxCol = 3 * Math.floor(col / 3) + (i % 3); if (board[boxRow][boxCol] === c) return false; } return true; }
    isValidSudoku(board: string[][]): boolean { const rows = Array.from({ length: 9 }, () => new Set<string>()); const cols = Array.from({ length: 9 }, () => new Set<string>()); const boxes = Array.from({ length: 9 }, () => new Set<string>()); for (let i = 0; i < 9; i++) { for (let j = 0; j < 9; j++) { const c = board[i][j]; if (c === '.') continue; const boxIdx = 3 * Math.floor(i / 3) + Math.floor(j / 3); if (rows[i].has(c) || cols[j].has(c) || boxes[boxIdx].has(c)) return false; rows[i].add(c); cols[j].add(c); boxes[boxIdx].add(c); } } return true; }
}
export const dimensionalSudokuSolver = DimensionalSudokuSolver.getInstance();
