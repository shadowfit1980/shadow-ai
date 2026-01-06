/**
 * Quantum Out Of Boundary
 */
import { EventEmitter } from 'events';
export class QuantumOutOfBoundary extends EventEmitter {
    private static instance: QuantumOutOfBoundary;
    private constructor() { super(); }
    static getInstance(): QuantumOutOfBoundary { if (!QuantumOutOfBoundary.instance) { QuantumOutOfBoundary.instance = new QuantumOutOfBoundary(); } return QuantumOutOfBoundary.instance; }
    findPaths(m: number, n: number, maxMove: number, startRow: number, startCol: number): number { const MOD = 1e9 + 7; let dp = Array.from({ length: m }, () => new Array(n).fill(0)); dp[startRow][startCol] = 1; let result = 0; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; for (let k = 0; k < maxMove; k++) { const ndp = Array.from({ length: m }, () => new Array(n).fill(0)); for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { if (dp[i][j] === 0) continue; for (const [di, dj] of dirs) { const ni = i + di, nj = j + dj; if (ni < 0 || ni >= m || nj < 0 || nj >= n) result = (result + dp[i][j]) % MOD; else ndp[ni][nj] = (ndp[ni][nj] + dp[i][j]) % MOD; } } } dp = ndp; } return result; }
}
export const quantumOutOfBoundary = QuantumOutOfBoundary.getInstance();
