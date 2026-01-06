/**
 * Quantum Task
 */
import { EventEmitter } from 'events';
export class QuantumTask<T> extends EventEmitter {
    private computation: () => Promise<T>;
    private constructor(computation: () => Promise<T>) { super(); this.computation = computation; }
    static of<T>(value: T): QuantumTask<T> { return new QuantumTask(() => Promise.resolve(value)); }
    static from<T>(computation: () => Promise<T>): QuantumTask<T> { return new QuantumTask(computation); }
    static rejected<T>(error: Error): QuantumTask<T> { return new QuantumTask(() => Promise.reject(error)); }
    fork(): Promise<T> { return this.computation(); }
    map<U>(fn: (value: T) => U): QuantumTask<U> { return new QuantumTask(async () => fn(await this.computation())); }
    flatMap<U>(fn: (value: T) => QuantumTask<U>): QuantumTask<U> { return new QuantumTask(async () => fn(await this.computation()).fork()); }
    chain<U>(fn: (value: T) => QuantumTask<U>): QuantumTask<U> { return this.flatMap(fn); }
}
export const task = <T>(computation: () => Promise<T>) => QuantumTask.from(computation);
