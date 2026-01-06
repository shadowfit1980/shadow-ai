/**
 * Dimensional Median Finder
 */
import { EventEmitter } from 'events';
export class DimensionalMedianFinder extends EventEmitter {
    private static instance: DimensionalMedianFinder;
    private nums: number[] = [];
    private constructor() { super(); }
    static getInstance(): DimensionalMedianFinder { if (!DimensionalMedianFinder.instance) { DimensionalMedianFinder.instance = new DimensionalMedianFinder(); } return DimensionalMedianFinder.instance; }
    addNum(num: number): void { let left = 0, right = this.nums.length; while (left < right) { const mid = Math.floor((left + right) / 2); if (this.nums[mid] < num) left = mid + 1; else right = mid; } this.nums.splice(left, 0, num); }
    findMedian(): number { const n = this.nums.length; if (n % 2 === 1) return this.nums[Math.floor(n / 2)]; return (this.nums[n / 2 - 1] + this.nums[n / 2]) / 2; }
    getStats(): { size: number } { return { size: this.nums.length }; }
}
export const dimensionalMedianFinder = DimensionalMedianFinder.getInstance();
