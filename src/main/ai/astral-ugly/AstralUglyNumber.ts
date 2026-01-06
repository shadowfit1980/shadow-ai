/**
 * Astral Ugly Number
 */
import { EventEmitter } from 'events';
export class AstralUglyNumber extends EventEmitter {
    private static instance: AstralUglyNumber;
    private constructor() { super(); }
    static getInstance(): AstralUglyNumber { if (!AstralUglyNumber.instance) { AstralUglyNumber.instance = new AstralUglyNumber(); } return AstralUglyNumber.instance; }
    nthUglyNumber(n: number): number { const ugly = [1]; let i2 = 0, i3 = 0, i5 = 0; while (ugly.length < n) { const next = Math.min(ugly[i2] * 2, ugly[i3] * 3, ugly[i5] * 5); ugly.push(next); if (next === ugly[i2] * 2) i2++; if (next === ugly[i3] * 3) i3++; if (next === ugly[i5] * 5) i5++; } return ugly[n - 1]; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const astralUglyNumber = AstralUglyNumber.getInstance();
