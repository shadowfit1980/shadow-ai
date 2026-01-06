/**
 * Cosmic Free
 */
import { EventEmitter } from 'events';
export type Free<F, A> = Pure<A> | Suspend<F, A>;
export class Pure<A> extends EventEmitter { constructor(public value: A) { super(); } }
export class Suspend<F, A> extends EventEmitter { constructor(public effect: F, public cont: (f: F) => Free<F, A>) { super(); } }
export const pure = <A>(a: A): Pure<A> => new Pure(a);
export const liftF = <F, A>(effect: F): Free<F, A> => new Suspend<F, A>(effect, () => pure(undefined as unknown as A) as unknown as Free<F, A>);
