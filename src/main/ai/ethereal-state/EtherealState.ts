/**
 * Ethereal State
 */
import { EventEmitter } from 'events';
export class EtherealState<S, A> extends EventEmitter {
    private stateFn: (s: S) => [A, S];
    constructor(stateFn: (s: S) => [A, S]) { super(); this.stateFn = stateFn; }
    static of<S, A>(value: A): EtherealState<S, A> { return new EtherealState(s => [value, s]); }
    static get<S>(): EtherealState<S, S> { return new EtherealState(s => [s, s]); }
    static put<S>(s: S): EtherealState<S, void> { return new EtherealState(() => [undefined as void, s]); }
    static modify<S>(fn: (s: S) => S): EtherealState<S, void> { return new EtherealState(s => [undefined as void, fn(s)]); }
    run(s: S): [A, S] { return this.stateFn(s); }
    evalState(s: S): A { return this.run(s)[0]; }
    execState(s: S): S { return this.run(s)[1]; }
    map<B>(fn: (a: A) => B): EtherealState<S, B> { return new EtherealState(s => { const [a, s2] = this.run(s); return [fn(a), s2]; }); }
    flatMap<B>(fn: (a: A) => EtherealState<S, B>): EtherealState<S, B> { return new EtherealState(s => { const [a, s2] = this.run(s); return fn(a).run(s2); }); }
}
export const state = <S, A>(fn: (s: S) => [A, S]) => new EtherealState<S, A>(fn);
