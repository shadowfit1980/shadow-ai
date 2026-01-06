/**
 * Mystic Longest Common Prefix
 */
import { EventEmitter } from 'events';
export class MysticLongestCommonPrefix extends EventEmitter {
    private static instance: MysticLongestCommonPrefix;
    private constructor() { super(); }
    static getInstance(): MysticLongestCommonPrefix { if (!MysticLongestCommonPrefix.instance) { MysticLongestCommonPrefix.instance = new MysticLongestCommonPrefix(); } return MysticLongestCommonPrefix.instance; }
    longestCommonPrefix(strs: string[]): string { if (strs.length === 0) return ''; let prefix = strs[0]; for (let i = 1; i < strs.length; i++) { while (strs[i].indexOf(prefix) !== 0) { prefix = prefix.slice(0, -1); if (prefix === '') return ''; } } return prefix; }
    longestCommonPrefixBinary(strs: string[]): string { if (strs.length === 0) return ''; let minLen = Math.min(...strs.map(s => s.length)); let lo = 0, hi = minLen; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); if (this.isCommonPrefix(strs, mid)) lo = mid + 1; else hi = mid - 1; } return strs[0].slice(0, Math.floor((lo + hi) / 2)); }
    private isCommonPrefix(strs: string[], len: number): boolean { const prefix = strs[0].slice(0, len); return strs.every(s => s.startsWith(prefix)); }
    longestCommonSubstring(s1: string, s2: string): string { const m = s1.length, n = s2.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); let maxLen = 0, endIdx = 0; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (s1[i - 1] === s2[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; if (dp[i][j] > maxLen) { maxLen = dp[i][j]; endIdx = i; } } } } return s1.slice(endIdx - maxLen, endIdx); }
}
export const mysticLongestCommonPrefix = MysticLongestCommonPrefix.getInstance();
