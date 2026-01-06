/**
 * Astral Product Except Self
 */
import { EventEmitter } from 'events';
export class AstralProductExceptSelf extends EventEmitter {
    private static instance: AstralProductExceptSelf;
    private constructor() { super(); }
    static getInstance(): AstralProductExceptSelf { if (!AstralProductExceptSelf.instance) { AstralProductExceptSelf.instance = new AstralProductExceptSelf(); } return AstralProductExceptSelf.instance; }
    productExceptSelf(nums: number[]): number[] { const n = nums.length; const result = new Array(n).fill(1); let prefix = 1; for (let i = 0; i < n; i++) { result[i] = prefix; prefix *= nums[i]; } let suffix = 1; for (let i = n - 1; i >= 0; i--) { result[i] *= suffix; suffix *= nums[i]; } return result; }
    maxProductSubarray(nums: number[]): number { let maxProd = nums[0], minProd = nums[0], result = nums[0]; for (let i = 1; i < nums.length; i++) { if (nums[i] < 0) [maxProd, minProd] = [minProd, maxProd]; maxProd = Math.max(nums[i], maxProd * nums[i]); minProd = Math.min(nums[i], minProd * nums[i]); result = Math.max(result, maxProd); } return result; }
    firstMissingPositive(nums: number[]): number { const n = nums.length; for (let i = 0; i < n; i++) { while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) { [nums[nums[i] - 1], nums[i]] = [nums[i], nums[nums[i] - 1]]; } } for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1; return n + 1; }
}
export const astralProductExceptSelf = AstralProductExceptSelf.getInstance();
