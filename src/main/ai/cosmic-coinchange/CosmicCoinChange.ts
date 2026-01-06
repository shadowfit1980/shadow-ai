/**
 * Cosmic Coin Change Greedy
 */
import { EventEmitter } from 'events';
export class CosmicCoinChange extends EventEmitter {
    private static instance: CosmicCoinChange;
    private constructor() { super(); }
    static getInstance(): CosmicCoinChange { if (!CosmicCoinChange.instance) { CosmicCoinChange.instance = new CosmicCoinChange(); } return CosmicCoinChange.instance; }
    greedy(coins: number[], amount: number): { coins: number[]; count: number } | null { const sorted = [...coins].sort((a, b) => b - a); const result: number[] = []; let remaining = amount; for (const coin of sorted) { while (remaining >= coin) { result.push(coin); remaining -= coin; } } if (remaining !== 0) return null; return { coins: result, count: result.length }; }
    dynamic(coins: number[], amount: number): number { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let a = 1; a <= amount; a++) { for (const coin of coins) { if (coin <= a && dp[a - coin] + 1 < dp[a]) dp[a] = dp[a - coin] + 1; } } return dp[amount] === Infinity ? -1 : dp[amount]; }
    dynamicWithCoins(coins: number[], amount: number): number[] | null { const dp = new Array(amount + 1).fill(Infinity); const parent = new Array(amount + 1).fill(-1); dp[0] = 0; for (let a = 1; a <= amount; a++) { for (const coin of coins) { if (coin <= a && dp[a - coin] + 1 < dp[a]) { dp[a] = dp[a - coin] + 1; parent[a] = coin; } } } if (dp[amount] === Infinity) return null; const result: number[] = []; let curr = amount; while (curr > 0) { result.push(parent[curr]); curr -= parent[curr]; } return result; }
    countWays(coins: number[], amount: number): number { const dp = new Array(amount + 1).fill(0); dp[0] = 1; for (const coin of coins) { for (let a = coin; a <= amount; a++) dp[a] += dp[a - coin]; } return dp[amount]; }
}
export const cosmicCoinChange = CosmicCoinChange.getInstance();
