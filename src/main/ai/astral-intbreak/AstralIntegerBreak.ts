/**
 * Astral Integer Break
 */
import { EventEmitter } from 'events';
export class AstralIntegerBreak extends EventEmitter {
    private static instance: AstralIntegerBreak;
    private constructor() { super(); }
    static getInstance(): AstralIntegerBreak { if (!AstralIntegerBreak.instance) { AstralIntegerBreak.instance = new AstralIntegerBreak(); } return AstralIntegerBreak.instance; }
    integerBreak(n: number): number { if (n <= 3) return n - 1; const dp = new Array(n + 1).fill(0); dp[1] = 1; dp[2] = 1; for (let i = 3; i <= n; i++) { for (let j = 1; j < i; j++) { dp[i] = Math.max(dp[i], Math.max(j, dp[j]) * Math.max(i - j, dp[i - j])); } } return dp[n]; }
    integerBreakMath(n: number): number { if (n <= 3) return n - 1; if (n % 3 === 0) return Math.pow(3, n / 3); if (n % 3 === 1) return 4 * Math.pow(3, (n - 4) / 3); return 2 * Math.pow(3, (n - 2) / 3); }
}
export const astralIntegerBreak = AstralIntegerBreak.getInstance();
