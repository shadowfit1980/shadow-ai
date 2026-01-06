/**
 * Cosmic Knight Probability
 */
import { EventEmitter } from 'events';
export class CosmicKnightProbability extends EventEmitter {
    private static instance: CosmicKnightProbability;
    private constructor() { super(); }
    static getInstance(): CosmicKnightProbability { if (!CosmicKnightProbability.instance) { CosmicKnightProbability.instance = new CosmicKnightProbability(); } return CosmicKnightProbability.instance; }
    knightProbability(n: number, k: number, row: number, column: number): number { const moves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]; let dp = Array.from({ length: n }, () => new Array(n).fill(0)); dp[row][column] = 1; for (let step = 0; step < k; step++) { const ndp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { if (dp[i][j] === 0) continue; for (const [di, dj] of moves) { const ni = i + di, nj = j + dj; if (ni >= 0 && ni < n && nj >= 0 && nj < n) ndp[ni][nj] += dp[i][j] / 8; } } } dp = ndp; } let prob = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) prob += dp[i][j]; return prob; }
}
export const cosmicKnightProbability = CosmicKnightProbability.getInstance();
