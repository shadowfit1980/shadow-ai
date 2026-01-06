/**
 * Astral Super Egg Drop
 */
import { EventEmitter } from 'events';
export class AstralSuperEggDrop extends EventEmitter {
    private static instance: AstralSuperEggDrop;
    private constructor() { super(); }
    static getInstance(): AstralSuperEggDrop { if (!AstralSuperEggDrop.instance) { AstralSuperEggDrop.instance = new AstralSuperEggDrop(); } return AstralSuperEggDrop.instance; }
    superEggDrop(k: number, n: number): number { const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0)); let m = 0; while (dp[k][m] < n) { m++; for (let i = 1; i <= k; i++) dp[i][m] = dp[i][m - 1] + dp[i - 1][m - 1] + 1; } return m; }
    eggDropClassic(k: number, n: number): number { const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0)); for (let j = 1; j <= n; j++) dp[1][j] = j; for (let i = 2; i <= k; i++) { for (let j = 1; j <= n; j++) { dp[i][j] = Infinity; let lo = 1, hi = j; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); const worst = 1 + Math.max(dp[i - 1][mid - 1], dp[i][j - mid]); dp[i][j] = Math.min(dp[i][j], worst); if (dp[i - 1][mid - 1] < dp[i][j - mid]) lo = mid + 1; else hi = mid - 1; } } } return dp[k][n]; }
}
export const astralSuperEggDrop = AstralSuperEggDrop.getInstance();
