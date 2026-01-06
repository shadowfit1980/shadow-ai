/**
 * Mystic Scramble String
 */
import { EventEmitter } from 'events';
export class MysticScrambleString extends EventEmitter {
    private static instance: MysticScrambleString;
    private memo: Map<string, boolean> = new Map();
    private constructor() { super(); }
    static getInstance(): MysticScrambleString { if (!MysticScrambleString.instance) { MysticScrambleString.instance = new MysticScrambleString(); } return MysticScrambleString.instance; }
    isScramble(s1: string, s2: string): boolean { if (s1.length !== s2.length) return false; if (s1 === s2) return true; const key = s1 + '#' + s2; if (this.memo.has(key)) return this.memo.get(key)!; const sorted1 = s1.split('').sort().join(''); const sorted2 = s2.split('').sort().join(''); if (sorted1 !== sorted2) { this.memo.set(key, false); return false; } const n = s1.length; for (let i = 1; i < n; i++) { if (this.isScramble(s1.slice(0, i), s2.slice(0, i)) && this.isScramble(s1.slice(i), s2.slice(i))) { this.memo.set(key, true); return true; } if (this.isScramble(s1.slice(0, i), s2.slice(n - i)) && this.isScramble(s1.slice(i), s2.slice(0, n - i))) { this.memo.set(key, true); return true; } } this.memo.set(key, false); return false; }
    clearMemo(): void { this.memo.clear(); }
}
export const mysticScrambleString = MysticScrambleString.getInstance();
