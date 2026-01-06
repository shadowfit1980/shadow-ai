/**
 * Cosmic Modular Arithmetic
 */
import { EventEmitter } from 'events';
export class CosmicModArith extends EventEmitter {
    private static instance: CosmicModArith;
    private mod: number = 1e9 + 7;
    private constructor() { super(); }
    static getInstance(): CosmicModArith { if (!CosmicModArith.instance) { CosmicModArith.instance = new CosmicModArith(); } return CosmicModArith.instance; }
    setMod(m: number): void { this.mod = m; }
    add(a: number, b: number): number { return ((a % this.mod) + (b % this.mod)) % this.mod; }
    sub(a: number, b: number): number { return (((a % this.mod) - (b % this.mod)) % this.mod + this.mod) % this.mod; }
    mul(a: number, b: number): number { return ((a % this.mod) * (b % this.mod)) % this.mod; }
    pow(base: number, exp: number): number { let result = 1; base %= this.mod; while (exp > 0) { if (exp & 1) result = this.mul(result, base); base = this.mul(base, base); exp >>= 1; } return result; }
    modInverse(a: number): number { return this.pow(a, this.mod - 2); }
    div(a: number, b: number): number { return this.mul(a, this.modInverse(b)); }
    nCrMod(n: number, r: number): number { if (r > n) return 0; const fact = [1]; for (let i = 1; i <= n; i++) fact.push(this.mul(fact[i - 1], i)); return this.div(fact[n], this.mul(fact[r], fact[n - r])); }
    lucasNcr(n: number, r: number, p: number): number { if (r === 0) return 1; return this.mul(this.lucasNcr(Math.floor(n / p), Math.floor(r / p), p), this.nCrSmall(n % p, r % p, p)); }
    private nCrSmall(n: number, r: number, p: number): number { if (r > n) return 0; const oldMod = this.mod; this.mod = p; const result = this.nCrMod(n, r); this.mod = oldMod; return result; }
}
export const cosmicModArith = CosmicModArith.getInstance();
