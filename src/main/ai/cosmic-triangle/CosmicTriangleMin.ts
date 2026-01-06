/**
 * Cosmic Triangle Min
 */
import { EventEmitter } from 'events';
export class CosmicTriangleMin extends EventEmitter {
    private static instance: CosmicTriangleMin;
    private constructor() { super(); }
    static getInstance(): CosmicTriangleMin { if (!CosmicTriangleMin.instance) { CosmicTriangleMin.instance = new CosmicTriangleMin(); } return CosmicTriangleMin.instance; }
    minimumTotal(triangle: number[][]): number { const dp = [...triangle[triangle.length - 1]]; for (let i = triangle.length - 2; i >= 0; i--) for (let j = 0; j <= i; j++) dp[j] = triangle[i][j] + Math.min(dp[j], dp[j + 1]); return dp[0]; }
    getStats(): { solves: number } { return { solves: 0 }; }
}
export const cosmicTriangleMin = CosmicTriangleMin.getInstance();
