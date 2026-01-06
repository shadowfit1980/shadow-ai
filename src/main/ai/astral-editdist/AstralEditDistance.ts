/**
 * Astral Edit Distance
 */
import { EventEmitter } from 'events';
export class AstralEditDistance extends EventEmitter {
    private static instance: AstralEditDistance;
    private constructor() { super(); }
    static getInstance(): AstralEditDistance { if (!AstralEditDistance.instance) { AstralEditDistance.instance = new AstralEditDistance(); } return AstralEditDistance.instance; }
    distance(s1: string, s2: string): number { const m = s1.length, n = s2.length; const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); return dp[m][n]; }
    spaceOptimized(s1: string, s2: string): number { const m = s1.length, n = s2.length; let prev = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const curr = [i]; for (let j = 1; j <= n; j++) curr.push(s1[i - 1] === s2[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])); prev = curr; } return prev[n]; }
    operations(s1: string, s2: string): { type: 'insert' | 'delete' | 'replace' | 'match'; char: string }[] { const m = s1.length, n = s2.length; const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); const ops: { type: 'insert' | 'delete' | 'replace' | 'match'; char: string }[] = []; let i = m, j = n; while (i > 0 || j > 0) { if (i > 0 && j > 0 && s1[i - 1] === s2[j - 1]) { ops.unshift({ type: 'match', char: s1[i - 1] }); i--; j--; } else if (j > 0 && (i === 0 || dp[i][j - 1] <= dp[i - 1][j] && dp[i][j - 1] <= dp[i - 1][j - 1])) { ops.unshift({ type: 'insert', char: s2[j - 1] }); j--; } else if (i > 0 && (j === 0 || dp[i - 1][j] <= dp[i - 1][j - 1])) { ops.unshift({ type: 'delete', char: s1[i - 1] }); i--; } else { ops.unshift({ type: 'replace', char: s2[j - 1] }); i--; j--; } } return ops; }
}
export const astralEditDistance = AstralEditDistance.getInstance();
