/**
 * Dimensional Prime Sieve
 */
import { EventEmitter } from 'events';
export class DimensionalPrimeSieve extends EventEmitter {
    private static instance: DimensionalPrimeSieve;
    private constructor() { super(); }
    static getInstance(): DimensionalPrimeSieve { if (!DimensionalPrimeSieve.instance) { DimensionalPrimeSieve.instance = new DimensionalPrimeSieve(); } return DimensionalPrimeSieve.instance; }
    sieve(n: number): number[] { const isPrime = Array(n + 1).fill(true); isPrime[0] = isPrime[1] = false; for (let i = 2; i * i <= n; i++) if (isPrime[i]) for (let j = i * i; j <= n; j += i) isPrime[j] = false; return isPrime.map((p, i) => p ? i : -1).filter(x => x > 0); }
    getStats(): { sieves: number } { return { sieves: 0 }; }
}
export const dimensionalPrimeSieve = DimensionalPrimeSieve.getInstance();
