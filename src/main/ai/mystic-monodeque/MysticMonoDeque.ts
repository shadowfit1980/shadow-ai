/**
 * Mystic Monotonic Deque
 */
import { EventEmitter } from 'events';
export class MysticMonoDeque extends EventEmitter {
    private static instance: MysticMonoDeque;
    private constructor() { super(); }
    static getInstance(): MysticMonoDeque { if (!MysticMonoDeque.instance) { MysticMonoDeque.instance = new MysticMonoDeque(); } return MysticMonoDeque.instance; }
    slidingWindowMax(arr: number[], k: number): number[] { const n = arr.length; const result: number[] = []; const deque: number[] = []; for (let i = 0; i < n; i++) { while (deque.length && deque[0] <= i - k) deque.shift(); while (deque.length && arr[deque[deque.length - 1]] <= arr[i]) deque.pop(); deque.push(i); if (i >= k - 1) result.push(arr[deque[0]]); } return result; }
    slidingWindowMin(arr: number[], k: number): number[] { const n = arr.length; const result: number[] = []; const deque: number[] = []; for (let i = 0; i < n; i++) { while (deque.length && deque[0] <= i - k) deque.shift(); while (deque.length && arr[deque[deque.length - 1]] >= arr[i]) deque.pop(); deque.push(i); if (i >= k - 1) result.push(arr[deque[0]]); } return result; }
    maxSubarraySumWithK(arr: number[], k: number): number { const n = arr.length; const prefix = [0]; for (const x of arr) prefix.push(prefix[prefix.length - 1] + x); let maxSum = -Infinity; const deque: number[] = []; for (let i = 1; i <= n; i++) { while (deque.length && deque[0] < i - k) deque.shift(); if (deque.length) maxSum = Math.max(maxSum, prefix[i] - prefix[deque[0]]); while (deque.length && prefix[deque[deque.length - 1]] >= prefix[i]) deque.pop(); deque.push(i); } return maxSum; }
}
export const mysticMonoDeque = MysticMonoDeque.getInstance();
