/**
 * Mystic Try
 */
import { EventEmitter } from 'events';
export class MysticTry<T> extends EventEmitter {
    private value: T | undefined;
    private error: Error | undefined;
    private constructor(value?: T, error?: Error) { super(); this.value = value; this.error = error; }
    static of<T>(fn: () => T): MysticTry<T> { try { return new MysticTry<T>(fn()); } catch (e) { return new MysticTry<T>(undefined, e as Error); } }
    static async ofAsync<T>(fn: () => Promise<T>): Promise<MysticTry<T>> { try { return new MysticTry<T>(await fn()); } catch (e) { return new MysticTry<T>(undefined, e as Error); } }
    isSuccess(): boolean { return this.error === undefined; }
    isFailure(): boolean { return this.error !== undefined; }
    get(): T { if (this.isFailure()) throw this.error; return this.value!; }
    getOrElse(defaultValue: T): T { return this.isSuccess() ? this.value! : defaultValue; }
    map<U>(fn: (value: T) => U): MysticTry<U> { return this.isSuccess() ? MysticTry.of(() => fn(this.value!)) : new MysticTry<U>(undefined, this.error); }
}
