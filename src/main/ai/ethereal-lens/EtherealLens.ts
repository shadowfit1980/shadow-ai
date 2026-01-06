/**
 * Ethereal Lens
 */
import { EventEmitter } from 'events';
export class EtherealLens<S, A> extends EventEmitter {
    private getter: (s: S) => A;
    private setter: (a: A, s: S) => S;
    constructor(getter: (s: S) => A, setter: (a: A, s: S) => S) { super(); this.getter = getter; this.setter = setter; }
    get(source: S): A { return this.getter(source); }
    set(value: A, source: S): S { return this.setter(value, source); }
    modify(fn: (a: A) => A, source: S): S { return this.set(fn(this.get(source)), source); }
    compose<B>(other: EtherealLens<A, B>): EtherealLens<S, B> { return new EtherealLens(s => other.get(this.get(s)), (b, s) => this.set(other.set(b, this.get(s)), s)); }
}
export const createLens = <S, A>(get: (s: S) => A, set: (a: A, s: S) => S) => new EtherealLens<S, A>(get, set);
