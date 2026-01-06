/**
 * Cosmic Decode Ways
 */
import { EventEmitter } from 'events';
export class CosmicDecodeWays extends EventEmitter {
    private static instance: CosmicDecodeWays;
    private constructor() { super(); }
    static getInstance(): CosmicDecodeWays { if (!CosmicDecodeWays.instance) { CosmicDecodeWays.instance = new CosmicDecodeWays(); } return CosmicDecodeWays.instance; }
    numDecodings(s: string): number { if (s.length === 0 || s[0] === '0') return 0; const n = s.length; let prev2 = 1, prev1 = 1; for (let i = 1; i < n; i++) { let curr = 0; if (s[i] !== '0') curr += prev1; const twoDigit = parseInt(s.slice(i - 1, i + 1)); if (twoDigit >= 10 && twoDigit <= 26) curr += prev2; prev2 = prev1; prev1 = curr; } return prev1; }
    numDecodingsWithWildcard(s: string): number { const MOD = 1e9 + 7; const n = s.length; let prev2 = 1n, prev1 = s[0] === '*' ? 9n : s[0] === '0' ? 0n : 1n; for (let i = 1; i < n; i++) { let curr = 0n; if (s[i] === '*') { curr = prev1 * 9n; if (s[i - 1] === '1') curr += prev2 * 9n; else if (s[i - 1] === '2') curr += prev2 * 6n; else if (s[i - 1] === '*') curr += prev2 * 15n; } else { if (s[i] !== '0') curr = prev1; if (s[i - 1] === '1' || (s[i - 1] === '2' && s[i] <= '6')) curr += prev2; else if (s[i - 1] === '*') curr += prev2 * (s[i] <= '6' ? 2n : 1n); } curr = curr % BigInt(MOD); prev2 = prev1; prev1 = curr; } return Number(prev1); }
}
export const cosmicDecodeWays = CosmicDecodeWays.getInstance();
