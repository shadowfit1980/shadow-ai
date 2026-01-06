/**
 * Astral Subset Sum
 */
import { EventEmitter } from 'events';
export class AstralSubsetSum extends EventEmitter {
    private static instance: AstralSubsetSum;
    private constructor() { super(); }
    static getInstance(): AstralSubsetSum { if (!AstralSubsetSum.instance) { AstralSubsetSum.instance = new AstralSubsetSum(); } return AstralSubsetSum.instance; }
    canSum(arr: number[], sum: number): boolean { const dp = Array(sum + 1).fill(false); dp[0] = true; for (const n of arr) for (let i = sum; i >= n; i--) if (dp[i - n]) dp[i] = true; return dp[sum]; }
    getStats(): { checks: number } { return { checks: 0 }; }
}
export const astralSubsetSum = AstralSubsetSum.getInstance();
