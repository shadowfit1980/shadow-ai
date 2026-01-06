/**
 * Mystic Maximum Profit
 */
import { EventEmitter } from 'events';
export class MysticMaxProfit extends EventEmitter {
    private static instance: MysticMaxProfit;
    private constructor() { super(); }
    static getInstance(): MysticMaxProfit { if (!MysticMaxProfit.instance) { MysticMaxProfit.instance = new MysticMaxProfit(); } return MysticMaxProfit.instance; }
    maxProfit(prices: number[]): number { let minPrice = Infinity, maxProfit = 0; for (const price of prices) { minPrice = Math.min(minPrice, price); maxProfit = Math.max(maxProfit, price - minPrice); } return maxProfit; }
    maxProfitII(prices: number[]): number { let profit = 0; for (let i = 1; i < prices.length; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1]; return profit; }
    maxProfitWithCooldown(prices: number[]): number { let sold = 0, hold = -Infinity, rest = 0; for (const price of prices) { const prevSold = sold; sold = hold + price; hold = Math.max(hold, rest - price); rest = Math.max(rest, prevSold); } return Math.max(sold, rest); }
    maxProfitWithFee(prices: number[], fee: number): number { let cash = 0, hold = -prices[0]; for (let i = 1; i < prices.length; i++) { cash = Math.max(cash, hold + prices[i] - fee); hold = Math.max(hold, cash - prices[i]); } return cash; }
}
export const mysticMaxProfit = MysticMaxProfit.getInstance();
