/**
 * Mystic Pascal Triangle
 */
import { EventEmitter } from 'events';
export class MysticPascalTriangle extends EventEmitter {
    private static instance: MysticPascalTriangle;
    private constructor() { super(); }
    static getInstance(): MysticPascalTriangle { if (!MysticPascalTriangle.instance) { MysticPascalTriangle.instance = new MysticPascalTriangle(); } return MysticPascalTriangle.instance; }
    generate(numRows: number): number[][] { const result: number[][] = []; for (let i = 0; i < numRows; i++) { const row = new Array(i + 1).fill(1); for (let j = 1; j < i; j++) row[j] = result[i - 1][j - 1] + result[i - 1][j]; result.push(row); } return result; }
    getRow(rowIndex: number): number[] { const row = [1]; for (let i = 1; i <= rowIndex; i++) row.push(row[i - 1] * (rowIndex - i + 1) / i); return row; }
    nthCatalan(n: number): number { const dp = new Array(n + 1).fill(0); dp[0] = dp[1] = 1; for (let i = 2; i <= n; i++) for (let j = 0; j < i; j++) dp[i] += dp[j] * dp[i - 1 - j]; return dp[n]; }
    nCr(n: number, r: number): number { if (r > n) return 0; if (r === 0 || r === n) return 1; const dp = Array.from({ length: n + 1 }, () => new Array(r + 1).fill(0)); for (let i = 0; i <= n; i++) { dp[i][0] = 1; if (i <= r) dp[i][i] = 1; } for (let i = 2; i <= n; i++) for (let j = 1; j < Math.min(i, r + 1); j++) dp[i][j] = dp[i - 1][j - 1] + dp[i - 1][j]; return dp[n][r]; }
}
export const mysticPascalTriangle = MysticPascalTriangle.getInstance();
