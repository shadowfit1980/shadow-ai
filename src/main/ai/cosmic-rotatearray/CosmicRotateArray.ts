/**
 * Cosmic Rotate Array
 */
import { EventEmitter } from 'events';
export class CosmicRotateArray extends EventEmitter {
    private static instance: CosmicRotateArray;
    private constructor() { super(); }
    static getInstance(): CosmicRotateArray { if (!CosmicRotateArray.instance) { CosmicRotateArray.instance = new CosmicRotateArray(); } return CosmicRotateArray.instance; }
    rotate(nums: number[], k: number): void { k %= nums.length; this.reverse(nums, 0, nums.length - 1); this.reverse(nums, 0, k - 1); this.reverse(nums, k, nums.length - 1); }
    private reverse(nums: number[], start: number, end: number): void { while (start < end) { [nums[start], nums[end]] = [nums[end], nums[start]]; start++; end--; } }
    searchInRotated(nums: number[], target: number): number { let left = 0, right = nums.length - 1; while (left <= right) { const mid = Math.floor((left + right) / 2); if (nums[mid] === target) return mid; if (nums[left] <= nums[mid]) { if (target >= nums[left] && target < nums[mid]) right = mid - 1; else left = mid + 1; } else { if (target > nums[mid] && target <= nums[right]) left = mid + 1; else right = mid - 1; } } return -1; }
    findMin(nums: number[]): number { let left = 0, right = nums.length - 1; while (left < right) { const mid = Math.floor((left + right) / 2); if (nums[mid] > nums[right]) left = mid + 1; else right = mid; } return nums[left]; }
}
export const cosmicRotateArray = CosmicRotateArray.getInstance();
