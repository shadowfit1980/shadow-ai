/**
 * Dimensional Rotate Array
 */
import { EventEmitter } from 'events';
export class DimensionalRotateArray extends EventEmitter {
    private static instance: DimensionalRotateArray;
    private constructor() { super(); }
    static getInstance(): DimensionalRotateArray { if (!DimensionalRotateArray.instance) { DimensionalRotateArray.instance = new DimensionalRotateArray(); } return DimensionalRotateArray.instance; }
    rotate(nums: number[], k: number): void { k = k % nums.length; this.reverse(nums, 0, nums.length - 1); this.reverse(nums, 0, k - 1); this.reverse(nums, k, nums.length - 1); }
    private reverse(nums: number[], start: number, end: number): void { while (start < end) { [nums[start], nums[end]] = [nums[end], nums[start]]; start++; end--; } }
    getStats(): { rotated: number } { return { rotated: 0 }; }
}
export const dimensionalRotateArray = DimensionalRotateArray.getInstance();
