/**
 * Dimensional Dungeon Game
 */
import { EventEmitter } from 'events';
export class DimensionalDungeonGame extends EventEmitter {
    private static instance: DimensionalDungeonGame;
    private constructor() { super(); }
    static getInstance(): DimensionalDungeonGame { if (!DimensionalDungeonGame.instance) { DimensionalDungeonGame.instance = new DimensionalDungeonGame(); } return DimensionalDungeonGame.instance; }
    calculateMinHP(dungeon: number[][]): number { const m = dungeon.length, n = dungeon[0].length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(Infinity)); dp[m][n - 1] = dp[m - 1][n] = 1; for (let i = m - 1; i >= 0; i--) { for (let j = n - 1; j >= 0; j--) { const minHp = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]; dp[i][j] = Math.max(minHp, 1); } } return dp[0][0]; }
    maxCherries(grid: number[][]): number { const n = grid.length; const dp = Array.from({ length: n }, () => Array.from({ length: n }, () => new Array(n).fill(-Infinity))); dp[0][0][0] = grid[0][0]; for (let step = 1; step < 2 * n - 2; step++) { const newDp = Array.from({ length: n }, () => Array.from({ length: n }, () => new Array(n).fill(-Infinity))); for (let r1 = 0; r1 < n && r1 <= step; r1++) { for (let r2 = 0; r2 < n && r2 <= step; r2++) { const c1 = step - r1, c2 = step - r2; if (c1 < 0 || c1 >= n || c2 < 0 || c2 >= n) continue; if (grid[r1][c1] === -1 || grid[r2][c2] === -1) continue; for (const dr1 of [0, 1]) { for (const dr2 of [0, 1]) { const pr1 = r1 - dr1, pc1 = c1 - (1 - dr1); const pr2 = r2 - dr2, pc2 = c2 - (1 - dr2); if (pr1 < 0 || pc1 < 0 || pr2 < 0 || pc2 < 0) continue; let val = dp[pr1][pc1][pr2]; if (val === -Infinity) continue; val += grid[r1][c1]; if (r1 !== r2 || c1 !== c2) val += grid[r2][c2]; newDp[r1][c1][r2] = Math.max(newDp[r1][c1][r2], val); } } } } for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) dp[i][j][k] = newDp[i][j][k]; } return Math.max(0, dp[n - 1][n - 1][n - 1]); }
}
export const dimensionalDungeonGame = DimensionalDungeonGame.getInstance();
