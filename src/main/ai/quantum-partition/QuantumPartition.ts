/**
 * Quantum Partition
 */
import { EventEmitter } from 'events';
export class QuantumPartition extends EventEmitter {
    private static instance: QuantumPartition;
    private constructor() { super(); }
    static getInstance(): QuantumPartition { if (!QuantumPartition.instance) { QuantumPartition.instance = new QuantumPartition(); } return QuantumPartition.instance; }
    count(n: number): number { const dp = new Array(n + 1).fill(0); dp[0] = 1; for (let i = 1; i <= n; i++) for (let j = i; j <= n; j++) dp[j] += dp[j - i]; return dp[n]; }
    countWithK(n: number, k: number): number { const dp = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0)); dp[0][0] = 1; for (let i = 1; i <= n; i++) { for (let j = 1; j <= Math.min(i, k); j++) { dp[i][j] = dp[i - 1][j - 1] + (i >= j ? dp[i - j][j] : 0); } } return dp[n][k]; }
    generate(n: number): number[][] { const result: number[][] = []; const current: number[] = []; const generate = (remaining: number, max: number): void => { if (remaining === 0) { result.push([...current]); return; } for (let i = Math.min(remaining, max); i >= 1; i--) { current.push(i); generate(remaining - i, i); current.pop(); } }; generate(n, n); return result; }
    generateDistinct(n: number): number[][] { const result: number[][] = []; const current: number[] = []; const generate = (remaining: number, max: number): void => { if (remaining === 0) { result.push([...current]); return; } for (let i = Math.min(remaining, max); i >= 1; i--) { current.push(i); generate(remaining - i, i - 1); current.pop(); } }; generate(n, n); return result; }
}
export const quantumPartition = QuantumPartition.getInstance();
