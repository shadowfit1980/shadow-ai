/**
 * Dimensional IO
 */
import { EventEmitter } from 'events';
export class DimensionalIO<T> extends EventEmitter {
    private effect: () => T;
    private constructor(effect: () => T) { super(); this.effect = effect; }
    static of<T>(value: T): DimensionalIO<T> { return new DimensionalIO(() => value); }
    static from<T>(effect: () => T): DimensionalIO<T> { return new DimensionalIO(effect); }
    run(): T { return this.effect(); }
    map<U>(fn: (value: T) => U): DimensionalIO<U> { return new DimensionalIO(() => fn(this.run())); }
    flatMap<U>(fn: (value: T) => DimensionalIO<U>): DimensionalIO<U> { return new DimensionalIO(() => fn(this.run()).run()); }
    chain<U>(fn: (value: T) => DimensionalIO<U>): DimensionalIO<U> { return this.flatMap(fn); }
}
export const io = <T>(effect: () => T) => DimensionalIO.from(effect);
