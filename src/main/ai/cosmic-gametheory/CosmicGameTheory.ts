/**
 * Cosmic Game Theory
 */
import { EventEmitter } from 'events';
export class CosmicGameTheory extends EventEmitter {
    private static instance: CosmicGameTheory;
    private constructor() { super(); }
    static getInstance(): CosmicGameTheory { if (!CosmicGameTheory.instance) { CosmicGameTheory.instance = new CosmicGameTheory(); } return CosmicGameTheory.instance; }
    nimValue(piles: number[]): number { return piles.reduce((a, b) => a ^ b, 0); }
    canWinNim(piles: number[]): boolean { return this.nimValue(piles) !== 0; }
    grundy(n: number, moves: number[]): number { return this.grundyMemo(n, moves, new Map()); }
    private grundyMemo(n: number, moves: number[], memo: Map<number, number>): number { if (n === 0) return 0; if (memo.has(n)) return memo.get(n)!; const reachable = new Set<number>(); for (const m of moves) if (n >= m) reachable.add(this.grundyMemo(n - m, moves, memo)); let mex = 0; while (reachable.has(mex)) mex++; memo.set(n, mex); return mex; }
    spraguGrundy(states: number[][]): boolean { let xor = 0; for (const state of states) xor ^= state.reduce((a, b) => a ^ b, 0); return xor !== 0; }
    minimax(position: number, depth: number, isMax: boolean, evaluate: (pos: number) => number, getMoves: (pos: number) => number[]): number { if (depth === 0) return evaluate(position); const moves = getMoves(position); if (moves.length === 0) return evaluate(position); if (isMax) { let best = -Infinity; for (const move of moves) best = Math.max(best, this.minimax(move, depth - 1, false, evaluate, getMoves)); return best; } else { let best = Infinity; for (const move of moves) best = Math.min(best, this.minimax(move, depth - 1, true, evaluate, getMoves)); return best; } }
}
export const cosmicGameTheory = CosmicGameTheory.getInstance();
