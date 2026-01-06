/**
 * Mystic Minimum Path Grid
 */
import { EventEmitter } from 'events';
export class MysticMinPathGrid extends EventEmitter {
    private static instance: MysticMinPathGrid;
    private constructor() { super(); }
    static getInstance(): MysticMinPathGrid { if (!MysticMinPathGrid.instance) { MysticMinPathGrid.instance = new MysticMinPathGrid(); } return MysticMinPathGrid.instance; }
    minPathSum(grid: number[][]): number { const m = grid.length, n = grid[0].length; for (let i = 1; i < m; i++) grid[i][0] += grid[i - 1][0]; for (let j = 1; j < n; j++) grid[0][j] += grid[0][j - 1]; for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]); return grid[m - 1][n - 1]; }
    uniquePaths(m: number, n: number): number { const dp = new Array(n).fill(1); for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) dp[j] += dp[j - 1]; return dp[n - 1]; }
    uniquePathsWithObstacles(obstacleGrid: number[][]): number { const m = obstacleGrid.length, n = obstacleGrid[0].length; if (obstacleGrid[0][0] === 1) return 0; const dp = new Array(n).fill(0); dp[0] = 1; for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { if (obstacleGrid[i][j] === 1) dp[j] = 0; else if (j > 0) dp[j] += dp[j - 1]; } } return dp[n - 1]; }
}
export const mysticMinPathGrid = MysticMinPathGrid.getInstance();
