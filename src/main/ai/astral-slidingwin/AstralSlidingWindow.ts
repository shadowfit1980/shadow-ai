/**
 * Astral Sliding Window
 */
import { EventEmitter } from 'events';
export class AstralSlidingWindow extends EventEmitter {
    private static instance: AstralSlidingWindow;
    private constructor() { super(); }
    static getInstance(): AstralSlidingWindow { if (!AstralSlidingWindow.instance) { AstralSlidingWindow.instance = new AstralSlidingWindow(); } return AstralSlidingWindow.instance; }
    maxSlidingWindow(nums: number[], k: number): number[] { const result: number[] = []; const deque: number[] = []; for (let i = 0; i < nums.length; i++) { while (deque.length && deque[0] < i - k + 1) deque.shift(); while (deque.length && nums[deque[deque.length - 1]] < nums[i]) deque.pop(); deque.push(i); if (i >= k - 1) result.push(nums[deque[0]]); } return result; }
    lengthOfLongestSubstring(s: string): number { const seen: Map<string, number> = new Map(); let maxLen = 0, left = 0; for (let right = 0; right < s.length; right++) { if (seen.has(s[right])) left = Math.max(left, seen.get(s[right])! + 1); seen.set(s[right], right); maxLen = Math.max(maxLen, right - left + 1); } return maxLen; }
    minWindow(s: string, t: string): string { const need: Map<string, number> = new Map(); for (const c of t) need.set(c, (need.get(c) || 0) + 1); let left = 0, formed = 0, minLen = Infinity, start = 0; const window: Map<string, number> = new Map(); for (let right = 0; right < s.length; right++) { const c = s[right]; window.set(c, (window.get(c) || 0) + 1); if (need.has(c) && window.get(c) === need.get(c)) formed++; while (formed === need.size) { if (right - left + 1 < minLen) { minLen = right - left + 1; start = left; } const l = s[left]; window.set(l, window.get(l)! - 1); if (need.has(l) && window.get(l)! < need.get(l)!) formed--; left++; } } return minLen === Infinity ? '' : s.substring(start, start + minLen); }
}
export const astralSlidingWindow = AstralSlidingWindow.getInstance();
