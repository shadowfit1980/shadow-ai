/**
 * Cosmic Cherry Pickup
 */
import { EventEmitter } from 'events';
export class CosmicCherryPickup extends EventEmitter {
    private static instance: CosmicCherryPickup;
    private constructor() { super(); }
    static getInstance(): CosmicCherryPickup { if (!CosmicCherryPickup.instance) { CosmicCherryPickup.instance = new CosmicCherryPickup(); } return CosmicCherryPickup.instance; }
    cherryPickup(grid: number[][]): number { const n = grid.length; const dp = Array.from({ length: n }, () => Array.from({ length: n }, () => new Array(n).fill(-Infinity))); dp[0][0][0] = grid[0][0]; for (let t = 1; t < 2 * n - 1; t++) { for (let i1 = Math.max(0, t - n + 1); i1 <= Math.min(n - 1, t); i1++) { for (let i2 = Math.max(0, t - n + 1); i2 <= Math.min(n - 1, t); i2++) { const j1 = t - i1, j2 = t - i2; if (grid[i1][j1] === -1 || grid[i2][j2] === -1) continue; let val = grid[i1][j1]; if (i1 !== i2) val += grid[i2][j2]; for (const di1 of [0, 1]) { for (const di2 of [0, 1]) { const pi1 = i1 - di1, pj1 = j1 - (1 - di1); const pi2 = i2 - di2, pj2 = j2 - (1 - di2); if (pi1 >= 0 && pj1 >= 0 && pi2 >= 0 && pj2 >= 0) dp[i1][j1][i2] = Math.max(dp[i1][j1][i2], dp[pi1][pj1][pi2] + val); } } } } } return Math.max(0, dp[n - 1][n - 1][n - 1]); }
}
export const cosmicCherryPickup = CosmicCherryPickup.getInstance();
