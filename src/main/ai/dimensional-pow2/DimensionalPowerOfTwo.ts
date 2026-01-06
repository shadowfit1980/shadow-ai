/**
 * Dimensional Power of Two
 */
import { EventEmitter } from 'events';
export class DimensionalPowerOfTwo extends EventEmitter {
    private static instance: DimensionalPowerOfTwo;
    private constructor() { super(); }
    static getInstance(): DimensionalPowerOfTwo { if (!DimensionalPowerOfTwo.instance) { DimensionalPowerOfTwo.instance = new DimensionalPowerOfTwo(); } return DimensionalPowerOfTwo.instance; }
    isPowerOfTwo(n: number): boolean { return n > 0 && (n & (n - 1)) === 0; }
    isPowerOfThree(n: number): boolean { if (n <= 0) return false; while (n % 3 === 0) n /= 3; return n === 1; }
    isPowerOfFour(n: number): boolean { return n > 0 && (n & (n - 1)) === 0 && (n & 0x55555555) !== 0; }
    nextPowerOfTwo(n: number): number { if (n <= 0) return 1; n--; n |= n >> 1; n |= n >> 2; n |= n >> 4; n |= n >> 8; n |= n >> 16; return n + 1; }
    prevPowerOfTwo(n: number): number { if (n <= 0) return 0; n |= n >> 1; n |= n >> 2; n |= n >> 4; n |= n >> 8; n |= n >> 16; return (n + 1) >> 1; }
    log2(n: number): number { let log = 0; while ((1 << log) < n) log++; return log; }
}
export const dimensionalPowerOfTwo = DimensionalPowerOfTwo.getInstance();
