/**
 * Mystic LIS (Longest Increasing Subsequence)
 */
import { EventEmitter } from 'events';
export class MysticLIS extends EventEmitter {
    private static instance: MysticLIS;
    private constructor() { super(); }
    static getInstance(): MysticLIS { if (!MysticLIS.instance) { MysticLIS.instance = new MysticLIS(); } return MysticLIS.instance; }
    lengthNlogN(arr: number[]): number { const tails: number[] = []; for (const x of arr) { let l = 0, r = tails.length; while (l < r) { const m = Math.floor((l + r) / 2); if (tails[m] < x) l = m + 1; else r = m; } if (l === tails.length) tails.push(x); else tails[l] = x; } return tails.length; }
    sequence(arr: number[]): number[] { const n = arr.length; if (n === 0) return []; const tails: number[] = []; const indices: number[] = []; const parents = new Array(n).fill(-1); for (let i = 0; i < n; i++) { let l = 0, r = tails.length; while (l < r) { const m = Math.floor((l + r) / 2); if (arr[indices[m]] < arr[i]) l = m + 1; else r = m; } if (l > 0) parents[i] = indices[l - 1]; if (l === tails.length) { tails.push(arr[i]); indices.push(i); } else { tails[l] = arr[i]; indices[l] = i; } } const result: number[] = []; for (let i = indices[indices.length - 1]; i !== -1; i = parents[i]) result.unshift(arr[i]); return result; }
    countLIS(arr: number[]): number { const n = arr.length; if (n === 0) return 0; const dp = new Array(n).fill(1); const count = new Array(n).fill(1); for (let i = 1; i < n; i++) { for (let j = 0; j < i; j++) { if (arr[j] < arr[i]) { if (dp[j] + 1 > dp[i]) { dp[i] = dp[j] + 1; count[i] = count[j]; } else if (dp[j] + 1 === dp[i]) { count[i] += count[j]; } } } } const maxLen = Math.max(...dp); let total = 0; for (let i = 0; i < n; i++) if (dp[i] === maxLen) total += count[i]; return total; }
}
export const mysticLIS = MysticLIS.getInstance();
