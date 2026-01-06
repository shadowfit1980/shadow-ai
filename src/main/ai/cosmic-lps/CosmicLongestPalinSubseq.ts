/**
 * Cosmic Longest Palindromic Subsequence
 */
import { EventEmitter } from 'events';
export class CosmicLongestPalinSubseq extends EventEmitter {
    private static instance: CosmicLongestPalinSubseq;
    private constructor() { super(); }
    static getInstance(): CosmicLongestPalinSubseq { if (!CosmicLongestPalinSubseq.instance) { CosmicLongestPalinSubseq.instance = new CosmicLongestPalinSubseq(); } return CosmicLongestPalinSubseq.instance; }
    longestPalindromeSubseq(s: string): number { const n = s.length; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = n - 1; i >= 0; i--) { dp[i][i] = 1; for (let j = i + 1; j < n; j++) { if (s[i] === s[j]) dp[i][j] = dp[i + 1][j - 1] + 2; else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]); } } return dp[0][n - 1]; }
    minInsertions(s: string): number { return s.length - this.longestPalindromeSubseq(s); }
    shortestPalindrome(s: string): string { const rev = s.split('').reverse().join(''); for (let i = 0; i <= s.length; i++) { if (s.startsWith(rev.slice(i))) return rev.slice(0, i) + s; } return ''; }
    makePalindromeByDeletions(s: string): boolean { let deletions = s.length - this.longestPalindromeSubseq(s); return deletions <= 1; }
}
export const cosmicLongestPalinSubseq = CosmicLongestPalinSubseq.getInstance();
