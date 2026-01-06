/**
 * Dimensional Strange Printer
 */
import { EventEmitter } from 'events';
export class DimensionalStrangePrinter extends EventEmitter {
    private static instance: DimensionalStrangePrinter;
    private constructor() { super(); }
    static getInstance(): DimensionalStrangePrinter { if (!DimensionalStrangePrinter.instance) { DimensionalStrangePrinter.instance = new DimensionalStrangePrinter(); } return DimensionalStrangePrinter.instance; }
    strangePrinter(s: string): number { const n = s.length; if (n === 0) return 0; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = n - 1; i >= 0; i--) { dp[i][i] = 1; for (let j = i + 1; j < n; j++) { dp[i][j] = dp[i][j - 1] + 1; for (let k = i; k < j; k++) { if (s[k] === s[j]) dp[i][j] = Math.min(dp[i][j], dp[i][k] + (k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0)); } } } return dp[0][n - 1]; }
    removeBoxes(boxes: number[]): number { const n = boxes.length; const dp: number[][][] = Array.from({ length: n }, () => Array.from({ length: n }, () => new Array(n + 1).fill(0))); const dfs = (i: number, j: number, k: number): number => { if (i > j) return 0; if (dp[i][j][k] !== 0) return dp[i][j][k]; while (i < j && boxes[j] === boxes[j - 1]) { j--; k++; } dp[i][j][k] = dfs(i, j - 1, 0) + (k + 1) * (k + 1); for (let m = i; m < j; m++) { if (boxes[m] === boxes[j]) dp[i][j][k] = Math.max(dp[i][j][k], dfs(i, m, k + 1) + dfs(m + 1, j - 1, 0)); } return dp[i][j][k]; }; return dfs(0, n - 1, 0); }
}
export const dimensionalStrangePrinter = DimensionalStrangePrinter.getInstance();
