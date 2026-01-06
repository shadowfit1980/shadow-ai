/**
 * Cosmic Single Number
 */
import { EventEmitter } from 'events';
export class CosmicSingleNumber extends EventEmitter {
    private static instance: CosmicSingleNumber;
    private constructor() { super(); }
    static getInstance(): CosmicSingleNumber { if (!CosmicSingleNumber.instance) { CosmicSingleNumber.instance = new CosmicSingleNumber(); } return CosmicSingleNumber.instance; }
    singleNumber(nums: number[]): number { return nums.reduce((a, b) => a ^ b, 0); }
    singleNumberII(nums: number[]): number { let ones = 0, twos = 0; for (const num of nums) { ones = (ones ^ num) & ~twos; twos = (twos ^ num) & ~ones; } return ones; }
    singleNumberIII(nums: number[]): number[] { const xor = nums.reduce((a, b) => a ^ b, 0); const diff = xor & -xor; let a = 0, b = 0; for (const num of nums) { if (num & diff) a ^= num; else b ^= num; } return [a, b]; }
    missingNumber(nums: number[]): number { const n = nums.length; return n * (n + 1) / 2 - nums.reduce((a, b) => a + b, 0); }
}
export const cosmicSingleNumber = CosmicSingleNumber.getInstance();
