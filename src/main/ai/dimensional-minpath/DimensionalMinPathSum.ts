/**
 * Dimensional Min Path Sum
 */
import { EventEmitter } from 'events';
export class DimensionalMinPathSum extends EventEmitter {
    private static instance: DimensionalMinPathSum;
    private constructor() { super(); }
    static getInstance(): DimensionalMinPathSum { if (!DimensionalMinPathSum.instance) { DimensionalMinPathSum.instance = new DimensionalMinPathSum(); } return DimensionalMinPathSum.instance; }
    minPathSum(grid: number[][]): number { const m = grid.length, n = grid[0].length; const dp: number[][] = Array.from({ length: m }, () => Array(n).fill(0)); dp[0][0] = grid[0][0]; for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0]; for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j]; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]); return dp[m - 1][n - 1]; }
    getStats(): { solves: number } { return { solves: 0 }; }
}
export const dimensionalMinPathSum = DimensionalMinPathSum.getInstance();
