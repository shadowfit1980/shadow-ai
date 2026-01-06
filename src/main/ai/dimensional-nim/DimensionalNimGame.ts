/**
 * Dimensional Nim Game
 */
import { EventEmitter } from 'events';
export class DimensionalNimGame extends EventEmitter {
    private static instance: DimensionalNimGame;
    private constructor() { super(); }
    static getInstance(): DimensionalNimGame { if (!DimensionalNimGame.instance) { DimensionalNimGame.instance = new DimensionalNimGame(); } return DimensionalNimGame.instance; }
    canWinNim(n: number): boolean { return n % 4 !== 0; }
    canWinBash(n: number, k: number): boolean { return n % (k + 1) !== 0; }
    nimXOR(piles: number[]): number { return piles.reduce((a, b) => a ^ b, 0); }
    canWinSprague(piles: number[]): boolean { return this.nimXOR(piles) !== 0; }
    stoneGameNim(n: number): boolean { const dp = [false, true, true, false]; for (let i = 4; i <= n; i++) dp[i] = !dp[i - 1] || !dp[i - 3] || !dp[i - 4]; return dp[n]; }
}
export const dimensionalNimGame = DimensionalNimGame.getInstance();
