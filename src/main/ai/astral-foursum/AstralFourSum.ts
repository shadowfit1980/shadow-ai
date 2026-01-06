/**
 * Astral Four Sum
 */
import { EventEmitter } from 'events';
export class AstralFourSum extends EventEmitter {
    private static instance: AstralFourSum;
    private constructor() { super(); }
    static getInstance(): AstralFourSum { if (!AstralFourSum.instance) { AstralFourSum.instance = new AstralFourSum(); } return AstralFourSum.instance; }
    fourSum(nums: number[], target: number): number[][] { nums.sort((a, b) => a - b); const result: number[][] = []; for (let i = 0; i < nums.length - 3; i++) { if (i > 0 && nums[i] === nums[i - 1]) continue; for (let j = i + 1; j < nums.length - 2; j++) { if (j > i + 1 && nums[j] === nums[j - 1]) continue; let left = j + 1, right = nums.length - 1; while (left < right) { const sum = nums[i] + nums[j] + nums[left] + nums[right]; if (sum === target) { result.push([nums[i], nums[j], nums[left], nums[right]]); while (left < right && nums[left] === nums[left + 1]) left++; while (left < right && nums[right] === nums[right - 1]) right--; left++; right--; } else if (sum < target) left++; else right--; } } } return result; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const astralFourSum = AstralFourSum.getInstance();
