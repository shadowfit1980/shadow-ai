/**
 * Astral Writer
 */
import { EventEmitter } from 'events';
export class AstralWriter<W, A> extends EventEmitter {
    private value: A;
    private log: W[];
    private constructor(value: A, log: W[] = []) { super(); this.value = value; this.log = log; }
    static of<W, A>(value: A): AstralWriter<W, A> { return new AstralWriter(value); }
    static tell<W>(w: W): AstralWriter<W, void> { return new AstralWriter(undefined as void, [w]); }
    getValue(): A { return this.value; }
    getLog(): W[] { return [...this.log]; }
    map<B>(fn: (a: A) => B): AstralWriter<W, B> { return new AstralWriter(fn(this.value), this.log); }
    flatMap<B>(fn: (a: A) => AstralWriter<W, B>): AstralWriter<W, B> { const result = fn(this.value); return new AstralWriter(result.value, [...this.log, ...result.log]); }
}
export const writer = <W, A>(value: A) => AstralWriter.of<W, A>(value);
