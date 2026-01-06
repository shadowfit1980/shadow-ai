/**
 * Dimensional Number Theoretic Transform
 */
import { EventEmitter } from 'events';
export class DimensionalNTT extends EventEmitter {
    private static instance: DimensionalNTT;
    private mod: number = 998244353;
    private g: number = 3;
    private constructor() { super(); }
    static getInstance(): DimensionalNTT { if (!DimensionalNTT.instance) { DimensionalNTT.instance = new DimensionalNTT(); } return DimensionalNTT.instance; }
    private modPow(base: number, exp: number, mod: number): number { let result = 1; base %= mod; while (exp > 0) { if (exp & 1) result = (result * base) % mod; exp >>= 1; base = (base * base) % mod; } return result; }
    ntt(a: number[], invert: boolean = false): number[] { const n = a.length; const result = [...a]; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) [result[i], result[j]] = [result[j], result[i]]; } for (let len = 2; len <= n; len <<= 1) { const w = invert ? this.modPow(this.g, this.mod - 1 - (this.mod - 1) / len, this.mod) : this.modPow(this.g, (this.mod - 1) / len, this.mod); for (let i = 0; i < n; i += len) { let wn = 1; for (let j = 0; j < len / 2; j++) { const u = result[i + j]; const v = (result[i + j + len / 2] * wn) % this.mod; result[i + j] = (u + v) % this.mod; result[i + j + len / 2] = ((u - v) % this.mod + this.mod) % this.mod; wn = (wn * w) % this.mod; } } } if (invert) { const nInv = this.modPow(n, this.mod - 2, this.mod); for (let i = 0; i < n; i++) result[i] = (result[i] * nInv) % this.mod; } return result; }
}
export const dimensionalNTT = DimensionalNTT.getInstance();
