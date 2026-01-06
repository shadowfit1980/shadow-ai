/**
 * Cosmic Friend Circles
 */
import { EventEmitter } from 'events';
export class CosmicFriendCircles extends EventEmitter {
    private static instance: CosmicFriendCircles;
    private constructor() { super(); }
    static getInstance(): CosmicFriendCircles { if (!CosmicFriendCircles.instance) { CosmicFriendCircles.instance = new CosmicFriendCircles(); } return CosmicFriendCircles.instance; }
    findCircleNum(isConnected: number[][]): number { const n = isConnected.length; const visited = new Set<number>(); let count = 0; const dfs = (i: number) => { for (let j = 0; j < n; j++) if (isConnected[i][j] === 1 && !visited.has(j)) { visited.add(j); dfs(j); } }; for (let i = 0; i < n; i++) if (!visited.has(i)) { visited.add(i); dfs(i); count++; } return count; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const cosmicFriendCircles = CosmicFriendCircles.getInstance();
