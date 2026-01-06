/**
 * Astral Knapsack Problems
 */
import { EventEmitter } from 'events';
export class AstralKnapsack extends EventEmitter {
    private static instance: AstralKnapsack;
    private constructor() { super(); }
    static getInstance(): AstralKnapsack { if (!AstralKnapsack.instance) { AstralKnapsack.instance = new AstralKnapsack(); } return AstralKnapsack.instance; }
    zeroOneKnapsack(weights: number[], values: number[], capacity: number): number { const n = weights.length; const dp = new Array(capacity + 1).fill(0); for (let i = 0; i < n; i++) for (let w = capacity; w >= weights[i]; w--) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]); return dp[capacity]; }
    unboundedKnapsack(weights: number[], values: number[], capacity: number): number { const dp = new Array(capacity + 1).fill(0); for (let w = 1; w <= capacity; w++) { for (let i = 0; i < weights.length; i++) { if (weights[i] <= w) dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]); } } return dp[capacity]; }
    coinChange(coins: number[], amount: number): number { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (const coin of coins) for (let i = coin; i <= amount; i++) dp[i] = Math.min(dp[i], dp[i - coin] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }
    coinChangeWays(amount: number, coins: number[]): number { const dp = new Array(amount + 1).fill(0); dp[0] = 1; for (const coin of coins) for (let i = coin; i <= amount; i++) dp[i] += dp[i - coin]; return dp[amount]; }
}
export const astralKnapsack = AstralKnapsack.getInstance();
