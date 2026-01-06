/**
 * Astral Course Schedule
 */
import { EventEmitter } from 'events';
export class AstralCourseSchedule extends EventEmitter {
    private static instance: AstralCourseSchedule;
    private constructor() { super(); }
    static getInstance(): AstralCourseSchedule { if (!AstralCourseSchedule.instance) { AstralCourseSchedule.instance = new AstralCourseSchedule(); } return AstralCourseSchedule.instance; }
    canFinish(numCourses: number, prerequisites: number[][]): boolean { const graph = new Map<number, number[]>(); const inDegree = new Array(numCourses).fill(0); for (const [a, b] of prerequisites) { if (!graph.has(b)) graph.set(b, []); graph.get(b)!.push(a); inDegree[a]++; } const queue = inDegree.map((d, i) => d === 0 ? i : -1).filter(x => x >= 0); let count = 0; while (queue.length) { const curr = queue.shift()!; count++; for (const next of graph.get(curr) || []) { inDegree[next]--; if (inDegree[next] === 0) queue.push(next); } } return count === numCourses; }
    getStats(): { checked: number } { return { checked: 0 }; }
}
export const astralCourseSchedule = AstralCourseSchedule.getInstance();
