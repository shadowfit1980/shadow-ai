/**
 * Dimensional Euler Totient
 */
import { EventEmitter } from 'events';
export class DimensionalEulerTotient extends EventEmitter {
    private static instance: DimensionalEulerTotient;
    private constructor() { super(); }
    static getInstance(): DimensionalEulerTotient { if (!DimensionalEulerTotient.instance) { DimensionalEulerTotient.instance = new DimensionalEulerTotient(); } return DimensionalEulerTotient.instance; }
    phi(n: number): number { let result = n; for (let p = 2; p * p <= n; p++) { if (n % p === 0) { while (n % p === 0) n = Math.floor(n / p); result -= Math.floor(result / p); } } if (n > 1) result -= Math.floor(result / n); return result; }
    phiSieve(n: number): number[] { const phi = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 2; i <= n; i++) if (phi[i] === i) for (let j = i; j <= n; j += i) phi[j] -= Math.floor(phi[j] / i); return phi; }
    sumOfGCDWithN(n: number): number { let sum = 0; const phi = this.phi; for (let d = 1; d * d <= n; d++) { if (n % d === 0) { sum += d * phi(Math.floor(n / d)); if (d !== Math.floor(n / d)) sum += Math.floor(n / d) * phi(d); } } return sum; }
}
export const dimensionalEulerTotient = DimensionalEulerTotient.getInstance();
