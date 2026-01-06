/**
 * Quantum Town Judge
 */
import { EventEmitter } from 'events';
export class QuantumTownJudge extends EventEmitter {
    private static instance: QuantumTownJudge;
    private constructor() { super(); }
    static getInstance(): QuantumTownJudge { if (!QuantumTownJudge.instance) { QuantumTownJudge.instance = new QuantumTownJudge(); } return QuantumTownJudge.instance; }
    findJudge(n: number, trust: number[][]): number { const trustCount = new Array(n + 1).fill(0); for (const [a, b] of trust) { trustCount[a]--; trustCount[b]++; } for (let i = 1; i <= n; i++) if (trustCount[i] === n - 1) return i; return -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const quantumTownJudge = QuantumTownJudge.getInstance();
