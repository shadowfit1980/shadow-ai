/**
 * Mystic Reader
 */
import { EventEmitter } from 'events';
export class MysticReader<E, A> extends EventEmitter {
    private reader: (env: E) => A;
    constructor(reader: (env: E) => A) { super(); this.reader = reader; }
    static of<E, A>(value: A): MysticReader<E, A> { return new MysticReader(() => value); }
    static ask<E>(): MysticReader<E, E> { return new MysticReader(env => env); }
    run(env: E): A { return this.reader(env); }
    map<B>(fn: (a: A) => B): MysticReader<E, B> { return new MysticReader(env => fn(this.run(env))); }
    flatMap<B>(fn: (a: A) => MysticReader<E, B>): MysticReader<E, B> { return new MysticReader(env => fn(this.run(env)).run(env)); }
    local<E2>(fn: (e2: E2) => E): MysticReader<E2, A> { return new MysticReader(env => this.run(fn(env))); }
}
export const reader = <E, A>(fn: (env: E) => A) => new MysticReader<E, A>(fn);
