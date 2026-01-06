/**
 * Cosmic Optimal BST
 */
import { EventEmitter } from 'events';
export class CosmicOptimalBST extends EventEmitter {
    private static instance: CosmicOptimalBST;
    private constructor() { super(); }
    static getInstance(): CosmicOptimalBST { if (!CosmicOptimalBST.instance) { CosmicOptimalBST.instance = new CosmicOptimalBST(); } return CosmicOptimalBST.instance; }
    optimalSearchTree(keys: number[], freq: number[]): number { const n = keys.length; const sum = (i: number, j: number): number => { let s = 0; for (let k = i; k <= j; k++) s += freq[k]; return s; }; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = 0; i < n; i++) dp[i][i] = freq[i]; for (let len = 2; len <= n; len++) { for (let i = 0; i <= n - len; i++) { const j = i + len - 1; dp[i][j] = Infinity; const s = sum(i, j); for (let k = i; k <= j; k++) { const cost = s + (k > i ? dp[i][k - 1] : 0) + (k < j ? dp[k + 1][j] : 0); dp[i][j] = Math.min(dp[i][j], cost); } } } return dp[0][n - 1]; }
}
export const cosmicOptimalBST = CosmicOptimalBST.getInstance();
