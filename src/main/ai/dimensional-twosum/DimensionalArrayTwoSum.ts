/**
 * Dimensional Array Two Sum
 */
import { EventEmitter } from 'events';
export class DimensionalArrayTwoSum extends EventEmitter {
    private static instance: DimensionalArrayTwoSum;
    private constructor() { super(); }
    static getInstance(): DimensionalArrayTwoSum { if (!DimensionalArrayTwoSum.instance) { DimensionalArrayTwoSum.instance = new DimensionalArrayTwoSum(); } return DimensionalArrayTwoSum.instance; }
    twoSum(nums: number[], target: number): number[] { const map: Map<number, number> = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) return [map.get(complement)!, i]; map.set(nums[i], i); } return []; }
    twoSumSorted(numbers: number[], target: number): number[] { let left = 0, right = numbers.length - 1; while (left < right) { const sum = numbers[left] + numbers[right]; if (sum === target) return [left + 1, right + 1]; if (sum < target) left++; else right--; } return []; }
    threeSum(nums: number[]): number[][] { nums.sort((a, b) => a - b); const result: number[][] = []; for (let i = 0; i < nums.length - 2; i++) { if (i > 0 && nums[i] === nums[i - 1]) continue; let left = i + 1, right = nums.length - 1; while (left < right) { const sum = nums[i] + nums[left] + nums[right]; if (sum === 0) { result.push([nums[i], nums[left], nums[right]]); while (left < right && nums[left] === nums[left + 1]) left++; while (left < right && nums[right] === nums[right - 1]) right--; left++; right--; } else if (sum < 0) left++; else right--; } } return result; }
    fourSum(nums: number[], target: number): number[][] { nums.sort((a, b) => a - b); const result: number[][] = []; for (let i = 0; i < nums.length - 3; i++) { if (i > 0 && nums[i] === nums[i - 1]) continue; for (let j = i + 1; j < nums.length - 2; j++) { if (j > i + 1 && nums[j] === nums[j - 1]) continue; let left = j + 1, right = nums.length - 1; while (left < right) { const sum = nums[i] + nums[j] + nums[left] + nums[right]; if (sum === target) { result.push([nums[i], nums[j], nums[left], nums[right]]); while (left < right && nums[left] === nums[left + 1]) left++; while (left < right && nums[right] === nums[right - 1]) right--; left++; right--; } else if (sum < target) left++; else right--; } } } return result; }
}
export const dimensionalArrayTwoSum = DimensionalArrayTwoSum.getInstance();
