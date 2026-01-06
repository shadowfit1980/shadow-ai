/**
 * Dimensional Stock Trading
 */
import { EventEmitter } from 'events';
export class DimensionalStockTrading extends EventEmitter {
    private static instance: DimensionalStockTrading;
    private constructor() { super(); }
    static getInstance(): DimensionalStockTrading { if (!DimensionalStockTrading.instance) { DimensionalStockTrading.instance = new DimensionalStockTrading(); } return DimensionalStockTrading.instance; }
    maxProfitOneTransaction(prices: number[]): number { if (prices.length < 2) return 0; let minPrice = prices[0]; let maxProfit = 0; for (let i = 1; i < prices.length; i++) { maxProfit = Math.max(maxProfit, prices[i] - minPrice); minPrice = Math.min(minPrice, prices[i]); } return maxProfit; }
    maxProfitUnlimited(prices: number[]): number { let profit = 0; for (let i = 1; i < prices.length; i++) { if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1]; } return profit; }
    maxProfitKTransactions(prices: number[], k: number): number { const n = prices.length; if (n < 2 || k === 0) return 0; if (k >= n / 2) return this.maxProfitUnlimited(prices); const dp = Array.from({ length: k + 1 }, () => new Array(n).fill(0)); for (let t = 1; t <= k; t++) { let maxDiff = -prices[0]; for (let d = 1; d < n; d++) { dp[t][d] = Math.max(dp[t][d - 1], prices[d] + maxDiff); maxDiff = Math.max(maxDiff, dp[t - 1][d] - prices[d]); } } return dp[k][n - 1]; }
    maxProfitWithCooldown(prices: number[]): number { const n = prices.length; if (n < 2) return 0; const sell = new Array(n).fill(0); const buy = new Array(n).fill(0); buy[0] = -prices[0]; for (let i = 1; i < n; i++) { sell[i] = Math.max(sell[i - 1], buy[i - 1] + prices[i]); buy[i] = Math.max(buy[i - 1], (i >= 2 ? sell[i - 2] : 0) - prices[i]); } return sell[n - 1]; }
}
export const dimensionalStockTrading = DimensionalStockTrading.getInstance();
