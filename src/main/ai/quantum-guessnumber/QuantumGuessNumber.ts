/**
 * Quantum Guess Number
 */
import { EventEmitter } from 'events';
export class QuantumGuessNumber extends EventEmitter {
    private static instance: QuantumGuessNumber;
    private constructor() { super(); }
    static getInstance(): QuantumGuessNumber { if (!QuantumGuessNumber.instance) { QuantumGuessNumber.instance = new QuantumGuessNumber(); } return QuantumGuessNumber.instance; }
    getMoneyAmount(n: number): number { const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0)); for (let len = 2; len <= n; len++) { for (let start = 1; start <= n - len + 1; start++) { const end = start + len - 1; dp[start][end] = Infinity; for (let k = start; k <= end; k++) { const cost = k + Math.max(dp[start][k - 1], dp[k + 1][end]); dp[start][end] = Math.min(dp[start][end], cost); } } } return dp[1][n]; }
    binarySearch(target: number, n: number): number { let lo = 1, hi = n, guesses = 0; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); guesses++; if (mid === target) return guesses; if (mid < target) lo = mid + 1; else hi = mid - 1; } return guesses; }
}
export const quantumGuessNumber = QuantumGuessNumber.getInstance();
