/**
 * Quantum Gaussian Elimination
 */
import { EventEmitter } from 'events';
export class QuantumGaussian extends EventEmitter {
    private static instance: QuantumGaussian;
    private constructor() { super(); }
    static getInstance(): QuantumGaussian { if (!QuantumGaussian.instance) { QuantumGaussian.instance = new QuantumGaussian(); } return QuantumGaussian.instance; }
    solve(matrix: number[][]): number[] | null { const n = matrix.length; const m = matrix[0].length - 1; const a = matrix.map(row => [...row]); for (let col = 0, row = 0; col < m && row < n; col++) { let maxRow = row; for (let i = row + 1; i < n; i++) if (Math.abs(a[i][col]) > Math.abs(a[maxRow][col])) maxRow = i; if (Math.abs(a[maxRow][col]) < 1e-9) continue;[a[row], a[maxRow]] = [a[maxRow], a[row]]; const pivot = a[row][col]; for (let j = col; j <= m; j++) a[row][j] /= pivot; for (let i = 0; i < n; i++) if (i !== row) { const factor = a[i][col]; for (let j = col; j <= m; j++) a[i][j] -= factor * a[row][j]; } row++; } const result = new Array(m).fill(0); for (let i = 0; i < n; i++) { let firstNonZero = -1; for (let j = 0; j < m; j++) if (Math.abs(a[i][j]) > 1e-9) { firstNonZero = j; break; } if (firstNonZero === -1 && Math.abs(a[i][m]) > 1e-9) return null; if (firstNonZero !== -1) result[firstNonZero] = a[i][m]; } return result; }
    determinant(matrix: number[][]): number { const n = matrix.length; const a = matrix.map(row => [...row]); let det = 1; for (let i = 0; i < n; i++) { let maxRow = i; for (let k = i + 1; k < n; k++) if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) maxRow = k; if (Math.abs(a[maxRow][i]) < 1e-9) return 0; if (i !== maxRow) { [a[i], a[maxRow]] = [a[maxRow], a[i]]; det *= -1; } det *= a[i][i]; for (let k = i + 1; k < n; k++) { const factor = a[k][i] / a[i][i]; for (let j = i; j < n; j++) a[k][j] -= factor * a[i][j]; } } return det; }
}
export const quantumGaussian = QuantumGaussian.getInstance();
