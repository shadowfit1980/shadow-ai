/**
 * Cosmic Top K Elements
 */
import { EventEmitter } from 'events';
export class CosmicTopKElements extends EventEmitter {
    private static instance: CosmicTopKElements;
    private constructor() { super(); }
    static getInstance(): CosmicTopKElements { if (!CosmicTopKElements.instance) { CosmicTopKElements.instance = new CosmicTopKElements(); } return CosmicTopKElements.instance; }
    topKFrequent(nums: number[], k: number): number[] { const count: Map<number, number> = new Map(); for (const num of nums) count.set(num, (count.get(num) || 0) + 1); const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []); for (const [num, freq] of count) buckets[freq].push(num); const result: number[] = []; for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) result.push(...buckets[i]); return result.slice(0, k); }
    topKFrequentWords(words: string[], k: number): string[] { const count: Map<string, number> = new Map(); for (const word of words) count.set(word, (count.get(word) || 0) + 1); return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k).map(e => e[0]); }
    findKthLargest(nums: number[], k: number): number { const quickSelect = (left: number, right: number, targetIdx: number): number => { const pivot = nums[right]; let partitionIdx = left; for (let i = left; i < right; i++) if (nums[i] >= pivot) [nums[i], nums[partitionIdx]] = [nums[partitionIdx++], nums[i]];[nums[partitionIdx], nums[right]] = [nums[right], nums[partitionIdx]]; if (partitionIdx === targetIdx) return nums[partitionIdx]; return partitionIdx < targetIdx ? quickSelect(partitionIdx + 1, right, targetIdx) : quickSelect(left, partitionIdx - 1, targetIdx); }; return quickSelect(0, nums.length - 1, k - 1); }
}
export const cosmicTopKElements = CosmicTopKElements.getInstance();
