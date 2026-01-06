/**
 * Astral Matrix Spiral
 */
import { EventEmitter } from 'events';
export class AstralMatrixSpiral extends EventEmitter {
    private static instance: AstralMatrixSpiral;
    private constructor() { super(); }
    static getInstance(): AstralMatrixSpiral { if (!AstralMatrixSpiral.instance) { AstralMatrixSpiral.instance = new AstralMatrixSpiral(); } return AstralMatrixSpiral.instance; }
    spiralOrder(matrix: number[][]): number[] { if (matrix.length === 0) return []; const result: number[] = []; let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1; while (top <= bottom && left <= right) { for (let i = left; i <= right; i++) result.push(matrix[top][i]); top++; for (let i = top; i <= bottom; i++) result.push(matrix[i][right]); right--; if (top <= bottom) { for (let i = right; i >= left; i--) result.push(matrix[bottom][i]); bottom--; } if (left <= right) { for (let i = bottom; i >= top; i--) result.push(matrix[i][left]); left++; } } return result; }
    generateMatrix(n: number): number[][] { const matrix = Array.from({ length: n }, () => new Array(n)); let num = 1, top = 0, bottom = n - 1, left = 0, right = n - 1; while (top <= bottom && left <= right) { for (let i = left; i <= right; i++) matrix[top][i] = num++; top++; for (let i = top; i <= bottom; i++) matrix[i][right] = num++; right--; for (let i = right; i >= left; i--) matrix[bottom][i] = num++; bottom--; for (let i = bottom; i >= top; i--) matrix[i][left] = num++; left++; } return matrix; }
    setZeroes(matrix: number[][]): void { const m = matrix.length, n = matrix[0].length; let firstRowZero = false, firstColZero = false; for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRowZero = true; for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstColZero = true; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; } for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0; if (firstRowZero) for (let j = 0; j < n; j++) matrix[0][j] = 0; if (firstColZero) for (let i = 0; i < m; i++) matrix[i][0] = 0; }
}
export const astralMatrixSpiral = AstralMatrixSpiral.getInstance();
