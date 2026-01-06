/**
 * Astral Max Area Island
 */
import { EventEmitter } from 'events';
export class AstralMaxAreaIsland extends EventEmitter {
    private static instance: AstralMaxAreaIsland;
    private constructor() { super(); }
    static getInstance(): AstralMaxAreaIsland { if (!AstralMaxAreaIsland.instance) { AstralMaxAreaIsland.instance = new AstralMaxAreaIsland(); } return AstralMaxAreaIsland.instance; }
    maxAreaOfIsland(grid: number[][]): number { const m = grid.length, n = grid[0].length; let maxArea = 0; const dfs = (r: number, c: number): number => { if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] === 0) return 0; grid[r][c] = 0; return 1 + dfs(r + 1, c) + dfs(r - 1, c) + dfs(r, c + 1) + dfs(r, c - 1); }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 1) maxArea = Math.max(maxArea, dfs(i, j)); return maxArea; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const astralMaxAreaIsland = AstralMaxAreaIsland.getInstance();
