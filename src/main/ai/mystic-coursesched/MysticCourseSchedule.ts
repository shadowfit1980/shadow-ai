/**
 * Mystic Course Schedule
 */
import { EventEmitter } from 'events';
export class MysticCourseSchedule extends EventEmitter {
    private static instance: MysticCourseSchedule;
    private constructor() { super(); }
    static getInstance(): MysticCourseSchedule { if (!MysticCourseSchedule.instance) { MysticCourseSchedule.instance = new MysticCourseSchedule(); } return MysticCourseSchedule.instance; }
    canFinish(numCourses: number, prerequisites: number[][]): boolean { const graph: number[][] = Array.from({ length: numCourses }, () => []); const inDegree = new Array(numCourses).fill(0); for (const [a, b] of prerequisites) { graph[b].push(a); inDegree[a]++; } const queue = inDegree.map((d, i) => d === 0 ? i : -1).filter(x => x >= 0); let completed = 0; while (queue.length) { const course = queue.shift()!; completed++; for (const next of graph[course]) { inDegree[next]--; if (inDegree[next] === 0) queue.push(next); } } return completed === numCourses; }
    findOrder(numCourses: number, prerequisites: number[][]): number[] { const graph: number[][] = Array.from({ length: numCourses }, () => []); const inDegree = new Array(numCourses).fill(0); for (const [a, b] of prerequisites) { graph[b].push(a); inDegree[a]++; } const queue = inDegree.map((d, i) => d === 0 ? i : -1).filter(x => x >= 0); const order: number[] = []; while (queue.length) { const course = queue.shift()!; order.push(course); for (const next of graph[course]) { inDegree[next]--; if (inDegree[next] === 0) queue.push(next); } } return order.length === numCourses ? order : []; }
}
export const mysticCourseSchedule = MysticCourseSchedule.getInstance();
