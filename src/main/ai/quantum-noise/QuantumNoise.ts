/**
 * Quantum Noise
 */
import { EventEmitter } from 'events';
export class QuantumNoise extends EventEmitter {
    private static instance: QuantumNoise;
    private constructor() { super(); }
    static getInstance(): QuantumNoise { if (!QuantumNoise.instance) { QuantumNoise.instance = new QuantumNoise(); } return QuantumNoise.instance; }
    perlin1D(x: number): number { const xi = Math.floor(x) & 255; const xf = x - Math.floor(x); const u = this.fade(xf); return this.lerp(this.grad(xi, xf), this.grad(xi + 1, xf - 1), u); }
    private fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
    private lerp(a: number, b: number, t: number): number { return a + t * (b - a); }
    private grad(hash: number, x: number): number { return (hash & 1) === 0 ? x : -x; }
    getStats(): { generated: number } { return { generated: 0 }; }
}
export const quantumNoise = QuantumNoise.getInstance();
