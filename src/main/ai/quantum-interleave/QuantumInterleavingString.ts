/**
 * Quantum Interleaving String
 */
import { EventEmitter } from 'events';
export class QuantumInterleavingString extends EventEmitter {
    private static instance: QuantumInterleavingString;
    private constructor() { super(); }
    static getInstance(): QuantumInterleavingString { if (!QuantumInterleavingString.instance) { QuantumInterleavingString.instance = new QuantumInterleavingString(); } return QuantumInterleavingString.instance; }
    isInterleave(s1: string, s2: string, s3: string): boolean { const m = s1.length, n = s2.length; if (m + n !== s3.length) return false; const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false)); dp[0][0] = true; for (let i = 1; i <= m; i++) dp[i][0] = dp[i - 1][0] && s1[i - 1] === s3[i - 1]; for (let j = 1; j <= n; j++) dp[0][j] = dp[0][j - 1] && s2[j - 1] === s3[j - 1]; for (let i = 1; i <= m; i++) { for (let j = 1; j <= n; j++) { dp[i][j] = (dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) || (dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]); } } return dp[m][n]; }
    spaceOptimized(s1: string, s2: string, s3: string): boolean { const m = s1.length, n = s2.length; if (m + n !== s3.length) return false; const dp = new Array(n + 1).fill(false); for (let i = 0; i <= m; i++) { for (let j = 0; j <= n; j++) { if (i === 0 && j === 0) dp[j] = true; else if (i === 0) dp[j] = dp[j - 1] && s2[j - 1] === s3[j - 1]; else if (j === 0) dp[j] = dp[j] && s1[i - 1] === s3[i - 1]; else dp[j] = (dp[j] && s1[i - 1] === s3[i + j - 1]) || (dp[j - 1] && s2[j - 1] === s3[i + j - 1]); } } return dp[n]; }
}
export const quantumInterleavingString = QuantumInterleavingString.getInstance();
