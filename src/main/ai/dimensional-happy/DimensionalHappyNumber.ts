/**
 * Dimensional Happy Number
 */
import { EventEmitter } from 'events';
export class DimensionalHappyNumber extends EventEmitter {
    private static instance: DimensionalHappyNumber;
    private constructor() { super(); }
    static getInstance(): DimensionalHappyNumber { if (!DimensionalHappyNumber.instance) { DimensionalHappyNumber.instance = new DimensionalHappyNumber(); } return DimensionalHappyNumber.instance; }
    isHappy(n: number): boolean { const seen = new Set<number>(); while (n !== 1 && !seen.has(n)) { seen.add(n); n = this.sumOfSquares(n); } return n === 1; }
    private sumOfSquares(n: number): number { let sum = 0; while (n > 0) { const digit = n % 10; sum += digit * digit; n = Math.floor(n / 10); } return sum; }
    addDigits(num: number): number { if (num === 0) return 0; return 1 + (num - 1) % 9; }
    isUglyNumber(n: number): boolean { if (n <= 0) return false; while (n % 2 === 0) n /= 2; while (n % 3 === 0) n /= 3; while (n % 5 === 0) n /= 5; return n === 1; }
    isPowerOfThree(n: number): boolean { if (n <= 0) return false; while (n % 3 === 0) n /= 3; return n === 1; }
}
export const dimensionalHappyNumber = DimensionalHappyNumber.getInstance();
