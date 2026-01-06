/**
 * Cosmic Monad
 */
import { EventEmitter } from 'events';
export class CosmicMonad<T> extends EventEmitter {
    private value: T;
    private constructor(value: T) { super(); this.value = value; }
    static of<T>(value: T): CosmicMonad<T> { return new CosmicMonad(value); }
    static pure<T>(value: T): CosmicMonad<T> { return CosmicMonad.of(value); }
    map<U>(fn: (value: T) => U): CosmicMonad<U> { return CosmicMonad.of(fn(this.value)); }
    flatMap<U>(fn: (value: T) => CosmicMonad<U>): CosmicMonad<U> { return fn(this.value); }
    chain<U>(fn: (value: T) => CosmicMonad<U>): CosmicMonad<U> { return this.flatMap(fn); }
    getValue(): T { return this.value; }
    join<U>(this: CosmicMonad<CosmicMonad<U>>): CosmicMonad<U> { return this.value; }
}
export const monad = <T>(value: T) => CosmicMonad.of(value);
