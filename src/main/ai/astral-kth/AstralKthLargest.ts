/**
 * Astral Kth Largest
 */
import { EventEmitter } from 'events';
export class AstralKthLargest extends EventEmitter {
    private static instance: AstralKthLargest;
    private constructor() { super(); }
    static getInstance(): AstralKthLargest { if (!AstralKthLargest.instance) { AstralKthLargest.instance = new AstralKthLargest(); } return AstralKthLargest.instance; }
    findKthLargest(nums: number[], k: number): number { nums.sort((a, b) => b - a); return nums[k - 1]; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const astralKthLargest = AstralKthLargest.getInstance();
