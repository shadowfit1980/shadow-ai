/**
 * Quantum Walls And Gates
 */
import { EventEmitter } from 'events';
export class QuantumWallsAndGates extends EventEmitter {
    private static instance: QuantumWallsAndGates;
    private constructor() { super(); }
    static getInstance(): QuantumWallsAndGates { if (!QuantumWallsAndGates.instance) { QuantumWallsAndGates.instance = new QuantumWallsAndGates(); } return QuantumWallsAndGates.instance; }
    wallsAndGates(rooms: number[][]): void { const INF = 2147483647; const m = rooms.length, n = rooms[0].length; const queue: [number, number][] = []; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (rooms[i][j] === 0) queue.push([i, j]); const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (queue.length) { const [x, y] = queue.shift()!; for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < m && ny >= 0 && ny < n && rooms[nx][ny] === INF) { rooms[nx][ny] = rooms[x][y] + 1; queue.push([nx, ny]); } } } }
}
export const quantumWallsAndGates = QuantumWallsAndGates.getInstance();
