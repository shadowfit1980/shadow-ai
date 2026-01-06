/**
 * Ethereal Walls and Gates
 */
import { EventEmitter } from 'events';
export class EtherealWallsAndGates extends EventEmitter {
    private static instance: EtherealWallsAndGates;
    private constructor() { super(); }
    static getInstance(): EtherealWallsAndGates { if (!EtherealWallsAndGates.instance) { EtherealWallsAndGates.instance = new EtherealWallsAndGates(); } return EtherealWallsAndGates.instance; }
    wallsAndGates(rooms: number[][]): void { const INF = 2147483647; const m = rooms.length, n = rooms[0].length; const queue: [number, number][] = []; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (rooms[i][j] === 0) queue.push([i, j]); const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (queue.length) { const [r, c] = queue.shift()!; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < m && nc >= 0 && nc < n && rooms[nr][nc] === INF) { rooms[nr][nc] = rooms[r][c] + 1; queue.push([nr, nc]); } } } }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const etherealWallsAndGates = EtherealWallsAndGates.getInstance();
