/**
 * Quantum String Matching KMP
 */
import { EventEmitter } from 'events';
export class QuantumKMP extends EventEmitter {
    private static instance: QuantumKMP;
    private constructor() { super(); }
    static getInstance(): QuantumKMP { if (!QuantumKMP.instance) { QuantumKMP.instance = new QuantumKMP(); } return QuantumKMP.instance; }
    buildLPS(pattern: string): number[] { const lps = new Array(pattern.length).fill(0); let len = 0, i = 1; while (i < pattern.length) { if (pattern[i] === pattern[len]) { len++; lps[i++] = len; } else if (len > 0) { len = lps[len - 1]; } else { lps[i++] = 0; } } return lps; }
    search(text: string, pattern: string): number[] { const lps = this.buildLPS(pattern); const result: number[] = []; let i = 0, j = 0; while (i < text.length) { if (text[i] === pattern[j]) { i++; j++; if (j === pattern.length) { result.push(i - j); j = lps[j - 1]; } } else if (j > 0) { j = lps[j - 1]; } else { i++; } } return result; }
    strStr(haystack: string, needle: string): number { const results = this.search(haystack, needle); return results.length > 0 ? results[0] : -1; }
}
export const quantumKMP = QuantumKMP.getInstance();
