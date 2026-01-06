/**
 * Dimensional Shortest Bridge
 */
import { EventEmitter } from 'events';
export class DimensionalShortestBridge extends EventEmitter {
    private static instance: DimensionalShortestBridge;
    private constructor() { super(); }
    static getInstance(): DimensionalShortestBridge { if (!DimensionalShortestBridge.instance) { DimensionalShortestBridge.instance = new DimensionalShortestBridge(); } return DimensionalShortestBridge.instance; }
    shortestBridge(grid: number[][]): number { const n = grid.length; const queue: [number, number][] = []; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; const dfs = (r: number, c: number) => { if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] !== 1) return; grid[r][c] = 2; queue.push([r, c]); for (const [dr, dc] of dirs) dfs(r + dr, c + dc); }; outer: for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 1) { dfs(i, j); break outer; } let steps = 0; while (queue.length) { const size = queue.length; for (let i = 0; i < size; i++) { const [r, c] = queue.shift()!; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n) { if (grid[nr][nc] === 1) return steps; if (grid[nr][nc] === 0) { grid[nr][nc] = 2; queue.push([nr, nc]); } } } } steps++; } return -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalShortestBridge = DimensionalShortestBridge.getInstance();
