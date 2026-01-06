/**
 * Dimensional Ugly Numbers
 */
import { EventEmitter } from 'events';
export class DimensionalUglyNumbers extends EventEmitter {
    private static instance: DimensionalUglyNumbers;
    private constructor() { super(); }
    static getInstance(): DimensionalUglyNumbers { if (!DimensionalUglyNumbers.instance) { DimensionalUglyNumbers.instance = new DimensionalUglyNumbers(); } return DimensionalUglyNumbers.instance; }
    isUgly(n: number): boolean { if (n <= 0) return false; while (n % 2 === 0) n /= 2; while (n % 3 === 0) n /= 3; while (n % 5 === 0) n /= 5; return n === 1; }
    nthUglyNumber(n: number): number { const ugly = new Array(n); ugly[0] = 1; let p2 = 0, p3 = 0, p5 = 0; for (let i = 1; i < n; i++) { const next = Math.min(ugly[p2] * 2, ugly[p3] * 3, ugly[p5] * 5); ugly[i] = next; if (next === ugly[p2] * 2) p2++; if (next === ugly[p3] * 3) p3++; if (next === ugly[p5] * 5) p5++; } return ugly[n - 1]; }
    nthSuperUglyNumber(n: number, primes: number[]): number { const ugly = new Array(n).fill(0); ugly[0] = 1; const pointers = new Array(primes.length).fill(0); for (let i = 1; i < n; i++) { let minVal = Infinity; for (let j = 0; j < primes.length; j++) minVal = Math.min(minVal, ugly[pointers[j]] * primes[j]); ugly[i] = minVal; for (let j = 0; j < primes.length; j++) if (ugly[pointers[j]] * primes[j] === minVal) pointers[j]++; } return ugly[n - 1]; }
}
export const dimensionalUglyNumbers = DimensionalUglyNumbers.getInstance();
