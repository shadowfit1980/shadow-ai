/**
 * Quantum Observable
 */
import { EventEmitter } from 'events';
export class QuantumObservable<T> extends EventEmitter {
    private value: T;
    private subscribers: ((value: T) => void)[] = [];
    constructor(initial: T) { super(); this.value = initial; }
    get(): T { return this.value; }
    set(value: T): void { this.value = value; for (const sub of this.subscribers) sub(value); this.emit('change', value); }
    subscribe(fn: (value: T) => void): () => void { this.subscribers.push(fn); return () => { this.subscribers = this.subscribers.filter(s => s !== fn); }; }
}
export const createObservable = <T>(initial: T) => new QuantumObservable<T>(initial);
