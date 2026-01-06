/**
 * Cosmic Maze Solver
 */
import { EventEmitter } from 'events';
export class CosmicMazeSolver extends EventEmitter {
    private static instance: CosmicMazeSolver;
    private constructor() { super(); }
    static getInstance(): CosmicMazeSolver { if (!CosmicMazeSolver.instance) { CosmicMazeSolver.instance = new CosmicMazeSolver(); } return CosmicMazeSolver.instance; }
    hasPath(maze: number[][], start: number[], destination: number[]): boolean { const m = maze.length, n = maze[0].length; const visited = Array.from({ length: m }, () => new Array(n).fill(false)); const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; const queue: number[][] = [start]; visited[start[0]][start[1]] = true; while (queue.length) { const [x, y] = queue.shift()!; if (x === destination[0] && y === destination[1]) return true; for (const [dx, dy] of dirs) { let nx = x, ny = y; while (nx + dx >= 0 && nx + dx < m && ny + dy >= 0 && ny + dy < n && maze[nx + dx][ny + dy] === 0) { nx += dx; ny += dy; } if (!visited[nx][ny]) { visited[nx][ny] = true; queue.push([nx, ny]); } } } return false; }
    shortestDistance(maze: number[][], start: number[], destination: number[]): number { const m = maze.length, n = maze[0].length; const dist = Array.from({ length: m }, () => new Array(n).fill(Infinity)); dist[start[0]][start[1]] = 0; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; const queue: number[][] = [start]; while (queue.length) { const [x, y] = queue.shift()!; for (const [dx, dy] of dirs) { let nx = x, ny = y, steps = 0; while (nx + dx >= 0 && nx + dx < m && ny + dy >= 0 && ny + dy < n && maze[nx + dx][ny + dy] === 0) { nx += dx; ny += dy; steps++; } if (dist[x][y] + steps < dist[nx][ny]) { dist[nx][ny] = dist[x][y] + steps; queue.push([nx, ny]); } } } return dist[destination[0]][destination[1]] === Infinity ? -1 : dist[destination[0]][destination[1]]; }
}
export const cosmicMazeSolver = CosmicMazeSolver.getInstance();
