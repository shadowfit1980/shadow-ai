/**
 * Mystic Profitable Schemes
 */
import { EventEmitter } from 'events';
export class MysticProfitableSchemes extends EventEmitter {
    private static instance: MysticProfitableSchemes;
    private constructor() { super(); }
    static getInstance(): MysticProfitableSchemes { if (!MysticProfitableSchemes.instance) { MysticProfitableSchemes.instance = new MysticProfitableSchemes(); } return MysticProfitableSchemes.instance; }
    profitableSchemes(n: number, minProfit: number, group: number[], profit: number[]): number { const MOD = 1e9 + 7; const dp = Array.from({ length: n + 1 }, () => new Array(minProfit + 1).fill(0)); dp[0][0] = 1; for (let k = 0; k < group.length; k++) { const g = group[k], p = profit[k]; for (let i = n; i >= g; i--) { for (let j = minProfit; j >= 0; j--) { const newProfit = Math.min(minProfit, j + p); dp[i][newProfit] = (dp[i][newProfit] + dp[i - g][j]) % MOD; } } } let result = 0; for (let i = 0; i <= n; i++) result = (result + dp[i][minProfit]) % MOD; return result; }
}
export const mysticProfitableSchemes = MysticProfitableSchemes.getInstance();
