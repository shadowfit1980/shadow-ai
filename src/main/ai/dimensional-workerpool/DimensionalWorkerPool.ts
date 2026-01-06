/**
 * Dimensional Worker Pool
 */
import { EventEmitter } from 'events';
export class DimensionalWorkerPool<T, R> extends EventEmitter {
    private workers: ((task: T) => Promise<R>)[];
    private queue: { task: T; resolve: (result: R) => void; reject: (error: Error) => void }[] = [];
    private available: number[];
    constructor(workers: ((task: T) => Promise<R>)[]) { super(); this.workers = workers; this.available = workers.map((_, i) => i); }
    async execute(task: T): Promise<R> { if (this.available.length > 0) { const workerIdx = this.available.shift()!; try { const result = await this.workers[workerIdx](task); this.available.push(workerIdx); this.processQueue(); return result; } catch (err) { this.available.push(workerIdx); throw err; } } return new Promise<R>((resolve, reject) => { this.queue.push({ task, resolve, reject }); }); }
    private processQueue(): void { if (this.queue.length > 0 && this.available.length > 0) { const { task, resolve, reject } = this.queue.shift()!; this.execute(task).then(resolve).catch(reject); } }
}
export const createWorkerPool = <T, R>(workers: ((task: T) => Promise<R>)[]) => new DimensionalWorkerPool<T, R>(workers);
