/**
 * Astral Distinct Subsequences
 */
import { EventEmitter } from 'events';
export class AstralDistinctSubseq extends EventEmitter {
    private static instance: AstralDistinctSubseq;
    private constructor() { super(); }
    static getInstance(): AstralDistinctSubseq { if (!AstralDistinctSubseq.instance) { AstralDistinctSubseq.instance = new AstralDistinctSubseq(); } return AstralDistinctSubseq.instance; }
    numDistinct(s: string, t: string): number { const m = s.length, n = t.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 0; i <= m; i++) dp[i][0] = 1; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { dp[i][j] = dp[i - 1][j]; if (s[i - 1] === t[j - 1]) dp[i][j] += dp[i - 1][j - 1]; } } return dp[m][n]; }
    distinctSubsequencesII(s: string): number { const MOD = 1e9 + 7; const n = s.length; const dp = new Array(n + 1).fill(0); dp[0] = 1; const last: Map<string, number> = new Map(); for (let i = 1; i <= n; i++) { const c = s[i - 1]; dp[i] = (2 * dp[i - 1]) % MOD; if (last.has(c)) dp[i] = (dp[i] - dp[last.get(c)! - 1] + MOD) % MOD; last.set(c, i); } return (dp[n] - 1 + MOD) % MOD; }
}
export const astralDistinctSubseq = AstralDistinctSubseq.getInstance();
