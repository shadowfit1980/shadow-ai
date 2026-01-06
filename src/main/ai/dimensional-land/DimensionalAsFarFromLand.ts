/**
 * Dimensional As Far from Land
 */
import { EventEmitter } from 'events';
export class DimensionalAsFarFromLand extends EventEmitter {
    private static instance: DimensionalAsFarFromLand;
    private constructor() { super(); }
    static getInstance(): DimensionalAsFarFromLand { if (!DimensionalAsFarFromLand.instance) { DimensionalAsFarFromLand.instance = new DimensionalAsFarFromLand(); } return DimensionalAsFarFromLand.instance; }
    maxDistance(grid: number[][]): number { const n = grid.length; const queue: [number, number][] = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 1) queue.push([i, j]); if (queue.length === 0 || queue.length === n * n) return -1; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; let dist = -1; while (queue.length) { dist++; const size = queue.length; for (let i = 0; i < size; i++) { const [r, c] = queue.shift()!; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] === 0) { grid[nr][nc] = 1; queue.push([nr, nc]); } } } } return dist; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalAsFarFromLand = DimensionalAsFarFromLand.getInstance();
