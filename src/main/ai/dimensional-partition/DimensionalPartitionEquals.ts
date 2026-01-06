/**
 * Dimensional Partition Equal Sum
 */
import { EventEmitter } from 'events';
export class DimensionalPartitionEquals extends EventEmitter {
    private static instance: DimensionalPartitionEquals;
    private constructor() { super(); }
    static getInstance(): DimensionalPartitionEquals { if (!DimensionalPartitionEquals.instance) { DimensionalPartitionEquals.instance = new DimensionalPartitionEquals(); } return DimensionalPartitionEquals.instance; }
    canPartition(nums: number[]): boolean { const sum = nums.reduce((a, b) => a + b, 0); if (sum % 2 !== 0) return false; const target = sum / 2; const dp = new Set<number>([0]); for (const num of nums) { const newDp = new Set<number>(); for (const s of dp) { if (s + num === target) return true; newDp.add(s); newDp.add(s + num); } for (const s of newDp) dp.add(s); } return dp.has(target); }
    canPartitionKSubsets(nums: number[], k: number): boolean { const sum = nums.reduce((a, b) => a + b, 0); if (sum % k !== 0) return false; const target = sum / k; nums.sort((a, b) => b - a); if (nums[0] > target) return false; const used = new Array(nums.length).fill(false); const backtrack = (idx: number, count: number, currentSum: number): boolean => { if (count === k - 1) return true; if (currentSum === target) return backtrack(0, count + 1, 0); for (let i = idx; i < nums.length; i++) { if (used[i] || currentSum + nums[i] > target) continue; used[i] = true; if (backtrack(i + 1, count, currentSum + nums[i])) return true; used[i] = false; if (currentSum === 0) break; } return false; }; return backtrack(0, 0, 0); }
}
export const dimensionalPartitionEquals = DimensionalPartitionEquals.getInstance();
