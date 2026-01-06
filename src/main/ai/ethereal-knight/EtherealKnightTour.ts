/**
 * Ethereal Knight Tour
 */
import { EventEmitter } from 'events';
export class EtherealKnightTour extends EventEmitter {
    private static instance: EtherealKnightTour;
    private moves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    private constructor() { super(); }
    static getInstance(): EtherealKnightTour { if (!EtherealKnightTour.instance) { EtherealKnightTour.instance = new EtherealKnightTour(); } return EtherealKnightTour.instance; }
    solve(n: number): number[][] { const board = Array.from({ length: n }, () => Array(n).fill(-1)); board[0][0] = 0; if (this.tour(board, 0, 0, 1, n)) return board; return []; }
    private tour(board: number[][], r: number, c: number, move: number, n: number): boolean { if (move === n * n) return true; for (const [dr, dc] of this.moves) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && board[nr][nc] === -1) { board[nr][nc] = move; if (this.tour(board, nr, nc, move + 1, n)) return true; board[nr][nc] = -1; } } return false; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const etherealKnightTour = EtherealKnightTour.getInstance();
