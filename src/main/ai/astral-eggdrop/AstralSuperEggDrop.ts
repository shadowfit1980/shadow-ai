/**
 * Astral Super Egg Drop
 */
import { EventEmitter } from 'events';
export class AstralSuperEggDrop extends EventEmitter {
    private static instance: AstralSuperEggDrop;
    private constructor() { super(); }
    static getInstance(): AstralSuperEggDrop { if (!AstralSuperEggDrop.instance) { AstralSuperEggDrop.instance = new AstralSuperEggDrop(); } return AstralSuperEggDrop.instance; }
    superEggDrop(k: number, n: number): number { const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0)); let m = 0; while (dp[m][k] < n) { m++; for (let j = 1; j <= k; j++) { dp[m][j] = dp[m - 1][j - 1] + dp[m - 1][j] + 1; } } return m; }
    eggDropDP(k: number, n: number): number { const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= k; i++) dp[i][1] = 1; for (let j = 1; j <= n; j++) dp[1][j] = j; for (let i = 2; i <= k; i++) { for (let j = 2; j <= n; j++) { let lo = 1, hi = j, result = j; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); const b = dp[i - 1][mid - 1]; const nb = dp[i][j - mid]; if (b < nb) { lo = mid + 1; result = Math.min(result, nb + 1); } else { hi = mid - 1; result = Math.min(result, b + 1); } } dp[i][j] = result; } } return dp[k][n]; }
}
export const astralSuperEggDrop = AstralSuperEggDrop.getInstance();
