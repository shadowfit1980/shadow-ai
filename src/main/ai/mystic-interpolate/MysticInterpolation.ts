/**
 * Mystic Interpolation
 */
import { EventEmitter } from 'events';
export class MysticInterpolation extends EventEmitter {
    private static instance: MysticInterpolation;
    private constructor() { super(); }
    static getInstance(): MysticInterpolation { if (!MysticInterpolation.instance) { MysticInterpolation.instance = new MysticInterpolation(); } return MysticInterpolation.instance; }
    lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
    inverseLerp(a: number, b: number, v: number): number { return (v - a) / (b - a); }
    remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number { const t = this.inverseLerp(inMin, inMax, v); return this.lerp(outMin, outMax, t); }
    getStats(): { interpolated: number } { return { interpolated: 0 }; }
}
export const mysticInterpolation = MysticInterpolation.getInstance();
