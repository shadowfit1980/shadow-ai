/**
 * Dimensional Edit Distance
 */
import { EventEmitter } from 'events';
export class DimensionalEditDistance extends EventEmitter {
    private static instance: DimensionalEditDistance;
    private constructor() { super(); }
    static getInstance(): DimensionalEditDistance { if (!DimensionalEditDistance.instance) { DimensionalEditDistance.instance = new DimensionalEditDistance(); } return DimensionalEditDistance.instance; }
    calculate(s1: string, s2: string): number { const dp: number[][] = Array.from({ length: s1.length + 1 }, (_, i) => Array(s2.length + 1).fill(0).map((_, j) => i === 0 ? j : j === 0 ? i : 0)); for (let i = 1; i <= s1.length; i++) for (let j = 1; j <= s2.length; j++) dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]); return dp[s1.length][s2.length]; }
    getStats(): { calculations: number } { return { calculations: 0 }; }
}
export const dimensionalEditDistance = DimensionalEditDistance.getInstance();
