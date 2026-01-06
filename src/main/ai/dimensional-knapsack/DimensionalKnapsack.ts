/**
 * Dimensional Knapsack
 */
import { EventEmitter } from 'events';
export class DimensionalKnapsack extends EventEmitter {
    private static instance: DimensionalKnapsack;
    private constructor() { super(); }
    static getInstance(): DimensionalKnapsack { if (!DimensionalKnapsack.instance) { DimensionalKnapsack.instance = new DimensionalKnapsack(); } return DimensionalKnapsack.instance; }
    zeroOne(weights: number[], values: number[], capacity: number): number { const n = weights.length; const dp = new Array(capacity + 1).fill(0); for (let i = 0; i < n; i++) for (let w = capacity; w >= weights[i]; w--) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]); return dp[capacity]; }
    unbounded(weights: number[], values: number[], capacity: number): number { const dp = new Array(capacity + 1).fill(0); for (let w = 1; w <= capacity; w++) { for (let i = 0; i < weights.length; i++) if (weights[i] <= w) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]); } return dp[capacity]; }
    bounded(weights: number[], values: number[], counts: number[], capacity: number): number { const dp = new Array(capacity + 1).fill(0); for (let i = 0; i < weights.length; i++) { for (let c = 1; c <= counts[i]; c++) { for (let w = capacity; w >= weights[i]; w--) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]); } } return dp[capacity]; }
    coinChange(coins: number[], amount: number): number { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (const coin of coins) for (let a = coin; a <= amount; a++) dp[a] = Math.min(dp[a], dp[a - coin] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }
    coinChangeWays(coins: number[], amount: number): number { const dp = new Array(amount + 1).fill(0); dp[0] = 1; for (const coin of coins) for (let a = coin; a <= amount; a++) dp[a] += dp[a - coin]; return dp[amount]; }
}
export const dimensionalKnapsack = DimensionalKnapsack.getInstance();
