/**
 * Astral Maximum Subarray Split
 */
import { EventEmitter } from 'events';
export class AstralMaxSubarraySplit extends EventEmitter {
    private static instance: AstralMaxSubarraySplit;
    private constructor() { super(); }
    static getInstance(): AstralMaxSubarraySplit { if (!AstralMaxSubarraySplit.instance) { AstralMaxSubarraySplit.instance = new AstralMaxSubarraySplit(); } return AstralMaxSubarraySplit.instance; }
    splitArray(nums: number[], k: number): number { let lo = Math.max(...nums), hi = nums.reduce((a, b) => a + b, 0); while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (this.canSplit(nums, k, mid)) hi = mid; else lo = mid + 1; } return lo; }
    private canSplit(nums: number[], k: number, maxSum: number): boolean { let count = 1, currentSum = 0; for (const num of nums) { if (currentSum + num > maxSum) { count++; currentSum = num; if (count > k) return false; } else { currentSum += num; } } return true; }
    minimizeLargestSum(nums: number[], m: number): number { return this.splitArray(nums, m); }
    maximizeMinDist(nums: number[], k: number): number { nums.sort((a, b) => a - b); let lo = 1, hi = nums[nums.length - 1] - nums[0]; while (lo < hi) { const mid = Math.floor((lo + hi + 1) / 2); let count = 1, last = nums[0]; for (let i = 1; i < nums.length; i++) { if (nums[i] - last >= mid) { count++; last = nums[i]; } } if (count >= k) lo = mid; else hi = mid - 1; } return lo; }
}
export const astralMaxSubarraySplit = AstralMaxSubarraySplit.getInstance();
