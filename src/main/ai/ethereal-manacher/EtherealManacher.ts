/**
 * Ethereal Manacher
 */
import { EventEmitter } from 'events';
export class EtherealManacher extends EventEmitter {
    private static instance: EtherealManacher;
    private constructor() { super(); }
    static getInstance(): EtherealManacher { if (!EtherealManacher.instance) { EtherealManacher.instance = new EtherealManacher(); } return EtherealManacher.instance; }
    longestPalindrome(s: string): string { const t = '#' + s.split('').join('#') + '#'; const p = new Array(t.length).fill(0); let center = 0, right = 0; for (let i = 1; i < t.length - 1; i++) { if (i < right) p[i] = Math.min(right - i, p[2 * center - i]); while (t[i + p[i] + 1] === t[i - p[i] - 1]) p[i]++; if (i + p[i] > right) { center = i; right = i + p[i]; } } let maxLen = 0, maxCenter = 0; for (let i = 0; i < p.length; i++) if (p[i] > maxLen) { maxLen = p[i]; maxCenter = i; } const start = (maxCenter - maxLen) / 2; return s.slice(start, start + maxLen); }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const etherealManacher = EtherealManacher.getInstance();
