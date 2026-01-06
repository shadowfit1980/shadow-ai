/**
 * Quantum Decode Ways
 */
import { EventEmitter } from 'events';
export class QuantumDecodeWays extends EventEmitter {
    private static instance: QuantumDecodeWays;
    private constructor() { super(); }
    static getInstance(): QuantumDecodeWays { if (!QuantumDecodeWays.instance) { QuantumDecodeWays.instance = new QuantumDecodeWays(); } return QuantumDecodeWays.instance; }
    numDecodings(s: string): number { if (!s || s[0] === '0') return 0; const n = s.length, dp = Array(n + 1).fill(0); dp[0] = 1; dp[1] = 1; for (let i = 2; i <= n; i++) { if (s[i - 1] !== '0') dp[i] = dp[i - 1]; const two = parseInt(s.substring(i - 2, i)); if (two >= 10 && two <= 26) dp[i] += dp[i - 2]; } return dp[n]; }
    getStats(): { decodes: number } { return { decodes: 0 }; }
}
export const quantumDecodeWays = QuantumDecodeWays.getInstance();
