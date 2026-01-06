/**
 * Mystic Making Large Island
 */
import { EventEmitter } from 'events';
export class MysticMakingLargeIsland extends EventEmitter {
    private static instance: MysticMakingLargeIsland;
    private constructor() { super(); }
    static getInstance(): MysticMakingLargeIsland { if (!MysticMakingLargeIsland.instance) { MysticMakingLargeIsland.instance = new MysticMakingLargeIsland(); } return MysticMakingLargeIsland.instance; }
    largestIsland(grid: number[][]): number { const n = grid.length; const sizes = new Map<number, number>(); let id = 2; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; const dfs = (r: number, c: number, id: number): number => { if (r < 0 || r >= n || c < 0 || c >= n || grid[r][c] !== 1) return 0; grid[r][c] = id; return 1 + dirs.reduce((s, [dr, dc]) => s + dfs(r + dr, c + dc, id), 0); }; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 1) { const size = dfs(i, j, id); sizes.set(id++, size); } let max = Math.max(0, ...sizes.values()); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (grid[i][j] === 0) { const neighbors = new Set(dirs.map(([dr, dc]) => grid[i + dr]?.[j + dc]).filter(x => x > 1)); const size = 1 + [...neighbors].reduce((s, id) => s + (sizes.get(id) || 0), 0); max = Math.max(max, size); } return max; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticMakingLargeIsland = MysticMakingLargeIsland.getInstance();
