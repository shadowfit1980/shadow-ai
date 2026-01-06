/**
 * Quantum Functor
 */
import { EventEmitter } from 'events';
export class QuantumFunctor<T> extends EventEmitter {
    private value: T;
    constructor(value: T) { super(); this.value = value; }
    static of<T>(value: T): QuantumFunctor<T> { return new QuantumFunctor(value); }
    map<U>(fn: (value: T) => U): QuantumFunctor<U> { return new QuantumFunctor(fn(this.value)); }
    flatMap<U>(fn: (value: T) => QuantumFunctor<U>): QuantumFunctor<U> { return fn(this.value); }
    getValue(): T { return this.value; }
    ap<U>(fn: QuantumFunctor<(value: T) => U>): QuantumFunctor<U> { return fn.map(f => f(this.value)); }
}
export const functor = <T>(value: T) => QuantumFunctor.of(value);
