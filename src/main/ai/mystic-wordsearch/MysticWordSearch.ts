/**
 * Mystic Word Search
 */
import { EventEmitter } from 'events';
export class MysticWordSearch extends EventEmitter {
    private static instance: MysticWordSearch;
    private constructor() { super(); }
    static getInstance(): MysticWordSearch { if (!MysticWordSearch.instance) { MysticWordSearch.instance = new MysticWordSearch(); } return MysticWordSearch.instance; }
    exist(board: string[][], word: string): boolean { const rows = board.length, cols = board[0].length; const dfs = (r: number, c: number, i: number): boolean => { if (i === word.length) return true; if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[i]) return false; const temp = board[r][c]; board[r][c] = '#'; const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1); board[r][c] = temp; return found; }; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (dfs(r, c, 0)) return true; return false; }
    getStats(): { searches: number } { return { searches: 0 }; }
}
export const mysticWordSearch = MysticWordSearch.getInstance();
