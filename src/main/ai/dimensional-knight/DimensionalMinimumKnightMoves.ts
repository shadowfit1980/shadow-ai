/**
 * Dimensional Minimum Knight Moves
 */
import { EventEmitter } from 'events';
export class DimensionalMinimumKnightMoves extends EventEmitter {
    private static instance: DimensionalMinimumKnightMoves;
    private constructor() { super(); }
    static getInstance(): DimensionalMinimumKnightMoves { if (!DimensionalMinimumKnightMoves.instance) { DimensionalMinimumKnightMoves.instance = new DimensionalMinimumKnightMoves(); } return DimensionalMinimumKnightMoves.instance; }
    minKnightMoves(x: number, y: number): number { x = Math.abs(x); y = Math.abs(y); const moves = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]; const queue: [number, number, number][] = [[0, 0, 0]]; const visited = new Set(['0,0']); while (queue.length) { const [cx, cy, steps] = queue.shift()!; if (cx === x && cy === y) return steps; for (const [dx, dy] of moves) { const nx = cx + dx, ny = cy + dy; const key = `${nx},${ny}`; if (!visited.has(key) && nx >= -2 && ny >= -2) { visited.add(key); queue.push([nx, ny, steps + 1]); } } } return -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalMinimumKnightMoves = DimensionalMinimumKnightMoves.getInstance();
