/**
 * Dimensional Matrix Chain
 */
import { EventEmitter } from 'events';
export class DimensionalMatrixChain extends EventEmitter {
    private static instance: DimensionalMatrixChain;
    private constructor() { super(); }
    static getInstance(): DimensionalMatrixChain { if (!DimensionalMatrixChain.instance) { DimensionalMatrixChain.instance = new DimensionalMatrixChain(); } return DimensionalMatrixChain.instance; }
    minScalarMultiplications(arr: number[]): number { const n = arr.length; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let len = 2; len < n; len++) { for (let i = 1; i < n - len + 1; i++) { const j = i + len - 1; dp[i][j] = Infinity; for (let k = i; k < j; k++) dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k + 1][j] + arr[i - 1] * arr[k] * arr[j]); } } return dp[1][n - 1]; }
    minCutPalindrome(s: string): number { const n = s.length; const isPalin = Array.from({ length: n }, () => new Array(n).fill(false)); for (let i = n - 1; i >= 0; i--) { for (let j = i; j < n; j++) { if (s[i] === s[j] && (j - i <= 2 || isPalin[i + 1][j - 1])) isPalin[i][j] = true; } } const dp = new Array(n).fill(0); for (let i = 0; i < n; i++) { if (isPalin[0][i]) { dp[i] = 0; } else { dp[i] = Infinity; for (let j = 0; j < i; j++) if (isPalin[j + 1][i]) dp[i] = Math.min(dp[i], dp[j] + 1); } } return dp[n - 1]; }
}
export const dimensionalMatrixChain = DimensionalMatrixChain.getInstance();
