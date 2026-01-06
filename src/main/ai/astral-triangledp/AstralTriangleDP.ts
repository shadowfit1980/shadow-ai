/**
 * Astral Triangle DP
 */
import { EventEmitter } from 'events';
export class AstralTriangleDP extends EventEmitter {
    private static instance: AstralTriangleDP;
    private constructor() { super(); }
    static getInstance(): AstralTriangleDP { if (!AstralTriangleDP.instance) { AstralTriangleDP.instance = new AstralTriangleDP(); } return AstralTriangleDP.instance; }
    minimumTotal(triangle: number[][]): number { const n = triangle.length; const dp = [...triangle[n - 1]]; for (let i = n - 2; i >= 0; i--) for (let j = 0; j <= i; j++) dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]); return dp[0]; }
    maxFallingPath(matrix: number[][]): number { const n = matrix.length; for (let i = 1; i < n; i++) { for (let j = 0; j < n; j++) { let best = matrix[i - 1][j]; if (j > 0) best = Math.max(best, matrix[i - 1][j - 1]); if (j < n - 1) best = Math.max(best, matrix[i - 1][j + 1]); matrix[i][j] += best; } } return Math.max(...matrix[n - 1]); }
    minFallingPathSum(matrix: number[][]): number { const n = matrix.length; for (let i = 1; i < n; i++) { for (let j = 0; j < n; j++) { let best = matrix[i - 1][j]; if (j > 0) best = Math.min(best, matrix[i - 1][j - 1]); if (j < n - 1) best = Math.min(best, matrix[i - 1][j + 1]); matrix[i][j] += best; } } return Math.min(...matrix[n - 1]); }
}
export const astralTriangleDP = AstralTriangleDP.getInstance();
