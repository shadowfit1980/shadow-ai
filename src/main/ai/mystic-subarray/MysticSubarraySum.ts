/**
 * Mystic Subarray Sum
 */
import { EventEmitter } from 'events';
export class MysticSubarraySum extends EventEmitter {
    private static instance: MysticSubarraySum;
    private constructor() { super(); }
    static getInstance(): MysticSubarraySum { if (!MysticSubarraySum.instance) { MysticSubarraySum.instance = new MysticSubarraySum(); } return MysticSubarraySum.instance; }
    subarraySum(nums: number[], k: number): number { const prefixCount: Map<number, number> = new Map([[0, 1]]); let sum = 0, count = 0; for (const num of nums) { sum += num; if (prefixCount.has(sum - k)) count += prefixCount.get(sum - k)!; prefixCount.set(sum, (prefixCount.get(sum) || 0) + 1); } return count; }
    maxSubArray(nums: number[]): number { let maxSum = nums[0], currentSum = nums[0]; for (let i = 1; i < nums.length; i++) { currentSum = Math.max(nums[i], currentSum + nums[i]); maxSum = Math.max(maxSum, currentSum); } return maxSum; }
    maxProduct(nums: number[]): number { let maxProd = nums[0], minProd = nums[0], result = nums[0]; for (let i = 1; i < nums.length; i++) { const temp = maxProd; maxProd = Math.max(nums[i], maxProd * nums[i], minProd * nums[i]); minProd = Math.min(nums[i], temp * nums[i], minProd * nums[i]); result = Math.max(result, maxProd); } return result; }
    minSubArrayLen(target: number, nums: number[]): number { let left = 0, sum = 0, minLen = Infinity; for (let right = 0; right < nums.length; right++) { sum += nums[right]; while (sum >= target) { minLen = Math.min(minLen, right - left + 1); sum -= nums[left++]; } } return minLen === Infinity ? 0 : minLen; }
}
export const mysticSubarraySum = MysticSubarraySum.getInstance();
