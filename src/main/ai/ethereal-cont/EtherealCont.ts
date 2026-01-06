/**
 * Ethereal Cont
 */
import { EventEmitter } from 'events';
export class EtherealCont<R, A> extends EventEmitter {
    private runCont: (k: (a: A) => R) => R;
    constructor(runCont: (k: (a: A) => R) => R) { super(); this.runCont = runCont; }
    static of<R, A>(value: A): EtherealCont<R, A> { return new EtherealCont(k => k(value)); }
    run(k: (a: A) => R): R { return this.runCont(k); }
    map<B>(fn: (a: A) => B): EtherealCont<R, B> { return new EtherealCont(k => this.run(a => k(fn(a)))); }
    flatMap<B>(fn: (a: A) => EtherealCont<R, B>): EtherealCont<R, B> { return new EtherealCont(k => this.run(a => fn(a).run(k))); }
}
export const cont = <R, A>(runCont: (k: (a: A) => R) => R) => new EtherealCont<R, A>(runCont);
