/**
 * Astral Floyd-Warshall
 */
import { EventEmitter } from 'events';
export class AstralFloydWarshall extends EventEmitter {
    private static instance: AstralFloydWarshall;
    private constructor() { super(); }
    static getInstance(): AstralFloydWarshall { if (!AstralFloydWarshall.instance) { AstralFloydWarshall.instance = new AstralFloydWarshall(); } return AstralFloydWarshall.instance; }
    allPairs(matrix: number[][]): number[][] { const n = matrix.length; const dist = matrix.map(r => [...r]); for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j]; return dist; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const astralFloydWarshall = AstralFloydWarshall.getInstance();
