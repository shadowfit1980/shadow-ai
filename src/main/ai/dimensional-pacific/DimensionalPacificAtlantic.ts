/**
 * Dimensional Pacific Atlantic
 */
import { EventEmitter } from 'events';
export class DimensionalPacificAtlantic extends EventEmitter {
    private static instance: DimensionalPacificAtlantic;
    private constructor() { super(); }
    static getInstance(): DimensionalPacificAtlantic { if (!DimensionalPacificAtlantic.instance) { DimensionalPacificAtlantic.instance = new DimensionalPacificAtlantic(); } return DimensionalPacificAtlantic.instance; }
    pacificAtlantic(heights: number[][]): number[][] { if (heights.length === 0) return []; const m = heights.length, n = heights[0].length; const pacific = Array.from({ length: m }, () => new Array(n).fill(false)); const atlantic = Array.from({ length: m }, () => new Array(n).fill(false)); const dfs = (i: number, j: number, reachable: boolean[][], prevHeight: number): void => { if (i < 0 || i >= m || j < 0 || j >= n) return; if (reachable[i][j] || heights[i][j] < prevHeight) return; reachable[i][j] = true; dfs(i + 1, j, reachable, heights[i][j]); dfs(i - 1, j, reachable, heights[i][j]); dfs(i, j + 1, reachable, heights[i][j]); dfs(i, j - 1, reachable, heights[i][j]); }; for (let i = 0; i < m; i++) { dfs(i, 0, pacific, 0); dfs(i, n - 1, atlantic, 0); } for (let j = 0; j < n; j++) { dfs(0, j, pacific, 0); dfs(m - 1, j, atlantic, 0); } const result: number[][] = []; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (pacific[i][j] && atlantic[i][j]) result.push([i, j]); return result; }
}
export const dimensionalPacificAtlantic = DimensionalPacificAtlantic.getInstance();
