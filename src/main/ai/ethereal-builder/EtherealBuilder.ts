/**
 * Ethereal Builder
 */
import { EventEmitter } from 'events';
export class EtherealBuilder<T extends object> extends EventEmitter {
    private obj: Partial<T> = {};
    set<K extends keyof T>(key: K, value: T[K]): this { this.obj[key] = value; return this; }
    build(): T { return this.obj as T; }
    reset(): void { this.obj = {}; }
}
export const createBuilder = <T extends object>() => new EtherealBuilder<T>();
