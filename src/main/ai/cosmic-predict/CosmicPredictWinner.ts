/**
 * Cosmic Predict Winner
 */
import { EventEmitter } from 'events';
export class CosmicPredictWinner extends EventEmitter {
    private static instance: CosmicPredictWinner;
    private constructor() { super(); }
    static getInstance(): CosmicPredictWinner { if (!CosmicPredictWinner.instance) { CosmicPredictWinner.instance = new CosmicPredictWinner(); } return CosmicPredictWinner.instance; }
    PredictTheWinner(nums: number[]): boolean { const n = nums.length; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = 0; i < n; i++) dp[i][i] = nums[i]; for (let len = 2; len <= n; len++) { for (let i = 0; i <= n - len; i++) { const j = i + len - 1; dp[i][j] = Math.max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]); } } return dp[0][n - 1] >= 0; }
    getWinner(arr: number[], k: number): number { let winner = arr[0], streak = 0; for (let i = 1; i < arr.length; i++) { if (arr[i] > winner) { winner = arr[i]; streak = 1; } else { streak++; } if (streak >= k) return winner; } return winner; }
}
export const cosmicPredictWinner = CosmicPredictWinner.getInstance();
