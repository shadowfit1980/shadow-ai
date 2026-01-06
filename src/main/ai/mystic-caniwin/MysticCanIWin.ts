/**
 * Mystic Can I Win
 */
import { EventEmitter } from 'events';
export class MysticCanIWin extends EventEmitter {
    private static instance: MysticCanIWin;
    private memo: Map<number, boolean> = new Map();
    private constructor() { super(); }
    static getInstance(): MysticCanIWin { if (!MysticCanIWin.instance) { MysticCanIWin.instance = new MysticCanIWin(); } return MysticCanIWin.instance; }
    canIWin(maxChoosableInteger: number, desiredTotal: number): boolean { if (desiredTotal <= 0) return true; if ((maxChoosableInteger * (maxChoosableInteger + 1)) / 2 < desiredTotal) return false; this.memo.clear(); return this.canWin(0, desiredTotal, maxChoosableInteger); }
    private canWin(usedMask: number, remaining: number, max: number): boolean { if (this.memo.has(usedMask)) return this.memo.get(usedMask)!; for (let i = 1; i <= max; i++) { const bit = 1 << i; if (usedMask & bit) continue; if (i >= remaining || !this.canWin(usedMask | bit, remaining - i, max)) { this.memo.set(usedMask, true); return true; } } this.memo.set(usedMask, false); return false; }
}
export const mysticCanIWin = MysticCanIWin.getInstance();
