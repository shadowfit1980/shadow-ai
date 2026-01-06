/**
 * Mystic Extended GCD
 */
import { EventEmitter } from 'events';
export class MysticExtendedGCD extends EventEmitter {
    private static instance: MysticExtendedGCD;
    private constructor() { super(); }
    static getInstance(): MysticExtendedGCD { if (!MysticExtendedGCD.instance) { MysticExtendedGCD.instance = new MysticExtendedGCD(); } return MysticExtendedGCD.instance; }
    extgcd(a: number, b: number): { gcd: number; x: number; y: number } { if (b === 0) return { gcd: a, x: 1, y: 0 }; const { gcd, x, y } = this.extgcd(b, a % b); return { gcd, x: y, y: x - Math.floor(a / b) * y }; }
    modInverse(a: number, m: number): number { const { gcd, x } = this.extgcd(a, m); if (gcd !== 1) return -1; return ((x % m) + m) % m; }
    linearDiophantine(a: number, b: number, c: number): { x: number; y: number } | null { const { gcd, x, y } = this.extgcd(a, b); if (c % gcd !== 0) return null; const factor = c / gcd; return { x: x * factor, y: y * factor }; }
    crt(remainders: number[], moduli: number[]): number { let M = moduli.reduce((a, b) => a * b, 1); let result = 0; for (let i = 0; i < remainders.length; i++) { const mi = moduli[i]; const Mi = M / mi; const yi = this.modInverse(Mi, mi); result += remainders[i] * Mi * yi; } return result % M; }
}
export const mysticExtendedGCD = MysticExtendedGCD.getInstance();
