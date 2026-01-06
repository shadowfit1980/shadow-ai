/**
 * Cosmic Maximum Rectangle
 */
import { EventEmitter } from 'events';
export class CosmicMaxRectangle extends EventEmitter {
    private static instance: CosmicMaxRectangle;
    private constructor() { super(); }
    static getInstance(): CosmicMaxRectangle { if (!CosmicMaxRectangle.instance) { CosmicMaxRectangle.instance = new CosmicMaxRectangle(); } return CosmicMaxRectangle.instance; }
    maximalRectangle(matrix: string[][]): number { if (matrix.length === 0) return 0; const m = matrix.length, n = matrix[0].length; const heights = new Array(n).fill(0); let maxArea = 0; for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { heights[j] = matrix[i][j] === '1' ? heights[j] + 1 : 0; } maxArea = Math.max(maxArea, this.largestRectangleHistogram(heights)); } return maxArea; }
    private largestRectangleHistogram(heights: number[]): number { const stack: number[] = []; let maxArea = 0; const extended = [...heights, 0]; for (let i = 0; i < extended.length; i++) { while (stack.length && extended[stack[stack.length - 1]] > extended[i]) { const h = extended[stack.pop()!]; const w = stack.length ? i - stack[stack.length - 1] - 1 : i; maxArea = Math.max(maxArea, h * w); } stack.push(i); } return maxArea; }
    maximalSquare(matrix: string[][]): number { if (matrix.length === 0) return 0; const m = matrix.length, n = matrix[0].length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); let maxSide = 0; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (matrix[i - 1][j - 1] === '1') { dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1; maxSide = Math.max(maxSide, dp[i][j]); } } } return maxSide * maxSide; }
}
export const cosmicMaxRectangle = CosmicMaxRectangle.getInstance();
