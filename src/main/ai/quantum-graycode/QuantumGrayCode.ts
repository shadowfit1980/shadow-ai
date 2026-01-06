/**
 * Quantum Gray Code
 */
import { EventEmitter } from 'events';
export class QuantumGrayCode extends EventEmitter {
    private static instance: QuantumGrayCode;
    private constructor() { super(); }
    static getInstance(): QuantumGrayCode { if (!QuantumGrayCode.instance) { QuantumGrayCode.instance = new QuantumGrayCode(); } return QuantumGrayCode.instance; }
    grayCode(n: number): number[] { const result: number[] = []; for (let i = 0; i < (1 << n); i++) result.push(i ^ (i >> 1)); return result; }
    toGray(n: number): number { return n ^ (n >> 1); }
    fromGray(gray: number): number { let n = 0; while (gray) { n ^= gray; gray >>= 1; } return n; }
    circularPermutation(n: number, start: number): number[] { const base = this.grayCode(n); const startIdx = base.indexOf(start); return [...base.slice(startIdx), ...base.slice(0, startIdx)]; }
    grayCodePath(n: number): string[] { return this.grayCode(n).map(x => x.toString(2).padStart(n, '0')); }
}
export const quantumGrayCode = QuantumGrayCode.getInstance();
