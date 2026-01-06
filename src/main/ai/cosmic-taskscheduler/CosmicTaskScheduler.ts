/**
 * Cosmic Task Scheduler
 */
import { EventEmitter } from 'events';
export class CosmicTaskScheduler extends EventEmitter {
    private static instance: CosmicTaskScheduler;
    private constructor() { super(); }
    static getInstance(): CosmicTaskScheduler { if (!CosmicTaskScheduler.instance) { CosmicTaskScheduler.instance = new CosmicTaskScheduler(); } return CosmicTaskScheduler.instance; }
    leastInterval(tasks: string[], n: number): number { const count = new Array(26).fill(0); for (const task of tasks) count[task.charCodeAt(0) - 65]++; count.sort((a, b) => b - a); const maxCount = count[0]; let numMaxTasks = 0; for (const c of count) if (c === maxCount) numMaxTasks++; return Math.max(tasks.length, (maxCount - 1) * (n + 1) + numMaxTasks); }
    taskSchedulerII(tasks: number[], space: number): number { const lastOccurrence: Map<number, number> = new Map(); let day = 0; for (const task of tasks) { day++; if (lastOccurrence.has(task)) { const waitUntil = lastOccurrence.get(task)! + space + 1; if (day < waitUntil) day = waitUntil; } lastOccurrence.set(task, day); } return day; }
}
export const cosmicTaskScheduler = CosmicTaskScheduler.getInstance();
