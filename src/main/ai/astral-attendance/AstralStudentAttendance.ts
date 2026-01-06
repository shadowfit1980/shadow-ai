/**
 * Astral Student Attendance
 */
import { EventEmitter } from 'events';
export class AstralStudentAttendance extends EventEmitter {
    private static instance: AstralStudentAttendance;
    private constructor() { super(); }
    static getInstance(): AstralStudentAttendance { if (!AstralStudentAttendance.instance) { AstralStudentAttendance.instance = new AstralStudentAttendance(); } return AstralStudentAttendance.instance; }
    checkRecord(n: number): number { const MOD = 1e9 + 7; let dp = [[1, 1, 0], [1, 0, 0]]; for (let i = 1; i < n; i++) { const ndp = [[0, 0, 0], [0, 0, 0]]; for (let a = 0; a < 2; a++) { for (let l = 0; l < 3; l++) { const curr = dp[a][l]; if (curr === 0) continue; ndp[a][0] = (ndp[a][0] + curr) % MOD; if (l < 2) ndp[a][l + 1] = (ndp[a][l + 1] + curr) % MOD; if (a === 0) ndp[1][0] = (ndp[1][0] + curr) % MOD; } } dp = ndp; } let result = 0; for (let a = 0; a < 2; a++) for (let l = 0; l < 3; l++) result = (result + dp[a][l]) % MOD; return result; }
    longestBeautifulSubsequence(s: string, k: number): number { const n = s.length; const dp = Array.from({ length: n }, () => new Array(k + 1).fill(0)); dp[0][0] = 1; for (let i = 1; i < n; i++) { for (let j = 0; j <= k; j++) { dp[i][j] = dp[i - 1][j]; if (s[i] === s[i - 1]) dp[i][j] = Math.max(dp[i][j], dp[i - 1][j] + 1); else if (j > 0) dp[i][j] = Math.max(dp[i][j], dp[i - 1][j - 1] + 1); } } return Math.max(...dp[n - 1]); }
}
export const astralStudentAttendance = AstralStudentAttendance.getInstance();
