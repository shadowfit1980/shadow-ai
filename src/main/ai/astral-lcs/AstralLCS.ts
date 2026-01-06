/**
 * Astral Longest Common Substring
 */
import { EventEmitter } from 'events';
export class AstralLCS extends EventEmitter {
    private static instance: AstralLCS;
    private constructor() { super(); }
    static getInstance(): AstralLCS { if (!AstralLCS.instance) { AstralLCS.instance = new AstralLCS(); } return AstralLCS.instance; }
    longestCommonSubstring(a: string, b: string): string { const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0)); let maxLen = 0, endIdx = 0; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; if (dp[i][j] > maxLen) { maxLen = dp[i][j]; endIdx = i; } } return a.slice(endIdx - maxLen, endIdx); }
    longestCommonSubsequence(a: string, b: string): string { const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0)); for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); let lcs = '', i = a.length, j = b.length; while (i > 0 && j > 0) { if (a[i - 1] === b[j - 1]) { lcs = a[i - 1] + lcs; i--; j--; } else if (dp[i - 1][j] > dp[i][j - 1]) i--; else j--; } return lcs; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const astralLCS = AstralLCS.getInstance();
