/**
 * Cosmic Path with Minimum Effort
 */
import { EventEmitter } from 'events';
export class CosmicPathMinimumEffort extends EventEmitter {
    private static instance: CosmicPathMinimumEffort;
    private constructor() { super(); }
    static getInstance(): CosmicPathMinimumEffort { if (!CosmicPathMinimumEffort.instance) { CosmicPathMinimumEffort.instance = new CosmicPathMinimumEffort(); } return CosmicPathMinimumEffort.instance; }
    minimumEffortPath(heights: number[][]): number { const m = heights.length, n = heights[0].length; const dist = Array.from({ length: m }, () => Array(n).fill(Infinity)); dist[0][0] = 0; const pq: [number, number, number][] = [[0, 0, 0]]; const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]; while (pq.length) { pq.sort((a, b) => a[0] - b[0]); const [d, r, c] = pq.shift()!; if (d > dist[r][c]) continue; if (r === m - 1 && c === n - 1) return d; for (const [dr, dc] of dirs) { const nr = r + dr, nc = c + dc; if (nr >= 0 && nr < m && nc >= 0 && nc < n) { const effort = Math.max(d, Math.abs(heights[nr][nc] - heights[r][c])); if (effort < dist[nr][nc]) { dist[nr][nc] = effort; pq.push([effort, nr, nc]); } } } } return 0; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const cosmicPathMinimumEffort = CosmicPathMinimumEffort.getInstance();
