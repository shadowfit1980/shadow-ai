/**
 * Mystic Pacific Atlantic Water Flow
 */
import { EventEmitter } from 'events';
export class MysticPacificAtlanticWaterFlow extends EventEmitter {
    private static instance: MysticPacificAtlanticWaterFlow;
    private constructor() { super(); }
    static getInstance(): MysticPacificAtlanticWaterFlow { if (!MysticPacificAtlanticWaterFlow.instance) { MysticPacificAtlanticWaterFlow.instance = new MysticPacificAtlanticWaterFlow(); } return MysticPacificAtlanticWaterFlow.instance; }
    pacificAtlantic(heights: number[][]): number[][] { const m = heights.length, n = heights[0].length; const pacific = Array.from({ length: m }, () => Array(n).fill(false)); const atlantic = Array.from({ length: m }, () => Array(n).fill(false)); const dfs = (r: number, c: number, visited: boolean[][], prevHeight: number) => { if (r < 0 || r >= m || c < 0 || c >= n || visited[r][c] || heights[r][c] < prevHeight) return; visited[r][c] = true; dfs(r + 1, c, visited, heights[r][c]); dfs(r - 1, c, visited, heights[r][c]); dfs(r, c + 1, visited, heights[r][c]); dfs(r, c - 1, visited, heights[r][c]); }; for (let i = 0; i < m; i++) { dfs(i, 0, pacific, 0); dfs(i, n - 1, atlantic, 0); } for (let j = 0; j < n; j++) { dfs(0, j, pacific, 0); dfs(m - 1, j, atlantic, 0); } const result: number[][] = []; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (pacific[i][j] && atlantic[i][j]) result.push([i, j]); return result; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticPacificAtlanticWaterFlow = MysticPacificAtlanticWaterFlow.getInstance();
