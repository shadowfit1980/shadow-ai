/**
 * Quantum Maximal Square
 */
import { EventEmitter } from 'events';
export class QuantumMaximalSquare extends EventEmitter {
    private static instance: QuantumMaximalSquare;
    private constructor() { super(); }
    static getInstance(): QuantumMaximalSquare { if (!QuantumMaximalSquare.instance) { QuantumMaximalSquare.instance = new QuantumMaximalSquare(); } return QuantumMaximalSquare.instance; }
    maximalSquare(matrix: string[][]): number { if (matrix.length === 0) return 0; const m = matrix.length, n = matrix[0].length; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0)); let maxSide = 0; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { if (matrix[i - 1][j - 1] === '1') { dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); maxSide = Math.max(maxSide, dp[i][j]); } } } return maxSide * maxSide; }
    maximalRectangle(matrix: string[][]): number { if (matrix.length === 0) return 0; const m = matrix.length, n = matrix[0].length; const heights = new Array(n).fill(0); let maxArea = 0; for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) heights[j] = matrix[i][j] === '1' ? heights[j] + 1 : 0; maxArea = Math.max(maxArea, this.largestRectInHistogram(heights)); } return maxArea; }
    private largestRectInHistogram(heights: number[]): number { const stack: number[] = []; let maxArea = 0; for (let i = 0; i <= heights.length; i++) { const h = i === heights.length ? 0 : heights[i]; while (stack.length && heights[stack[stack.length - 1]] > h) { const height = heights[stack.pop()!]; const width = stack.length ? i - stack[stack.length - 1] - 1 : i; maxArea = Math.max(maxArea, height * width); } stack.push(i); } return maxArea; }
}
export const quantumMaximalSquare = QuantumMaximalSquare.getInstance();
