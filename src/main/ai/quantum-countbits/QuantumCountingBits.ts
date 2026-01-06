/**
 * Quantum Counting Bits
 */
import { EventEmitter } from 'events';
export class QuantumCountingBits extends EventEmitter {
    private static instance: QuantumCountingBits;
    private constructor() { super(); }
    static getInstance(): QuantumCountingBits { if (!QuantumCountingBits.instance) { QuantumCountingBits.instance = new QuantumCountingBits(); } return QuantumCountingBits.instance; }
    countBits(n: number): number[] { const result = new Array(n + 1).fill(0); for (let i = 1; i <= n; i++) result[i] = result[i >> 1] + (i & 1); return result; }
    hammingWeight(n: number): number { let count = 0; while (n) { count += n & 1; n >>>= 1; } return count; }
    hammingDistance(x: number, y: number): number { return this.hammingWeight(x ^ y); }
    totalHammingDistance(nums: number[]): number { let total = 0; for (let bit = 0; bit < 32; bit++) { let ones = 0; for (const num of nums) if (num & (1 << bit)) ones++; total += ones * (nums.length - ones); } return total; }
    reverseBits(n: number): number { let result = 0; for (let i = 0; i < 32; i++) { result = (result << 1) | (n & 1); n >>>= 1; } return result >>> 0; }
}
export const quantumCountingBits = QuantumCountingBits.getInstance();
