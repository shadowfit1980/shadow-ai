/**
 * Cosmic Snakes and Ladders
 */
import { EventEmitter } from 'events';
export class CosmicSnakesAndLadders extends EventEmitter {
    private static instance: CosmicSnakesAndLadders;
    private constructor() { super(); }
    static getInstance(): CosmicSnakesAndLadders { if (!CosmicSnakesAndLadders.instance) { CosmicSnakesAndLadders.instance = new CosmicSnakesAndLadders(); } return CosmicSnakesAndLadders.instance; }
    snakesAndLadders(board: number[][]): number { const n = board.length; const getPos = (s: number): [number, number] => { const r = Math.floor((s - 1) / n), c = (s - 1) % n; return [n - 1 - r, r % 2 === 0 ? c : n - 1 - c]; }; const queue: [number, number][] = [[1, 0]]; const visited = new Set([1]); while (queue.length) { const [curr, moves] = queue.shift()!; for (let i = 1; i <= 6; i++) { let next = curr + i; if (next > n * n) continue; const [r, c] = getPos(next); if (board[r][c] !== -1) next = board[r][c]; if (next === n * n) return moves + 1; if (!visited.has(next)) { visited.add(next); queue.push([next, moves + 1]); } } } return -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const cosmicSnakesAndLadders = CosmicSnakesAndLadders.getInstance();
