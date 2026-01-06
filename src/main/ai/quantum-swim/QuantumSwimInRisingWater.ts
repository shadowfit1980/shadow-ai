/**
 * Quantum Swim in Rising Water
 */
import { EventEmitter } from 'events';
export class QuantumSwimInRisingWater extends EventEmitter {
    private static instance: QuantumSwimInRisingWater;
    private constructor() { super(); }
    static getInstance(): QuantumSwimInRisingWater { if (!QuantumSwimInRisingWater.instance) { QuantumSwimInRisingWater.instance = new QuantumSwimInRisingWater(); } return QuantumSwimInRisingWater.instance; }
    swimInWater(grid: number[][]): number { const n = grid.length; const pq: [number, number, number][] = [[grid[0][0], 0, 0]]; const visited = new Set<string>(['0,0']); const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [t, r, c] = pq.shift()!; if (r === n - 1 && c === n - 1) return t; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; const key = `${nr},${nc}`; if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited.has(key)) { visited.add(key); pq.push([Math.max(t, grid[nr][nc]), nr, nc]); } } } return -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const quantumSwimInRisingWater = QuantumSwimInRisingWater.getInstance();
