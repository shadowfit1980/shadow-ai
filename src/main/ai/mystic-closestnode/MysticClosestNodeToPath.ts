/**
 * Mystic Closest Node to Path
 */
import { EventEmitter } from 'events';
export class MysticClosestNodeToPath extends EventEmitter {
    private static instance: MysticClosestNodeToPath;
    private constructor() { super(); }
    static getInstance(): MysticClosestNodeToPath { if (!MysticClosestNodeToPath.instance) { MysticClosestNodeToPath.instance = new MysticClosestNodeToPath(); } return MysticClosestNodeToPath.instance; }
    closestMeetingNode(edges: number[], node1: number, node2: number): number { const n = edges.length; const dist1 = new Array(n).fill(-1); const dist2 = new Array(n).fill(-1); let curr = node1, d = 0; while (curr !== -1 && dist1[curr] === -1) { dist1[curr] = d++; curr = edges[curr]; } curr = node2; d = 0; while (curr !== -1 && dist2[curr] === -1) { dist2[curr] = d++; curr = edges[curr]; } let minDist = Infinity, result = -1; for (let i = 0; i < n; i++) if (dist1[i] !== -1 && dist2[i] !== -1) { const maxD = Math.max(dist1[i], dist2[i]); if (maxD < minDist) { minDist = maxD; result = i; } } return result; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const mysticClosestNodeToPath = MysticClosestNodeToPath.getInstance();
