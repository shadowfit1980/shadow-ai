/**
 * Astral Flip Game
 */
import { EventEmitter } from 'events';
export class AstralFlipGame extends EventEmitter {
    private static instance: AstralFlipGame;
    private memo: Map<string, boolean> = new Map();
    private constructor() { super(); }
    static getInstance(): AstralFlipGame { if (!AstralFlipGame.instance) { AstralFlipGame.instance = new AstralFlipGame(); } return AstralFlipGame.instance; }
    generatePossibleNextMoves(s: string): string[] { const result: string[] = []; for (let i = 0; i < s.length - 1; i++) { if (s[i] === '+' && s[i + 1] === '+') result.push(s.slice(0, i) + '--' + s.slice(i + 2)); } return result; }
    canWin(s: string): boolean { this.memo.clear(); return this.helper(s); }
    private helper(s: string): boolean { if (this.memo.has(s)) return this.memo.get(s)!; for (const next of this.generatePossibleNextMoves(s)) { if (!this.helper(next)) { this.memo.set(s, true); return true; } } this.memo.set(s, false); return false; }
}
export const astralFlipGame = AstralFlipGame.getInstance();
