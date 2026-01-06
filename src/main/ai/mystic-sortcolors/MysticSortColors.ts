/**
 * Mystic Sort Colors Dutch Flag
 */
import { EventEmitter } from 'events';
export class MysticSortColors extends EventEmitter {
    private static instance: MysticSortColors;
    private constructor() { super(); }
    static getInstance(): MysticSortColors { if (!MysticSortColors.instance) { MysticSortColors.instance = new MysticSortColors(); } return MysticSortColors.instance; }
    sortColors(nums: number[]): void { let low = 0, mid = 0, high = nums.length - 1; while (mid <= high) { if (nums[mid] === 0) { [nums[low], nums[mid]] = [nums[mid], nums[low]]; low++; mid++; } else if (nums[mid] === 1) { mid++; } else { [nums[mid], nums[high]] = [nums[high], nums[mid]]; high--; } } }
    partitionLabels(s: string): number[] { const last: number[] = new Array(26).fill(0); for (let i = 0; i < s.length; i++) last[s.charCodeAt(i) - 97] = i; const result: number[] = []; let start = 0, end = 0; for (let i = 0; i < s.length; i++) { end = Math.max(end, last[s.charCodeAt(i) - 97]); if (i === end) { result.push(end - start + 1); start = i + 1; } } return result; }
    wiggleSort(nums: number[]): void { for (let i = 0; i < nums.length - 1; i++) { if ((i % 2 === 0) === (nums[i] > nums[i + 1])) [nums[i], nums[i + 1]] = [nums[i + 1], nums[i]]; } }
}
export const mysticSortColors = MysticSortColors.getInstance();
