/**
 * Cosmic Surrounded Regions
 */
import { EventEmitter } from 'events';
export class CosmicSurroundedRegions extends EventEmitter {
    private static instance: CosmicSurroundedRegions;
    private constructor() { super(); }
    static getInstance(): CosmicSurroundedRegions { if (!CosmicSurroundedRegions.instance) { CosmicSurroundedRegions.instance = new CosmicSurroundedRegions(); } return CosmicSurroundedRegions.instance; }
    solve(board: string[][]): void { if (board.length === 0) return; const m = board.length, n = board[0].length; const dfs = (i: number, j: number): void => { if (i < 0 || i >= m || j < 0 || j >= n || board[i][j] !== 'O') return; board[i][j] = 'T'; dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1); }; for (let i = 0; i < m; i++) { dfs(i, 0); dfs(i, n - 1); } for (let j = 0; j < n; j++) { dfs(0, j); dfs(m - 1, j); } for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { if (board[i][j] === 'O') board[i][j] = 'X'; else if (board[i][j] === 'T') board[i][j] = 'O'; } } }
}
export const cosmicSurroundedRegions = CosmicSurroundedRegions.getInstance();
