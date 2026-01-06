/**
 * Quantum Stone Game
 */
import { EventEmitter } from 'events';
export class QuantumStoneGame extends EventEmitter {
    private static instance: QuantumStoneGame;
    private constructor() { super(); }
    static getInstance(): QuantumStoneGame { if (!QuantumStoneGame.instance) { QuantumStoneGame.instance = new QuantumStoneGame(); } return QuantumStoneGame.instance; }
    stoneGame(piles: number[]): boolean { return true; }
    stoneGameII(piles: number[]): number { const n = piles.length; const suffix = new Array(n + 1).fill(0); for (let i = n - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + piles[i]; const memo: number[][] = Array.from({ length: n }, () => new Array(n + 1).fill(-1)); const dp = (i: number, m: number): number => { if (i >= n) return 0; if (memo[i][m] !== -1) return memo[i][m]; let maxStones = 0; for (let x = 1; x <= 2 * m && i + x <= n; x++) { const take = suffix[i] - suffix[i + x]; maxStones = Math.max(maxStones, take + suffix[i + x] - dp(i + x, Math.max(m, x))); } memo[i][m] = maxStones; return maxStones; }; return dp(0, 1); }
    stoneGameIII(stoneValue: number[]): string { const n = stoneValue.length; const dp = new Array(n + 1).fill(0); for (let i = n - 1; i >= 0; i--) { dp[i] = -Infinity; let take = 0; for (let k = 1; k <= 3 && i + k <= n; k++) { take += stoneValue[i + k - 1]; dp[i] = Math.max(dp[i], take - dp[i + k]); } } return dp[0] > 0 ? 'Alice' : dp[0] < 0 ? 'Bob' : 'Tie'; }
}
export const quantumStoneGame = QuantumStoneGame.getInstance();
