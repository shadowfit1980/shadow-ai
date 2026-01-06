/**
 * Astral Pow Function
 */
import { EventEmitter } from 'events';
export class AstralPowFunction extends EventEmitter {
    private static instance: AstralPowFunction;
    private constructor() { super(); }
    static getInstance(): AstralPowFunction { if (!AstralPowFunction.instance) { AstralPowFunction.instance = new AstralPowFunction(); } return AstralPowFunction.instance; }
    myPow(x: number, n: number): number {
        if (n === 0) return 1; if (n < 0) { x = 1 / x; n = -n; }
        let result = 1; while (n > 0) { if (n % 2 === 1) result *= x; x *= x; n = Math.floor(n / 2); } return result;
    }
    mySqrt(x: number): number { if (x < 2) return x; let lo = 1, hi = Math.floor(x / 2); while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); if (mid * mid === x) return mid; if (mid * mid < x) lo = mid + 1; else hi = mid - 1; } return hi; }
    isPerfectSquareRoot(num: number): boolean { if (num < 1) return false; const sqrt = this.mySqrt(num); return sqrt * sqrt === num; }
    trailingZeroes(n: number): number { let count = 0; while (n >= 5) { n = Math.floor(n / 5); count += n; } return count; }
}
export const astralPowFunction = AstralPowFunction.getInstance();
