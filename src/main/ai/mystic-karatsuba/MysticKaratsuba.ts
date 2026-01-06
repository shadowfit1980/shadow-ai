/**
 * Mystic Karatsuba
 */
import { EventEmitter } from 'events';
export class MysticKaratsuba extends EventEmitter {
    private static instance: MysticKaratsuba;
    private constructor() { super(); }
    static getInstance(): MysticKaratsuba { if (!MysticKaratsuba.instance) { MysticKaratsuba.instance = new MysticKaratsuba(); } return MysticKaratsuba.instance; }
    multiply(a: number[], b: number[]): number[] { const n = Math.max(a.length, b.length); if (n <= 32) return this.naiveMultiply(a, b); const half = Math.ceil(n / 2); const aLow = a.slice(0, half), aHigh = a.slice(half); const bLow = b.slice(0, half), bHigh = b.slice(half); const z0 = this.multiply(aLow, bLow); const z2 = this.multiply(aHigh, bHigh); const aSum = this.addArrays(aLow, aHigh); const bSum = this.addArrays(bLow, bHigh); const z1 = this.subtract(this.subtract(this.multiply(aSum, bSum), z0), z2); const result = new Array(2 * n).fill(0); for (let i = 0; i < z0.length; i++) result[i] += z0[i]; for (let i = 0; i < z1.length; i++) result[i + half] += z1[i]; for (let i = 0; i < z2.length; i++) result[i + 2 * half] += z2[i]; return result; }
    private naiveMultiply(a: number[], b: number[]): number[] { const result = new Array(a.length + b.length).fill(0); for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) result[i + j] += a[i] * b[j]; return result; }
    private addArrays(a: number[], b: number[]): number[] { const result = new Array(Math.max(a.length, b.length)).fill(0); for (let i = 0; i < a.length; i++) result[i] += a[i]; for (let i = 0; i < b.length; i++) result[i] += b[i]; return result; }
    private subtract(a: number[], b: number[]): number[] { const result = [...a]; for (let i = 0; i < b.length; i++) result[i] = (result[i] || 0) - b[i]; return result; }
}
export const mysticKaratsuba = MysticKaratsuba.getInstance();
