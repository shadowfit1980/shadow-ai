/**
 * Cosmic Sliding Window Max
 */
import { EventEmitter } from 'events';
export class CosmicSlidingWindowMax extends EventEmitter {
    private static instance: CosmicSlidingWindowMax;
    private constructor() { super(); }
    static getInstance(): CosmicSlidingWindowMax { if (!CosmicSlidingWindowMax.instance) { CosmicSlidingWindowMax.instance = new CosmicSlidingWindowMax(); } return CosmicSlidingWindowMax.instance; }
    maxSlidingWindow(nums: number[], k: number): number[] { const result: number[] = []; const deque: number[] = []; for (let i = 0; i < nums.length; i++) { while (deque.length && deque[0] <= i - k) deque.shift(); while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop(); deque.push(i); if (i >= k - 1) result.push(nums[deque[0]]); } return result; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const cosmicSlidingWindowMax = CosmicSlidingWindowMax.getInstance();
