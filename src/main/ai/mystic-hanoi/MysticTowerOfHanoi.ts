/**
 * Mystic Tower of Hanoi
 */
import { EventEmitter } from 'events';
export interface HanoiMove { disk: number; from: string; to: string; }
export class MysticTowerOfHanoi extends EventEmitter {
    private static instance: MysticTowerOfHanoi;
    private constructor() { super(); }
    static getInstance(): MysticTowerOfHanoi { if (!MysticTowerOfHanoi.instance) { MysticTowerOfHanoi.instance = new MysticTowerOfHanoi(); } return MysticTowerOfHanoi.instance; }
    solve(n: number): HanoiMove[] { const moves: HanoiMove[] = []; this.hanoi(n, 'A', 'C', 'B', moves); return moves; }
    private hanoi(n: number, from: string, to: string, aux: string, moves: HanoiMove[]): void { if (n === 1) { moves.push({ disk: 1, from, to }); return; } this.hanoi(n - 1, from, aux, to, moves); moves.push({ disk: n, from, to }); this.hanoi(n - 1, aux, to, from, moves); }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticTowerOfHanoi = MysticTowerOfHanoi.getInstance();
