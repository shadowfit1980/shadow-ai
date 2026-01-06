/**
 * Cosmic Sieve of Eratosthenes
 */
import { EventEmitter } from 'events';
export class CosmicSieve extends EventEmitter {
    private static instance: CosmicSieve;
    private constructor() { super(); }
    static getInstance(): CosmicSieve { if (!CosmicSieve.instance) { CosmicSieve.instance = new CosmicSieve(); } return CosmicSieve.instance; }
    sieve(n: number): boolean[] { const isPrime = new Array(n + 1).fill(true); isPrime[0] = isPrime[1] = false; for (let i = 2; i * i <= n; i++) if (isPrime[i]) for (let j = i * i; j <= n; j += i) isPrime[j] = false; return isPrime; }
    getPrimes(n: number): number[] { const isPrime = this.sieve(n); const primes: number[] = []; for (let i = 2; i <= n; i++) if (isPrime[i]) primes.push(i); return primes; }
    segmentedSieve(l: number, r: number): number[] { const limit = Math.floor(Math.sqrt(r)) + 1; const basePrimes = this.getPrimes(limit); const isPrime = new Array(r - l + 1).fill(true); for (const p of basePrimes) { let start = Math.max(p * p, Math.ceil(l / p) * p); if (start === p) start += p; for (let j = start; j <= r; j += p) isPrime[j - l] = false; } const primes: number[] = []; for (let i = 0; i < isPrime.length; i++) if (isPrime[i] && i + l > 1) primes.push(i + l); return primes; }
}
export const cosmicSieve = CosmicSieve.getInstance();
