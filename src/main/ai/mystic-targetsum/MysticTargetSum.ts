/**
 * Mystic Target Sum
 */
import { EventEmitter } from 'events';
export class MysticTargetSum extends EventEmitter {
    private static instance: MysticTargetSum;
    private constructor() { super(); }
    static getInstance(): MysticTargetSum { if (!MysticTargetSum.instance) { MysticTargetSum.instance = new MysticTargetSum(); } return MysticTargetSum.instance; }
    findTargetSumWays(nums: number[], target: number): number { const sum = nums.reduce((a, b) => a + b, 0); if ((sum + target) % 2 !== 0 || sum < Math.abs(target)) return 0; const pos = (sum + target) / 2; const dp = new Array(pos + 1).fill(0); dp[0] = 1; for (const num of nums) for (let j = pos; j >= num; j--) dp[j] += dp[j - num]; return dp[pos]; }
    lastStoneWeightII(stones: number[]): number { const sum = stones.reduce((a, b) => a + b, 0); const target = Math.floor(sum / 2); const dp = new Array(target + 1).fill(false); dp[0] = true; for (const stone of stones) for (let j = target; j >= stone; j--) dp[j] = dp[j] || dp[j - stone]; for (let i = target; i >= 0; i--) if (dp[i]) return sum - 2 * i; return 0; }
    countBits(n: number): number[] { const result = new Array(n + 1).fill(0); for (let i = 1; i <= n; i++) result[i] = result[i >> 1] + (i & 1); return result; }
}
export const mysticTargetSum = MysticTargetSum.getInstance();
