/**
 * Mystic Perfect Squares
 */
import { EventEmitter } from 'events';
export class MysticPerfectSquares extends EventEmitter {
    private static instance: MysticPerfectSquares;
    private constructor() { super(); }
    static getInstance(): MysticPerfectSquares { if (!MysticPerfectSquares.instance) { MysticPerfectSquares.instance = new MysticPerfectSquares(); } return MysticPerfectSquares.instance; }
    numSquares(n: number): number { const dp = Array(n + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= n; i++) for (let j = 1; j * j <= i; j++) dp[i] = Math.min(dp[i], dp[i - j * j] + 1); return dp[n]; }
    getStats(): { solves: number } { return { solves: 0 }; }
}
export const mysticPerfectSquares = MysticPerfectSquares.getInstance();
