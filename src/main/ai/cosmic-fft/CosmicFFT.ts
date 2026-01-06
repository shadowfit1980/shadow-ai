/**
 * Cosmic Fast Fourier Transform
 */
import { EventEmitter } from 'events';
export class CosmicFFT extends EventEmitter {
    private static instance: CosmicFFT;
    private constructor() { super(); }
    static getInstance(): CosmicFFT { if (!CosmicFFT.instance) { CosmicFFT.instance = new CosmicFFT(); } return CosmicFFT.instance; }
    fft(a: [number, number][], invert: boolean = false): [number, number][] { const n = a.length; if (n === 1) return a; const result = [...a]; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) [result[i], result[j]] = [result[j], result[i]]; } for (let len = 2; len <= n; len <<= 1) { const ang = (2 * Math.PI / len) * (invert ? -1 : 1); const wlen: [number, number] = [Math.cos(ang), Math.sin(ang)]; for (let i = 0; i < n; i += len) { let w: [number, number] = [1, 0]; for (let j = 0; j < len / 2; j++) { const u = result[i + j]; const v: [number, number] = [result[i + j + len / 2][0] * w[0] - result[i + j + len / 2][1] * w[1], result[i + j + len / 2][0] * w[1] + result[i + j + len / 2][1] * w[0]]; result[i + j] = [u[0] + v[0], u[1] + v[1]]; result[i + j + len / 2] = [u[0] - v[0], u[1] - v[1]]; w = [w[0] * wlen[0] - w[1] * wlen[1], w[0] * wlen[1] + w[1] * wlen[0]]; } } } if (invert) for (let i = 0; i < n; i++) { result[i][0] /= n; result[i][1] /= n; } return result; }
    multiply(a: number[], b: number[]): number[] { let n = 1; while (n < a.length + b.length) n <<= 1; const fa: [number, number][] = Array.from({ length: n }, (_, i) => [a[i] || 0, 0]); const fb: [number, number][] = Array.from({ length: n }, (_, i) => [b[i] || 0, 0]); const faT = this.fft(fa); const fbT = this.fft(fb); const fc: [number, number][] = faT.map((v, i) => [v[0] * fbT[i][0] - v[1] * fbT[i][1], v[0] * fbT[i][1] + v[1] * fbT[i][0]]); return this.fft(fc, true).map(v => Math.round(v[0])); }
}
export const cosmicFFT = CosmicFFT.getInstance();
