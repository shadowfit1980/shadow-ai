/**
 * Dimensional Job Scheduling
 */
import { EventEmitter } from 'events';
export interface Job { id: number; deadline: number; profit: number; duration?: number; }
export class DimensionalJobScheduling extends EventEmitter {
    private static instance: DimensionalJobScheduling;
    private constructor() { super(); }
    static getInstance(): DimensionalJobScheduling { if (!DimensionalJobScheduling.instance) { DimensionalJobScheduling.instance = new DimensionalJobScheduling(); } return DimensionalJobScheduling.instance; }
    weightedJobScheduling(jobs: Job[]): { jobs: Job[]; totalProfit: number } { const sorted = [...jobs].sort((a, b) => b.profit - a.profit); const maxDeadline = Math.max(...sorted.map(j => j.deadline)); const slots = new Array(maxDeadline + 1).fill(false); const scheduled: Job[] = []; let totalProfit = 0; for (const job of sorted) { for (let i = job.deadline; i > 0; i--) { if (!slots[i]) { slots[i] = true; scheduled.push(job); totalProfit += job.profit; break; } } } return { jobs: scheduled, totalProfit }; }
    intervalScheduling(jobs: { start: number; end: number; id: number }[]): number[] { const sorted = [...jobs].sort((a, b) => a.end - b.end); const result: number[] = []; let lastEnd = -Infinity; for (const job of sorted) { if (job.start >= lastEnd) { result.push(job.id); lastEnd = job.end; } } return result; }
    parallelMachines(jobs: { duration: number; id: number }[], numMachines: number): number[][] { const machines: { load: number; jobs: number[] }[] = Array.from({ length: numMachines }, () => ({ load: 0, jobs: [] })); const sorted = [...jobs].sort((a, b) => b.duration - a.duration); for (const job of sorted) { let minLoad = Infinity, minIdx = 0; for (let i = 0; i < numMachines; i++) { if (machines[i].load < minLoad) { minLoad = machines[i].load; minIdx = i; } } machines[minIdx].jobs.push(job.id); machines[minIdx].load += job.duration; } return machines.map(m => m.jobs); }
}
export const dimensionalJobScheduling = DimensionalJobScheduling.getInstance();
