/**
 * Quantum Pool
 */
import { EventEmitter } from 'events';
export class QuantumObjectPool<T> extends EventEmitter {
    private pool: T[] = [];
    private creator: () => T;
    constructor(creator: () => T, initialSize: number = 0) { super(); this.creator = creator; for (let i = 0; i < initialSize; i++) this.pool.push(creator()); }
    acquire(): T { return this.pool.pop() || this.creator(); }
    release(obj: T): void { this.pool.push(obj); }
    size(): number { return this.pool.length; }
}
export const createObjectPool = <T>(creator: () => T, size?: number) => new QuantumObjectPool<T>(creator, size);
