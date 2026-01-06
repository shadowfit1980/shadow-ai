/**
 * Quantum Parallel
 */
import { EventEmitter } from 'events';
export class QuantumParallel extends EventEmitter {
    private static instance: QuantumParallel;
    private constructor() { super(); }
    static getInstance(): QuantumParallel { if (!QuantumParallel.instance) { QuantumParallel.instance = new QuantumParallel(); } return QuantumParallel.instance; }
    all<T>(tasks: Promise<T>[]): Promise<T[]> { return Promise.all(tasks); }
    race<T>(tasks: Promise<T>[]): Promise<T> { return Promise.race(tasks); }
    allSettled<T>(tasks: Promise<T>[]): Promise<PromiseSettledResult<T>[]> { return Promise.allSettled(tasks); }
    anyOf<T>(tasks: Promise<T>[]): Promise<T> { return new Promise((resolve, reject) => { let remaining = tasks.length; tasks.forEach(t => t.then(resolve).catch(() => { if (--remaining === 0) reject(new Error('All promises rejected')); })); }); }
    sequence<T>(tasks: (() => Promise<T>)[]): Promise<T[]> { return tasks.reduce(async (acc, task) => [...await acc, await task()], Promise.resolve([] as T[])); }
    parallel<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> { return new Promise((resolve, reject) => { const results: T[] = []; let running = 0, index = 0; const runNext = () => { while (running < concurrency && index < tasks.length) { const i = index++; running++; tasks[i]().then(r => { results[i] = r; running--; if (index === tasks.length && running === 0) resolve(results); else runNext(); }).catch(reject); } }; runNext(); }); }
    getStats(): { executed: number } { return { executed: 0 }; }
}
export const quantumParallel = QuantumParallel.getInstance();
