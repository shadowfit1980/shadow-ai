/**
 * Mystic Bit Manipulation
 */
import { EventEmitter } from 'events';
export class MysticBitManip extends EventEmitter {
    private static instance: MysticBitManip;
    private constructor() { super(); }
    static getInstance(): MysticBitManip { if (!MysticBitManip.instance) { MysticBitManip.instance = new MysticBitManip(); } return MysticBitManip.instance; }
    getBit(n: number, i: number): boolean { return ((n >> i) & 1) === 1; }
    setBit(n: number, i: number): number { return n | (1 << i); }
    clearBit(n: number, i: number): number { return n & ~(1 << i); }
    toggleBit(n: number, i: number): number { return n ^ (1 << i); }
    clearLowestSetBit(n: number): number { return n & (n - 1); }
    isolateLowestSetBit(n: number): number { return n & -n; }
    swap(a: number, b: number): [number, number] { a ^= b; b ^= a; a ^= b; return [a, b]; }
    countSetBits(n: number): number { let count = 0; while (n) { n &= n - 1; count++; } return count; }
    isPalindromeBinary(n: number): boolean { const bits = n.toString(2); return bits === bits.split('').reverse().join(''); }
    rangeBitwiseAnd(left: number, right: number): number { let shift = 0; while (left !== right) { left >>= 1; right >>= 1; shift++; } return left << shift; }
}
export const mysticBitManip = MysticBitManip.getInstance();
