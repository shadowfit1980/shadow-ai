/**
 * Astral Stirling
 */
import { EventEmitter } from 'events';
export class AstralStirling extends EventEmitter {
    private static instance: AstralStirling;
    private constructor() { super(); }
    static getInstance(): AstralStirling { if (!AstralStirling.instance) { AstralStirling.instance = new AstralStirling(); } return AstralStirling.instance; }
    firstKind(n: number, k: number): number { if (n === 0 && k === 0) return 1; if (n === 0 || k === 0) return 0; const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0)); dp[0][0] = 1; for (let i = 1; i <= n; i++) for (let j = 1; j <= Math.min(i, k); j++) dp[i][j] = dp[i - 1][j - 1] + (i - 1) * dp[i - 1][j]; return dp[n][k]; }
    secondKind(n: number, k: number): number { if (n === 0 && k === 0) return 1; if (n === 0 || k === 0) return 0; const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0)); dp[0][0] = 1; for (let i = 1; i <= n; i++) for (let j = 1; j <= Math.min(i, k); j++) dp[i][j] = dp[i - 1][j - 1] + j * dp[i - 1][j]; return dp[n][k]; }
    bellNumber(n: number): number { let sum = 0; for (let k = 0; k <= n; k++) sum += this.secondKind(n, k); return sum; }
    bellTable(n: number): number[] { const bell = [1]; const triangle: number[][] = [[1]]; for (let i = 1; i <= n; i++) { const row = [triangle[i - 1][i - 1]]; for (let j = 1; j <= i; j++) row.push(row[j - 1] + triangle[i - 1][j - 1]); triangle.push(row); bell.push(row[0]); } return bell; }
}
export const astralStirling = AstralStirling.getInstance();
