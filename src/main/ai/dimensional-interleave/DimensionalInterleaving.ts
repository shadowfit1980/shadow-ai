/**
 * Dimensional Interleaving String
 */
import { EventEmitter } from 'events';
export class DimensionalInterleaving extends EventEmitter {
    private static instance: DimensionalInterleaving;
    private constructor() { super(); }
    static getInstance(): DimensionalInterleaving { if (!DimensionalInterleaving.instance) { DimensionalInterleaving.instance = new DimensionalInterleaving(); } return DimensionalInterleaving.instance; }
    isInterleave(s1: string, s2: string, s3: string): boolean { const m = s1.length, n = s2.length; if (m + n !== s3.length) return false; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1]; for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1]; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) || (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]); return dp[m][n]; }
    distinctSubsequences(s: string, t: string): number { const m = s.length, n = t.length; const dp = new Array(n + 1).fill(0); dp[0] = 1; for (let i = 1; i <= m; i++) for (let j = n; j >= 1; j--) if (s[i - 1] === t[j - 1]) dp[j] += dp[j - 1]; return dp[n]; }
}
export const dimensionalInterleaving = DimensionalInterleaving.getInstance();
