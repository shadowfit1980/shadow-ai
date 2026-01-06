/**
 * Dimensional Unique Paths
 */
import { EventEmitter } from 'events';
export class DimensionalUniquePaths extends EventEmitter {
    private static instance: DimensionalUniquePaths;
    private constructor() { super(); }
    static getInstance(): DimensionalUniquePaths { if (!DimensionalUniquePaths.instance) { DimensionalUniquePaths.instance = new DimensionalUniquePaths(); } return DimensionalUniquePaths.instance; }
    uniquePaths(m: number, n: number): number { const dp = Array.from({ length: m }, () => new Array(n).fill(1)); for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[i][j] = dp[i - 1][j] + dp[i][j - 1]; return dp[m - 1][n - 1]; }
    uniquePathsWithObstacles(grid: number[][]): number { const m = grid.length, n = grid[0].length; if (grid[0][0] === 1 || grid[m - 1][n - 1] === 1) return 0; const dp = Array.from({ length: m }, () => new Array(n).fill(0)); dp[0][0] = 1; for (let i = 1; i < m; i++) dp[i][0] = grid[i][0] === 1 ? 0 : dp[i - 1][0]; for (let j = 1; j < n; j++) dp[0][j] = grid[0][j] === 1 ? 0 : dp[0][j - 1]; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[i][j] = grid[i][j] === 1 ? 0 : dp[i - 1][j] + dp[i][j - 1]; return dp[m - 1][n - 1]; }
    minPathSum(grid: number[][]): number { const m = grid.length, n = grid[0].length; const dp = Array.from({ length: m }, () => new Array(n)); dp[0][0] = grid[0][0]; for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0]; for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j]; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + grid[i][j]; return dp[m - 1][n - 1]; }
}
export const dimensionalUniquePaths = DimensionalUniquePaths.getInstance();
