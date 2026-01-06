/**
 * Astral Ugly Number Generator
 */
import { EventEmitter } from 'events';
export class AstralUglyNumber extends EventEmitter {
    private static instance: AstralUglyNumber;
    private constructor() { super(); }
    static getInstance(): AstralUglyNumber { if (!AstralUglyNumber.instance) { AstralUglyNumber.instance = new AstralUglyNumber(); } return AstralUglyNumber.instance; }
    nthUglyNumber(n: number): number { const ugly = new Array(n); ugly[0] = 1; let i2 = 0, i3 = 0, i5 = 0; for (let i = 1; i < n; i++) { const next2 = ugly[i2] * 2, next3 = ugly[i3] * 3, next5 = ugly[i5] * 5; ugly[i] = Math.min(next2, next3, next5); if (ugly[i] === next2) i2++; if (ugly[i] === next3) i3++; if (ugly[i] === next5) i5++; } return ugly[n - 1]; }
    nthSuperUglyNumber(n: number, primes: number[]): number { const ugly = new Array(n); ugly[0] = 1; const indices = new Array(primes.length).fill(0); const values = [...primes]; for (let i = 1; i < n; i++) { ugly[i] = Math.min(...values); for (let j = 0; j < primes.length; j++) { if (values[j] === ugly[i]) { indices[j]++; values[j] = ugly[indices[j]] * primes[j]; } } } return ugly[n - 1]; }
    isUgly(n: number): boolean { if (n <= 0) return false; for (const p of [2, 3, 5]) while (n % p === 0) n /= p; return n === 1; }
}
export const astralUglyNumber = AstralUglyNumber.getInstance();
