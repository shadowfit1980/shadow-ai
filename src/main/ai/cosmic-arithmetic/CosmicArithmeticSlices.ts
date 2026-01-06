/**
 * Cosmic Arithmetic Slices
 */
import { EventEmitter } from 'events';
export class CosmicArithmeticSlices extends EventEmitter {
    private static instance: CosmicArithmeticSlices;
    private constructor() { super(); }
    static getInstance(): CosmicArithmeticSlices { if (!CosmicArithmeticSlices.instance) { CosmicArithmeticSlices.instance = new CosmicArithmeticSlices(); } return CosmicArithmeticSlices.instance; }
    numberOfArithmeticSlices(nums: number[]): number { const n = nums.length; if (n < 3) return 0; let dp = 0, sum = 0; for (let i = 2; i < n; i++) { if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) { dp++; sum += dp; } else { dp = 0; } } return sum; }
    numberOfArithmeticSlicesII(nums: number[]): number { const n = nums.length; const dp: Map<number, number>[] = Array.from({ length: n }, () => new Map()); let total = 0; for (let i = 1; i < n; i++) { for (let j = 0; j < i; j++) { const diff = nums[i] - nums[j]; const count = dp[j].get(diff) || 0; total += count; dp[i].set(diff, (dp[i].get(diff) || 0) + count + 1); } } return total; }
    longestArithmeticSequence(nums: number[]): number { const n = nums.length; const dp: Map<number, number>[] = Array.from({ length: n }, () => new Map()); let maxLen = 0; for (let i = 1; i < n; i++) { for (let j = 0; j < i; j++) { const diff = nums[i] - nums[j]; const len = (dp[j].get(diff) || 1) + 1; dp[i].set(diff, len); maxLen = Math.max(maxLen, len); } } return maxLen; }
}
export const cosmicArithmeticSlices = CosmicArithmeticSlices.getInstance();
