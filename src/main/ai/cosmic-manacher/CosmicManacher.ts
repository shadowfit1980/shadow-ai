/**
 * Cosmic Manacher
 */
import { EventEmitter } from 'events';
export class CosmicManacher extends EventEmitter {
    private static instance: CosmicManacher;
    private constructor() { super(); }
    static getInstance(): CosmicManacher { if (!CosmicManacher.instance) { CosmicManacher.instance = new CosmicManacher(); } return CosmicManacher.instance; }
    longestPalindrome(s: string): string { if (s.length < 2) return s; let start = 0, maxLen = 1; for (let i = 0; i < s.length; i++) { let l = i, r = i; while (r < s.length - 1 && s[r] === s[r + 1]) r++; while (l > 0 && r < s.length - 1 && s[l - 1] === s[r + 1]) { l--; r++; } if (r - l + 1 > maxLen) { start = l; maxLen = r - l + 1; } } return s.substring(start, start + maxLen); }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const cosmicManacher = CosmicManacher.getInstance();
