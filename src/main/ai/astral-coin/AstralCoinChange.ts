/**
 * Astral Coin Change
 */
import { EventEmitter } from 'events';
export class AstralCoinChange extends EventEmitter {
    private static instance: AstralCoinChange;
    private constructor() { super(); }
    static getInstance(): AstralCoinChange { if (!AstralCoinChange.instance) { AstralCoinChange.instance = new AstralCoinChange(); } return AstralCoinChange.instance; }
    minCoins(coins: number[], amount: number): number { const dp = Array(amount + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= amount; i++) for (const coin of coins) if (coin <= i) dp[i] = Math.min(dp[i], dp[i - coin] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }
    getStats(): { solves: number } { return { solves: 0 }; }
}
export const astralCoinChange = AstralCoinChange.getInstance();
