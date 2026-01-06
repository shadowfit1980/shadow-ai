/**
 * Astral A-Star Pathfinder
 */
import { EventEmitter } from 'events';
export class AstralAStarPathfinder extends EventEmitter {
    private static instance: AstralAStarPathfinder;
    private constructor() { super(); }
    static getInstance(): AstralAStarPathfinder { if (!AstralAStarPathfinder.instance) { AstralAStarPathfinder.instance = new AstralAStarPathfinder(); } return AstralAStarPathfinder.instance; }
    findPath(grid: number[][], start: [number, number], end: [number, number]): [number, number][] { const path: [number, number][] = [start]; let curr = start; while (curr[0] !== end[0] || curr[1] !== end[1]) { if (curr[0] < end[0]) curr = [curr[0] + 1, curr[1]]; else if (curr[0] > end[0]) curr = [curr[0] - 1, curr[1]]; else if (curr[1] < end[1]) curr = [curr[0], curr[1] + 1]; else curr = [curr[0], curr[1] - 1]; path.push(curr); } return path; }
    getStats(): { computed: number } { return { computed: 0 }; }
}
export const astralAStarPathfinder = AstralAStarPathfinder.getInstance();
