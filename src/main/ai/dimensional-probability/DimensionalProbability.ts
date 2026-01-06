/**
 * Dimensional Probability
 */
import { EventEmitter } from 'events';
export class DimensionalProbability extends EventEmitter {
    private static instance: DimensionalProbability;
    private constructor() { super(); }
    static getInstance(): DimensionalProbability { if (!DimensionalProbability.instance) { DimensionalProbability.instance = new DimensionalProbability(); } return DimensionalProbability.instance; }
    factorial(n: number): number { if (n <= 1) return 1; let result = 1; for (let i = 2; i <= n; i++) result *= i; return result; }
    nCr(n: number, r: number): number { if (r > n || r < 0) return 0; if (r === 0 || r === n) return 1; r = Math.min(r, n - r); let result = 1; for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1); return Math.round(result); }
    nPr(n: number, r: number): number { if (r > n || r < 0) return 0; let result = 1; for (let i = 0; i < r; i++) result *= n - i; return result; }
    binomialProbability(n: number, k: number, p: number): number { return this.nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); }
    poissonProbability(lambda: number, k: number): number { return Math.pow(lambda, k) * Math.exp(-lambda) / this.factorial(k); }
    normalPDF(x: number, mean: number = 0, std: number = 1): number { const exp = -0.5 * Math.pow((x - mean) / std, 2); return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exp); }
    exponentialPDF(x: number, lambda: number): number { if (x < 0) return 0; return lambda * Math.exp(-lambda * x); }
    geometricProbability(k: number, p: number): number { return Math.pow(1 - p, k - 1) * p; }
}
export const dimensionalProbability = DimensionalProbability.getInstance();
