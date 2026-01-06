/**
 * Cosmic Option
 */
import { EventEmitter } from 'events';
export class CosmicOption<T> extends EventEmitter {
    private value: T | undefined;
    private constructor(value?: T) { super(); this.value = value; }
    static some<T>(value: T): CosmicOption<T> { return new CosmicOption<T>(value); }
    static none<T>(): CosmicOption<T> { return new CosmicOption<T>(); }
    isSome(): boolean { return this.value !== undefined; }
    isNone(): boolean { return this.value === undefined; }
    unwrap(): T { if (this.isNone()) throw new Error('Unwrap called on None'); return this.value!; }
    unwrapOr(defaultValue: T): T { return this.isSome() ? this.value! : defaultValue; }
    map<U>(fn: (value: T) => U): CosmicOption<U> { return this.isSome() ? CosmicOption.some(fn(this.value!)) : CosmicOption.none<U>(); }
    flatMap<U>(fn: (value: T) => CosmicOption<U>): CosmicOption<U> { return this.isSome() ? fn(this.value!) : CosmicOption.none<U>(); }
}
