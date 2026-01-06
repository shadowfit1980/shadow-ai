/**
 * Astral Missing Number
 */
import { EventEmitter } from 'events';
export class AstralMissingNumber extends EventEmitter {
    private static instance: AstralMissingNumber;
    private constructor() { super(); }
    static getInstance(): AstralMissingNumber { if (!AstralMissingNumber.instance) { AstralMissingNumber.instance = new AstralMissingNumber(); } return AstralMissingNumber.instance; }
    missingNumber(nums: number[]): number { const n = nums.length; const expectedSum = (n * (n + 1)) / 2; const actualSum = nums.reduce((a, b) => a + b, 0); return expectedSum - actualSum; }
    getStats(): { found: number } { return { found: 0 }; }
}
export const astralMissingNumber = AstralMissingNumber.getInstance();
