/**
 * Quantum Pollard Rho
 */
import { EventEmitter } from 'events';
export class QuantumPollardRho extends EventEmitter {
    private static instance: QuantumPollardRho;
    private constructor() { super(); }
    static getInstance(): QuantumPollardRho { if (!QuantumPollardRho.instance) { QuantumPollardRho.instance = new QuantumPollardRho(); } return QuantumPollardRho.instance; }
    private gcd(a: bigint, b: bigint): bigint { return b === 0n ? a : this.gcd(b, a % b); }
    private abs(n: bigint): bigint { return n < 0n ? -n : n; }
    findFactor(n: number): number { if (n === 1) return 1; if (n % 2 === 0) return 2; const nBig = BigInt(n); let x = BigInt(Math.floor(Math.random() * (n - 2)) + 2); let y = x; const c = BigInt(Math.floor(Math.random() * (n - 1)) + 1); const f = (x: bigint) => (x * x + c) % nBig; let d = 1n; while (d === 1n) { x = f(x); y = f(f(y)); d = this.gcd(this.abs(x - y), nBig); } return d === nBig ? n : Number(d); }
    factorize(n: number): number[] { if (n === 1) return []; if (this.isPrime(n)) return [n]; const factor = this.findFactor(n); return [...this.factorize(factor), ...this.factorize(n / factor)].sort((a, b) => a - b); }
    private isPrime(n: number): boolean { if (n < 2) return false; if (n === 2) return true; if (n % 2 === 0) return false; for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false; return true; }
}
export const quantumPollardRho = QuantumPollardRho.getInstance();
