/**
 * Mystic Shortest Path
 */
import { EventEmitter } from 'events';
export class MysticShortestPath extends EventEmitter {
    private static instance: MysticShortestPath;
    private constructor() { super(); }
    static getInstance(): MysticShortestPath { if (!MysticShortestPath.instance) { MysticShortestPath.instance = new MysticShortestPath(); } return MysticShortestPath.instance; }
    shortestPathBinaryMatrix(grid: number[][]): number { const n = grid.length; if (grid[0][0] === 1 || grid[n - 1][n - 1] === 1) return -1; const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]; const queue: [number, number, number][] = [[0, 0, 1]]; grid[0][0] = 1; while (queue.length) { const [x, y, dist] = queue.shift()!; if (x === n - 1 && y === n - 1) return dist; for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < n && ny >= 0 && ny < n && grid[nx][ny] === 0) { grid[nx][ny] = 1; queue.push([nx, ny, dist + 1]); } } } return -1; }
    shortestPathWithObstacles(grid: number[][], k: number): number { const m = grid.length, n = grid[0].length; const queue: [number, number, number, number][] = [[0, 0, k, 0]]; const visited = new Set<string>(['0,0,' + k]); const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (queue.length) { const [x, y, remaining, dist] = queue.shift()!; if (x === m - 1 && y === n - 1) return dist; for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < m && ny >= 0 && ny < n) { const newK = remaining - grid[nx][ny]; const key = `${nx},${ny},${newK}`; if (newK >= 0 && !visited.has(key)) { visited.add(key); queue.push([nx, ny, newK, dist + 1]); } } } } return -1; }
}
export const mysticShortestPath = MysticShortestPath.getInstance();
