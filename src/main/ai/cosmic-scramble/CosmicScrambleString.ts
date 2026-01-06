/**
 * Cosmic Scramble String
 */
import { EventEmitter } from 'events';
export class CosmicScrambleString extends EventEmitter {
    private static instance: CosmicScrambleString;
    private memo: Map<string, boolean> = new Map();
    private constructor() { super(); }
    static getInstance(): CosmicScrambleString { if (!CosmicScrambleString.instance) { CosmicScrambleString.instance = new CosmicScrambleString(); } return CosmicScrambleString.instance; }
    isScramble(s1: string, s2: string): boolean { this.memo.clear(); return this.isScrambleHelper(s1, s2); }
    private isScrambleHelper(s1: string, s2: string): boolean { if (s1 === s2) return true; if (s1.length !== s2.length) return false; const key = s1 + '#' + s2; if (this.memo.has(key)) return this.memo.get(key)!; const sorted1 = s1.split('').sort().join(''); const sorted2 = s2.split('').sort().join(''); if (sorted1 !== sorted2) { this.memo.set(key, false); return false; } for (let i = 1; i < s1.length; i++) { if ((this.isScrambleHelper(s1.slice(0, i), s2.slice(0, i)) && this.isScrambleHelper(s1.slice(i), s2.slice(i))) || (this.isScrambleHelper(s1.slice(0, i), s2.slice(-i)) && this.isScrambleHelper(s1.slice(i), s2.slice(0, -i)))) { this.memo.set(key, true); return true; } } this.memo.set(key, false); return false; }
}
export const cosmicScrambleString = CosmicScrambleString.getInstance();
