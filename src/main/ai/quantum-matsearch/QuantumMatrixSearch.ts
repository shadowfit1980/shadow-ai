/**
 * Quantum Matrix Search
 */
import { EventEmitter } from 'events';
export class QuantumMatrixSearch extends EventEmitter {
    private static instance: QuantumMatrixSearch;
    private constructor() { super(); }
    static getInstance(): QuantumMatrixSearch { if (!QuantumMatrixSearch.instance) { QuantumMatrixSearch.instance = new QuantumMatrixSearch(); } return QuantumMatrixSearch.instance; }
    searchMatrix(matrix: number[][], target: number): boolean { if (matrix.length === 0 || matrix[0].length === 0) return false; const m = matrix.length, n = matrix[0].length; let left = 0, right = m * n - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); const val = matrix[Math.floor(mid / n)][mid % n]; if (val === target) return true; if (val < target) left = mid + 1; else right = mid - 1; } return false; }
    searchMatrixII(matrix: number[][], target: number): boolean { if (matrix.length === 0 || matrix[0].length === 0) return false; let row = 0, col = matrix[0].length - 1; while (row < matrix.length && col >= 0) { if (matrix[row][col] === target) return true; if (matrix[row][col] > target) col--; else row++; } return false; }
    kthSmallest(matrix: number[][], k: number): number { const n = matrix.length; let lo = matrix[0][0], hi = matrix[n - 1][n - 1]; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); let count = 0, j = n - 1; for (let i = 0; i < n; i++) { while (j >= 0 && matrix[i][j] > mid) j--; count += j + 1; } if (count < k) lo = mid + 1; else hi = mid; } return lo; }
}
export const quantumMatrixSearch = QuantumMatrixSearch.getInstance();
