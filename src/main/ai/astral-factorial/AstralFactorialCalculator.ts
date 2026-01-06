/**
 * Astral Factorial Calculator
 */
import { EventEmitter } from 'events';
export class AstralFactorialCalculator extends EventEmitter {
    private static instance: AstralFactorialCalculator;
    private cache: Map<number, bigint> = new Map();
    private constructor() { super(); }
    static getInstance(): AstralFactorialCalculator { if (!AstralFactorialCalculator.instance) { AstralFactorialCalculator.instance = new AstralFactorialCalculator(); } return AstralFactorialCalculator.instance; }
    factorial(n: number): bigint { if (n <= 1) return BigInt(1); if (this.cache.has(n)) return this.cache.get(n)!; const result = BigInt(n) * this.factorial(n - 1); this.cache.set(n, result); return result; }
    getStats(): { cached: number } { return { cached: this.cache.size }; }
}
export const astralFactorialCalculator = AstralFactorialCalculator.getInstance();
