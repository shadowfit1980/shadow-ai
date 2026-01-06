/**
 * Mystic Product Except Self
 */
import { EventEmitter } from 'events';
export class MysticProductExceptSelf extends EventEmitter {
    private static instance: MysticProductExceptSelf;
    private constructor() { super(); }
    static getInstance(): MysticProductExceptSelf { if (!MysticProductExceptSelf.instance) { MysticProductExceptSelf.instance = new MysticProductExceptSelf(); } return MysticProductExceptSelf.instance; }
    productExceptSelf(nums: number[]): number[] { const n = nums.length; const result = new Array(n).fill(1); let left = 1; for (let i = 0; i < n; i++) { result[i] *= left; left *= nums[i]; } let right = 1; for (let i = n - 1; i >= 0; i--) { result[i] *= right; right *= nums[i]; } return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const mysticProductExceptSelf = MysticProductExceptSelf.getInstance();
