/**
 * Dimensional Longest Increasing Subsequence
 */
import { EventEmitter } from 'events';
export class DimensionalLIS extends EventEmitter {
    private static instance: DimensionalLIS;
    private constructor() { super(); }
    static getInstance(): DimensionalLIS { if (!DimensionalLIS.instance) { DimensionalLIS.instance = new DimensionalLIS(); } return DimensionalLIS.instance; }
    lengthOfLIS(nums: number[]): number { const tails: number[] = []; for (const num of nums) { let lo = 0, hi = tails.length; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (tails[mid] < num) lo = mid + 1; else hi = mid; } if (lo === tails.length) tails.push(num); else tails[lo] = num; } return tails.length; }
    findNumberOfLIS(nums: number[]): number { const n = nums.length; if (n === 0) return 0; const lengths = new Array(n).fill(1); const counts = new Array(n).fill(1); for (let i = 1; i < n; i++) { for (let j = 0; j < i; j++) { if (nums[j] < nums[i]) { if (lengths[j] + 1 > lengths[i]) { lengths[i] = lengths[j] + 1; counts[i] = counts[j]; } else if (lengths[j] + 1 === lengths[i]) { counts[i] += counts[j]; } } } } const maxLen = Math.max(...lengths); let result = 0; for (let i = 0; i < n; i++) if (lengths[i] === maxLen) result += counts[i]; return result; }
    longestCommonSubsequence(text1: string, text2: string): number { const m = text1.length, n = text2.length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = text1[i - 1] === text2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]); return dp[m][n]; }
}
export const dimensionalLIS = DimensionalLIS.getInstance();
