/**
 * Cosmic Set Matrix Zeroes
 */
import { EventEmitter } from 'events';
export class CosmicSetMatrixZeroes extends EventEmitter {
    private static instance: CosmicSetMatrixZeroes;
    private constructor() { super(); }
    static getInstance(): CosmicSetMatrixZeroes { if (!CosmicSetMatrixZeroes.instance) { CosmicSetMatrixZeroes.instance = new CosmicSetMatrixZeroes(); } return CosmicSetMatrixZeroes.instance; }
    setZeroes(matrix: number[][]): void { const m = matrix.length, n = matrix[0].length; let firstRowZero = false, firstColZero = false; for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRowZero = true; for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstColZero = true; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0; } for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0; if (firstRowZero) for (let j = 0; j < n; j++) matrix[0][j] = 0; if (firstColZero) for (let i = 0; i < m; i++) matrix[i][0] = 0; }
    getStats(): { processed: number } { return { processed: 0 }; }
}
export const cosmicSetMatrixZeroes = CosmicSetMatrixZeroes.getInstance();
