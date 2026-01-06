/**
 * Ethereal KMP
 */
import { EventEmitter } from 'events';
export class EtherealKMP extends EventEmitter {
    private static instance: EtherealKMP;
    private constructor() { super(); }
    static getInstance(): EtherealKMP { if (!EtherealKMP.instance) { EtherealKMP.instance = new EtherealKMP(); } return EtherealKMP.instance; }
    private computeLPS(pattern: string): number[] { const lps = new Array(pattern.length).fill(0); let len = 0, i = 1; while (i < pattern.length) { if (pattern[i] === pattern[len]) { lps[i++] = ++len; } else if (len > 0) { len = lps[len - 1]; } else { lps[i++] = 0; } } return lps; }
    search(text: string, pattern: string): number[] { const lps = this.computeLPS(pattern); const indices: number[] = []; let i = 0, j = 0; while (i < text.length) { if (pattern[j] === text[i]) { i++; j++; } if (j === pattern.length) { indices.push(i - j); j = lps[j - 1]; } else if (i < text.length && pattern[j] !== text[i]) { j > 0 ? j = lps[j - 1] : i++; } } return indices; }
    getStats(): { searched: number } { return { searched: 0 }; }
}
export const etherealKMP = EtherealKMP.getInstance();
