/**
 * Mystic Three Sum
 */
import { EventEmitter } from 'events';
export class MysticThreeSum extends EventEmitter {
    private static instance: MysticThreeSum;
    private constructor() { super(); }
    static getInstance(): MysticThreeSum { if (!MysticThreeSum.instance) { MysticThreeSum.instance = new MysticThreeSum(); } return MysticThreeSum.instance; }
    threeSum(nums: number[]): number[][] { nums.sort((a, b) => a - b); const result: number[][] = []; for (let i = 0; i < nums.length - 2; i++) { if (i > 0 && nums[i] === nums[i - 1]) continue; let left = i + 1, right = nums.length - 1; while (left < right) { const sum = nums[i] + nums[left] + nums[right]; if (sum === 0) { result.push([nums[i], nums[left], nums[right]]); while (left < right && nums[left] === nums[left + 1]) left++; while (left < right && nums[right] === nums[right - 1]) right--; left++; right--; } else if (sum < 0) left++; else right--; } } return result; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticThreeSum = MysticThreeSum.getInstance();
