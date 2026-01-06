/**
 * Quantum Z-Algorithm
 */
import { EventEmitter } from 'events';
export class QuantumZAlgorithm extends EventEmitter {
    private static instance: QuantumZAlgorithm;
    private constructor() { super(); }
    static getInstance(): QuantumZAlgorithm { if (!QuantumZAlgorithm.instance) { QuantumZAlgorithm.instance = new QuantumZAlgorithm(); } return QuantumZAlgorithm.instance; }
    compute(s: string): number[] { const z = new Array(s.length).fill(0); z[0] = s.length; for (let i = 1, l = 0, r = 0; i < s.length; i++) { if (i < r) z[i] = Math.min(r - i, z[i - l]); while (i + z[i] < s.length && s[z[i]] === s[i + z[i]]) z[i]++; if (i + z[i] > r) { l = i; r = i + z[i]; } } return z; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const quantumZAlgorithm = QuantumZAlgorithm.getInstance();
