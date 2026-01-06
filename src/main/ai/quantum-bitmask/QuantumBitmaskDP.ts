/**
 * Quantum Bitmask DP
 */
import { EventEmitter } from 'events';
export class QuantumBitmaskDP extends EventEmitter {
    private static instance: QuantumBitmaskDP;
    private constructor() { super(); }
    static getInstance(): QuantumBitmaskDP { if (!QuantumBitmaskDP.instance) { QuantumBitmaskDP.instance = new QuantumBitmaskDP(); } return QuantumBitmaskDP.instance; }
    tsp(dist: number[][]): number { const n = dist.length; const dp: number[][] = Array.from({ length: 1 << n }, () => new Array(n).fill(Infinity)); dp[1][0] = 0; for (let mask = 1; mask < (1 << n); mask++) { for (let u = 0; u < n; u++) { if (!(mask & (1 << u))) continue; for (let v = 0; v < n; v++) { if (mask & (1 << v)) continue; dp[mask | (1 << v)][v] = Math.min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]); } } } let result = Infinity; for (let u = 0; u < n; u++) result = Math.min(result, dp[(1 << n) - 1][u] + dist[u][0]); return result; }
    hamiltonianPath(adj: boolean[][]): boolean { const n = adj.length; const dp: boolean[][] = Array.from({ length: 1 << n }, () => new Array(n).fill(false)); for (let i = 0; i < n; i++) dp[1 << i][i] = true; for (let mask = 1; mask < (1 << n); mask++) { for (let u = 0; u < n; u++) { if (!dp[mask][u]) continue; for (let v = 0; v < n; v++) { if ((mask & (1 << v)) || !adj[u][v]) continue; dp[mask | (1 << v)][v] = true; } } } for (let i = 0; i < n; i++) if (dp[(1 << n) - 1][i]) return true; return false; }
    subsetSum(arr: number[], target: number): boolean { const dp = new Array(target + 1).fill(false); dp[0] = true; for (const x of arr) for (let j = target; j >= x; j--) dp[j] = dp[j] || dp[j - x]; return dp[target]; }
}
export const quantumBitmaskDP = QuantumBitmaskDP.getInstance();
