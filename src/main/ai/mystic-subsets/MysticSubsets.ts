/**
 * Mystic Subsets
 */
import { EventEmitter } from 'events';
export class MysticSubsets extends EventEmitter {
    private static instance: MysticSubsets;
    private constructor() { super(); }
    static getInstance(): MysticSubsets { if (!MysticSubsets.instance) { MysticSubsets.instance = new MysticSubsets(); } return MysticSubsets.instance; }
    subsets<T>(nums: T[]): T[][] { const result: T[][] = [[]]; for (const num of nums) { const len = result.length; for (let i = 0; i < len; i++) result.push([...result[i], num]); } return result; }
    subsetsWithDup<T>(nums: T[]): T[][] { const sorted = [...nums].sort(); const result: T[][] = [[]]; let prevLen = 0; for (let i = 0; i < sorted.length; i++) { const start = (i > 0 && sorted[i] === sorted[i - 1]) ? prevLen : 0; prevLen = result.length; for (let j = start; j < prevLen; j++) result.push([...result[j], sorted[i]]); } return result; }
    subsetsOfSizeK<T>(nums: T[], k: number): T[][] { const result: T[][] = []; const backtrack = (start: number, current: T[]): void => { if (current.length === k) { result.push([...current]); return; } for (let i = start; i < nums.length; i++) { current.push(nums[i]); backtrack(i + 1, current); current.pop(); } }; backtrack(0, []); return result; }
    subsetSum(nums: number[], target: number): boolean { const dp = new Set<number>([0]); for (const num of nums) { const newSums = new Set<number>(); for (const sum of dp) newSums.add(sum + num); for (const sum of newSums) dp.add(sum); } return dp.has(target); }
}
export const mysticSubsets = MysticSubsets.getInstance();
