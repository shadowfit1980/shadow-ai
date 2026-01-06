/**
 * Dimensional Inclusion Exclusion
 */
import { EventEmitter } from 'events';
export class DimensionalInclusionExclusion extends EventEmitter {
    private static instance: DimensionalInclusionExclusion;
    private constructor() { super(); }
    static getInstance(): DimensionalInclusionExclusion { if (!DimensionalInclusionExclusion.instance) { DimensionalInclusionExclusion.instance = new DimensionalInclusionExclusion(); } return DimensionalInclusionExclusion.instance; }
    countUnion(sizes: number[], intersections: Map<string, number>): number { const n = sizes.length; let result = 0; for (let mask = 1; mask < (1 << n); mask++) { const indices: number[] = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) indices.push(i); const key = indices.sort((a, b) => a - b).join(','); const size = intersections.get(key) ?? 0; if (indices.length % 2 === 1) result += size; else result -= size; } return result; }
    derangements(n: number): number { const dp = [1, 0]; for (let i = 2; i <= n; i++) dp.push((i - 1) * (dp[i - 1] + dp[i - 2])); return dp[n]; }
    surjectiveCount(n: number, m: number): number { let result = 0; for (let k = 0; k <= m; k++) { const sign = k % 2 === 0 ? 1 : -1; result += sign * this.nCr(m, k) * Math.pow(m - k, n); } return result; }
    private nCr(n: number, r: number): number { if (r > n) return 0; let result = 1; for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1); return Math.round(result); }
    mobiusFunction(n: number): number { if (n === 1) return 1; let primeFactors = 0; let squareFree = true; let temp = n; for (let p = 2; p * p <= temp; p++) { if (temp % p === 0) { primeFactors++; temp /= p; if (temp % p === 0) { squareFree = false; break; } } } if (temp > 1) primeFactors++; if (!squareFree) return 0; return primeFactors % 2 === 0 ? 1 : -1; }
}
export const dimensionalInclusionExclusion = DimensionalInclusionExclusion.getInstance();
