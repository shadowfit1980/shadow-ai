/**
 * Dimensional Simplex Method
 */
import { EventEmitter } from 'events';
export class DimensionalSimplex extends EventEmitter {
    private static instance: DimensionalSimplex;
    private constructor() { super(); }
    static getInstance(): DimensionalSimplex { if (!DimensionalSimplex.instance) { DimensionalSimplex.instance = new DimensionalSimplex(); } return DimensionalSimplex.instance; }
    maximize(c: number[], A: number[][], b: number[]): { optimal: number; solution: number[] } | null { const m = A.length, n = c.length; const tableau = Array.from({ length: m + 1 }, () => new Array(n + m + 1).fill(0)); for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) tableau[i][j] = A[i][j]; tableau[i][n + i] = 1; tableau[i][n + m] = b[i]; } for (let j = 0; j < n; j++) tableau[m][j] = -c[j]; while (true) { let pivotCol = -1; for (let j = 0; j < n + m; j++) if (tableau[m][j] < -1e-9) { pivotCol = j; break; } if (pivotCol === -1) break; let pivotRow = -1, minRatio = Infinity; for (let i = 0; i < m; i++) if (tableau[i][pivotCol] > 1e-9) { const ratio = tableau[i][n + m] / tableau[i][pivotCol]; if (ratio < minRatio) { minRatio = ratio; pivotRow = i; } } if (pivotRow === -1) return null; const pivot = tableau[pivotRow][pivotCol]; for (let j = 0; j <= n + m; j++) tableau[pivotRow][j] /= pivot; for (let i = 0; i <= m; i++) if (i !== pivotRow) { const factor = tableau[i][pivotCol]; for (let j = 0; j <= n + m; j++) tableau[i][j] -= factor * tableau[pivotRow][j]; } } const solution = new Array(n).fill(0); for (let j = 0; j < n; j++) { let basicRow = -1; for (let i = 0; i < m; i++) if (Math.abs(tableau[i][j] - 1) < 1e-9) { let isBasic = true; for (let k = 0; k < m; k++) if (k !== i && Math.abs(tableau[k][j]) > 1e-9) isBasic = false; if (isBasic) basicRow = i; } if (basicRow !== -1) solution[j] = tableau[basicRow][n + m]; } return { optimal: tableau[m][n + m], solution }; }
}
export const dimensionalSimplex = DimensionalSimplex.getInstance();
