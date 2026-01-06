/**
 * Dimensional Russian Dolls
 */
import { EventEmitter } from 'events';
export class DimensionalRussianDolls extends EventEmitter {
    private static instance: DimensionalRussianDolls;
    private constructor() { super(); }
    static getInstance(): DimensionalRussianDolls { if (!DimensionalRussianDolls.instance) { DimensionalRussianDolls.instance = new DimensionalRussianDolls(); } return DimensionalRussianDolls.instance; }
    maxEnvelopes(envelopes: number[][]): number { envelopes.sort((a, b) => a[0] - b[0] || b[1] - a[1]); const heights = envelopes.map(e => e[1]); return this.lengthOfLIS(heights); }
    private lengthOfLIS(nums: number[]): number { const tails: number[] = []; for (const num of nums) { let lo = 0, hi = tails.length; while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (tails[mid] < num) lo = mid + 1; else hi = mid; } if (lo === tails.length) tails.push(num); else tails[lo] = num; } return tails.length; }
    boxStacking(dimensions: number[][]): number { const boxes: number[][] = []; for (const [l, w, h] of dimensions) { boxes.push([l, w, h], [l, h, w], [w, l, h], [w, h, l], [h, l, w], [h, w, l]); } boxes.sort((a, b) => a[0] * a[1] - b[0] * b[1]); const n = boxes.length; const dp = boxes.map(b => b[2]); for (let i = 1; i < n; i++) { for (let j = 0; j < i; j++) { if (boxes[j][0] < boxes[i][0] && boxes[j][1] < boxes[i][1]) dp[i] = Math.max(dp[i], dp[j] + boxes[i][2]); } } return Math.max(...dp); }
}
export const dimensionalRussianDolls = DimensionalRussianDolls.getInstance();
