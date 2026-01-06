/**
 * Quantum Island Problems
 */
import { EventEmitter } from 'events';
export class QuantumIslandProblems extends EventEmitter {
    private static instance: QuantumIslandProblems;
    private constructor() { super(); }
    static getInstance(): QuantumIslandProblems { if (!QuantumIslandProblems.instance) { QuantumIslandProblems.instance = new QuantumIslandProblems(); } return QuantumIslandProblems.instance; }
    numIslands(grid: string[][]): number { const m = grid.length, n = grid[0].length; let count = 0; const dfs = (i: number, j: number): void => { if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] !== '1') return; grid[i][j] = '0'; dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1); }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (grid[i][j] === '1') { count++; dfs(i, j); } return count; }
    maxAreaOfIsland(grid: number[][]): number { const m = grid.length, n = grid[0].length; let maxArea = 0; const dfs = (i: number, j: number): number => { if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] !== 1) return 0; grid[i][j] = 0; return 1 + dfs(i + 1, j) + dfs(i - 1, j) + dfs(i, j + 1) + dfs(i, j - 1); }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 1) maxArea = Math.max(maxArea, dfs(i, j)); return maxArea; }
    islandPerimeter(grid: number[][]): number { const m = grid.length, n = grid[0].length; let perimeter = 0; for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { if (grid[i][j] === 1) { perimeter += 4; if (i > 0 && grid[i - 1][j] === 1) perimeter -= 2; if (j > 0 && grid[i][j - 1] === 1) perimeter -= 2; } } } return perimeter; }
}
export const quantumIslandProblems = QuantumIslandProblems.getInstance();
