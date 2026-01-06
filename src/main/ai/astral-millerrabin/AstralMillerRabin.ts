/**
 * Astral Miller Rabin
 */
import { EventEmitter } from 'events';
export class AstralMillerRabin extends EventEmitter {
    private static instance: AstralMillerRabin;
    private constructor() { super(); }
    static getInstance(): AstralMillerRabin { if (!AstralMillerRabin.instance) { AstralMillerRabin.instance = new AstralMillerRabin(); } return AstralMillerRabin.instance; }
    private modPow(base: bigint, exp: bigint, mod: bigint): bigint { let result = 1n; base = base % mod; while (exp > 0n) { if (exp % 2n === 1n) result = (result * base) % mod; exp = exp / 2n; base = (base * base) % mod; } return result; }
    isPrime(n: number, k: number = 10): boolean { if (n < 2) return false; if (n === 2 || n === 3) return true; if (n % 2 === 0) return false; const nBig = BigInt(n); let d = nBig - 1n; let r = 0n; while (d % 2n === 0n) { d /= 2n; r++; } outer: for (let i = 0; i < k; i++) { const a = BigInt(2 + Math.floor(Math.random() * (n - 4))); let x = this.modPow(a, d, nBig); if (x === 1n || x === nBig - 1n) continue; for (let j = 0n; j < r - 1n; j++) { x = (x * x) % nBig; if (x === nBig - 1n) continue outer; } return false; } return true; }
}
export const astralMillerRabin = AstralMillerRabin.getInstance();
