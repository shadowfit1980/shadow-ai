/**
 * Dimensional Wildcard Matching
 */
import { EventEmitter } from 'events';
export class DimensionalWildcardMatch extends EventEmitter {
    private static instance: DimensionalWildcardMatch;
    private constructor() { super(); }
    static getInstance(): DimensionalWildcardMatch { if (!DimensionalWildcardMatch.instance) { DimensionalWildcardMatch.instance = new DimensionalWildcardMatch(); } return DimensionalWildcardMatch.instance; }
    isMatch(s: string, p: string): boolean { const m = s.length, n = p.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (p[j - 1] === '*') dp[0][j] = dp[0][j - 1]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (p[j - 1] === '*') { dp[i][j] = dp[i - 1][j] || dp[i][j - 1]; } else if (p[j - 1] === '?' || s[i - 1] === p[j - 1]) { dp[i][j] = dp[i - 1][j - 1]; } } } return dp[m][n]; }
    isMatchRegex(s: string, p: string): boolean { const m = s.length, n = p.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let j = 1; j <= n; j++) if (p[j - 1] === '*' && j >= 2) dp[0][j] = dp[0][j - 2]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (p[j - 1] === '*') { dp[i][j] = dp[i][j - 2] || (dp[i - 1][j] && (p[j - 2] === '.' || p[j - 2] === s[i - 1])); } else if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) { dp[i][j] = dp[i - 1][j - 1]; } } } return dp[m][n]; }
}
export const dimensionalWildcardMatch = DimensionalWildcardMatch.getInstance();
