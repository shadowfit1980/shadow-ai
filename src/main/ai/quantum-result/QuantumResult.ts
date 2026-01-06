/**
 * Quantum Result
 */
import { EventEmitter } from 'events';
export class QuantumResult<T, E> extends EventEmitter {
    private value: T | undefined;
    private error: E | undefined;
    private constructor(value?: T, error?: E) { super(); this.value = value; this.error = error; }
    static ok<T, E>(value: T): QuantumResult<T, E> { return new QuantumResult<T, E>(value); }
    static err<T, E>(error: E): QuantumResult<T, E> { return new QuantumResult<T, E>(undefined, error); }
    isOk(): boolean { return this.error === undefined; }
    isErr(): boolean { return this.error !== undefined; }
    unwrap(): T { if (this.isErr()) throw new Error('Unwrap called on Err'); return this.value!; }
    unwrapErr(): E { if (this.isOk()) throw new Error('Unwrap called on Ok'); return this.error!; }
    unwrapOr(defaultValue: T): T { return this.isOk() ? this.value! : defaultValue; }
    map<U>(fn: (value: T) => U): QuantumResult<U, E> { return this.isOk() ? QuantumResult.ok<U, E>(fn(this.value!)) : QuantumResult.err<U, E>(this.error!); }
}
