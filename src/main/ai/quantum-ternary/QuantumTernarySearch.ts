/**
 * Quantum Ternary Search
 */
import { EventEmitter } from 'events';
export class QuantumTernarySearch extends EventEmitter {
    private static instance: QuantumTernarySearch;
    private constructor() { super(); }
    static getInstance(): QuantumTernarySearch { if (!QuantumTernarySearch.instance) { QuantumTernarySearch.instance = new QuantumTernarySearch(); } return QuantumTernarySearch.instance; }
    findMinimum(f: (x: number) => number, left: number, right: number, eps: number = 1e-9): number { while (right - left > eps) { const m1 = left + (right - left) / 3; const m2 = right - (right - left) / 3; if (f(m1) < f(m2)) right = m2; else left = m1; } return (left + right) / 2; }
    findMaximum(f: (x: number) => number, left: number, right: number, eps: number = 1e-9): number { while (right - left > eps) { const m1 = left + (right - left) / 3; const m2 = right - (right - left) / 3; if (f(m1) > f(m2)) right = m2; else left = m1; } return (left + right) / 2; }
    discreteMin(f: (x: number) => number, left: number, right: number): number { while (right - left > 2) { const m1 = left + Math.floor((right - left) / 3); const m2 = right - Math.floor((right - left) / 3); if (f(m1) < f(m2)) right = m2; else left = m1; } let minVal = Infinity, minIdx = left; for (let i = left; i <= right; i++) if (f(i) < minVal) { minVal = f(i); minIdx = i; } return minIdx; }
}
export const quantumTernarySearch = QuantumTernarySearch.getInstance();
