/**
 * Astral Rotting Oranges
 */
import { EventEmitter } from 'events';
export class AstralRottingOranges extends EventEmitter {
    private static instance: AstralRottingOranges;
    private constructor() { super(); }
    static getInstance(): AstralRottingOranges { if (!AstralRottingOranges.instance) { AstralRottingOranges.instance = new AstralRottingOranges(); } return AstralRottingOranges.instance; }
    orangesRotting(grid: number[][]): number { const m = grid.length, n = grid[0].length; const queue: [number, number][] = []; let fresh = 0; for (let i = 0; i < m; i++) { for (let j = 0; j < n; j++) { if (grid[i][j] === 2) queue.push([i, j]); else if (grid[i][j] === 1) fresh++; } } if (fresh === 0) return 0; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; let minutes = 0; while (queue.length && fresh > 0) { minutes++; const size = queue.length; for (let i = 0; i < size; i++) { const [x, y] = queue.shift()!; for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < m && ny >= 0 && ny < n && grid[nx][ny] === 1) { grid[nx][ny] = 2; fresh--; queue.push([nx, ny]); } } } } return fresh === 0 ? minutes : -1; }
}
export const astralRottingOranges = AstralRottingOranges.getInstance();
