/**
 * Quantum Edit Distance
 */
import { EventEmitter } from 'events';
export class QuantumEditDistance extends EventEmitter {
    private static instance: QuantumEditDistance;
    private constructor() { super(); }
    static getInstance(): QuantumEditDistance { if (!QuantumEditDistance.instance) { QuantumEditDistance.instance = new QuantumEditDistance(); } return QuantumEditDistance.instance; }
    minDistance(word1: string, word2: string): number { const m = word1.length, n = word2.length; const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1]; else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); } } return dp[m][n]; }
    deleteOperationForTwoStrings(word1: string, word2: string): number { const lcs = this.longestCommonSubsequence(word1, word2); return word1.length + word2.length - 2 * lcs; }
    private longestCommonSubsequence(text1: string, text2: string): number { const m = text1.length, n = text2.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = text1[i - 1] === text2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); return dp[m][n]; }
    isOneEditDistance(s: string, t: string): boolean { const m = s.length, n = t.length; if (Math.abs(m - n) > 1) return false; for (let i = 0; i < Math.min(m, n); i++) { if (s[i] !== t[i]) { if (m === n) return s.slice(i + 1) === t.slice(i + 1); return m > n ? s.slice(i + 1) === t.slice(i) : s.slice(i) === t.slice(i + 1); } } return Math.abs(m - n) === 1; }
}
export const quantumEditDistance = QuantumEditDistance.getInstance();
