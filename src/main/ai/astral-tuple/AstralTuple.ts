/**
 * Astral Tuple
 */
import { EventEmitter } from 'events';
export class AstralTuple<T extends unknown[]> extends EventEmitter {
    private values: T;
    constructor(...values: T) { super(); this.values = values; }
    get<K extends keyof T>(index: K): T[K] { return this.values[index]; }
    toArray(): T { return [...this.values] as T; }
    map<U>(fn: (value: T[number], index: number) => U): U[] { return this.values.map(fn); }
    static pair<A, B>(a: A, b: B): AstralTuple<[A, B]> { return new AstralTuple(a, b); }
    static triple<A, B, C>(a: A, b: B, c: C): AstralTuple<[A, B, C]> { return new AstralTuple(a, b, c); }
}
export const tuple = <T extends unknown[]>(...values: T) => new AstralTuple<T>(...values);
