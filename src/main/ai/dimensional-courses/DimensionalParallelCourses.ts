/**
 * Dimensional Parallel Courses
 */
import { EventEmitter } from 'events';
export class DimensionalParallelCourses extends EventEmitter {
    private static instance: DimensionalParallelCourses;
    private constructor() { super(); }
    static getInstance(): DimensionalParallelCourses { if (!DimensionalParallelCourses.instance) { DimensionalParallelCourses.instance = new DimensionalParallelCourses(); } return DimensionalParallelCourses.instance; }
    minimumSemesters(n: number, relations: number[][]): number { const graph = new Map<number, number[]>(); const inDegree = new Array(n + 1).fill(0); for (let i = 1; i <= n; i++) graph.set(i, []); for (const [prev, next] of relations) { graph.get(prev)!.push(next); inDegree[next]++; } let queue = []; for (let i = 1; i <= n; i++) if (inDegree[i] === 0) queue.push(i); let semesters = 0, studied = 0; while (queue.length) { semesters++; const next: number[] = []; for (const course of queue) { studied++; for (const neighbor of graph.get(course)!) { inDegree[neighbor]--; if (inDegree[neighbor] === 0) next.push(neighbor); } } queue = next; } return studied === n ? semesters : -1; }
    getStats(): { solved: number } { return { solved: 0 }; }
}
export const dimensionalParallelCourses = DimensionalParallelCourses.getInstance();
